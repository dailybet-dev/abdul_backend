import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderFulfilment, OrderPaymentMethod, OrderStatus, PaymentStatus, Prisma, ProductConditionType } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

type OrderItemInputData = { productId?: string | null; productName: string; productSku?: string; condition?: ProductConditionType | null; quantity: number; unitPrice: number };
type CreateOrderData = {
  customerName: string; customerPhone: string; customerEmail?: string; fulfilment: OrderFulfilment;
  pickupLocation?: string; deliveryAddress?: string; deliveryArea?: string; deliveryNotes?: string;
  paymentMethod: OrderPaymentMethod; customerNote?: string; items: OrderItemInputData[];
};
const includeOrder = { items: { orderBy: { productName: 'asc' as const } } } satisfies Prisma.OrderInclude;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(search = '', status = '', paymentStatus = '') {
    const term = search.trim();
    return this.prisma.order.findMany({
      where: {
        ...(status && Object.values(OrderStatus).includes(status as OrderStatus) ? { status: status as OrderStatus } : {}),
        ...(paymentStatus && Object.values(PaymentStatus).includes(paymentStatus as PaymentStatus) ? { paymentStatus: paymentStatus as PaymentStatus } : {}),
        ...(term ? { OR: [
          { orderNumber: { contains: term, mode: 'insensitive' } },
          { customerName: { contains: term, mode: 'insensitive' } },
          { customerPhone: { contains: term } },
          { customerEmail: { contains: term, mode: 'insensitive' } },
          { items: { some: { productName: { contains: term, mode: 'insensitive' } } },
        ] } : {}),
      },
      include: includeOrder,
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }

  async get(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: includeOrder });
    if (!order) throw new NotFoundException('Order not found.');
    return order;
  }

  async create(input: CreateOrderData) {
    const customerName = input.customerName.trim();
    const customerPhone = input.customerPhone.trim();
    if (customerName.length < 2 || customerPhone.length < 7) throw new BadRequestException('A valid customer name and phone number are required.');
    if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 50) throw new BadRequestException('Add between 1 and 50 order lines.');
    if (input.fulfilment === OrderFulfilment.DELIVERY && (!input.deliveryAddress?.trim() || !input.deliveryArea?.trim())) throw new BadRequestException('Delivery address and town/area are required.');
    for (const item of input.items) {
      if (!item.productName?.trim() || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100 || !Number.isInteger(item.unitPrice) || item.unitPrice < 0) {
        throw new BadRequestException('Order items must have a product name, valid quantity and non-negative whole-number price.');
      }
    }

    return this.prisma.$transaction(async tx => {
      const prepared: Array<{
        productId: string | null; productConditionId: string | null; productName: string; productSku: string;
        condition: ProductConditionType | null; quantity: number; unitPrice: number; lineTotal: number; inventoryTracked: boolean;
      }> = [];
      const notes: string[] = [];
      let subtotal = 0;
      for (const item of input.items) {
        let product = item.productId ? await tx.product.findUnique({ where: { id: item.productId }, include: { conditions: true } }) : null;
        if (!product) product = await tx.product.findFirst({ where: { name: { equals: item.productName.trim(), mode: 'insensitive' } }, include: { conditions: true } });
        let condition = product?.conditions.find(c => c.condition === (item.condition || ProductConditionType.BRAND_NEW));
        if (!condition && product && item.condition == null && product.conditions.length === 1) condition = product.conditions[0];
        let finalPrice = item.unitPrice;
        let tracked = false;
        let productId: string | null = null;
        let conditionId: string | null = null;
        let sku = item.productSku?.trim() || '';
        let conditionValue: ProductConditionType | null = item.condition || null;
        if (product && condition) {
          if (!condition.isAvailable || condition.stock < item.quantity) throw new BadRequestException('Insufficient stock for ' + product.name + '. Please update your cart and try again.');
          finalPrice = condition.salePrice ?? condition.price;
          const changed = await tx.productCondition.updateMany({
            where: { id: condition.id, stock: { gte: item.quantity }, isAvailable: true },
            data: { stock: { decrement: item.quantity }, isAvailable: condition.stock - item.quantity > 0 },
          });
          if (changed.count !== 1) throw new BadRequestException('Stock changed while placing your order for ' + product.name + '. Please try again.');
          productId = product.id; conditionId = condition.id; sku = product.sku; conditionValue = condition.condition; tracked = true;
        } else {
          notes.push('Inventory not linked for “' + item.productName.trim() + '” (shop item ID: ' + (item.productId || 'not supplied') + '). Check stock manually before fulfilment.');
        }
        const lineTotal = finalPrice * item.quantity;
        subtotal += lineTotal;
        prepared.push({ productId, productConditionId: conditionId, productName: product?.name || item.productName.trim(), productSku: sku, condition: conditionValue, quantity: item.quantity, unitPrice: finalPrice, lineTotal, inventoryTracked: tracked });
      }
      if (subtotal > 2_000_000_000) throw new BadRequestException('Order total is too large.');
      const orderNumber = 'ABD-' + Date.now().toString().slice(-8) + '-' + randomBytes(2).toString('hex').toUpperCase();
      const depositRequired = input.paymentMethod === OrderPaymentMethod.CASH_ON_DELIVERY ? Math.ceil(subtotal / 2) : 0;
      const inventoryReserved = prepared.every(item => item.inventoryTracked);
      return tx.order.create({
        data: {
          orderNumber, customerName, customerPhone, customerEmail: input.customerEmail?.trim() || '',
          fulfilment: input.fulfilment, pickupLocation: input.fulfilment === OrderFulfilment.PICKUP ? (input.pickupLocation?.trim() || '') : '',
          deliveryAddress: input.deliveryAddress?.trim() || '', deliveryArea: input.deliveryArea?.trim() || '',
          deliveryNotes: input.deliveryNotes?.trim() || '', paymentMethod: input.paymentMethod,
          subtotal, deliveryFee: 0, total: subtotal, depositRequired, customerNote: input.customerNote?.trim() || '',
          inventoryReserved, inventoryNote: notes.join(' '),
          items: { create: prepared },
        },
        include: includeOrder,
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async update(id: string, status: OrderStatus, paymentStatus: PaymentStatus, amountPaid: number, deliveryFee: number, adminNote?: string, trackingNumber?: string, transactionReference?: string) {
    if (!Object.values(OrderStatus).includes(status) || !Object.values(PaymentStatus).includes(paymentStatus)) throw new BadRequestException('Invalid order or payment status.');
    if (!Number.isInteger(amountPaid) || amountPaid < 0 || !Number.isInteger(deliveryFee) || deliveryFee < 0) throw new BadRequestException('Amounts must be non-negative whole numbers.');
    return this.prisma.$transaction(async tx => {
      const current = await tx.order.findUnique({ where: { id }, include: { items: true } });
      if (!current) throw new NotFoundException('Order not found.');
      if (current.status !== OrderStatus.CANCELLED && status === OrderStatus.CANCELLED) {
        for (const item of current.items.filter(i => i.inventoryTracked && i.productConditionId)) {
          await tx.productCondition.update({ where: { id: item.productConditionId! }, data: { stock: { increment: item.quantity }, isAvailable: true } });
        }
      }
      if (current.status === OrderStatus.CANCELLED && status !== OrderStatus.CANCELLED) {
        for (const item of current.items.filter(i => i.inventoryTracked && i.productConditionId)) {
          const condition = await tx.productCondition.findUnique({ where: { id: item.productConditionId! }, select: { stock: true, isAvailable: true } });
          if (!condition || condition.stock < item.quantity) throw new BadRequestException('Cannot reopen this order: stock is no longer available.');
          const result = await tx.productCondition.updateMany({
            where: { id: item.productConditionId!, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity }, isAvailable: condition.stock - item.quantity > 0 },
          });
          if (result.count !== 1) throw new BadRequestException('Cannot reopen this order: stock changed while updating.');
        }
      }
      const total = current.subtotal + deliveryFee;
      const effectivePaid = Math.min(amountPaid, total);
      return tx.order.update({ where: { id }, data: {
        status, paymentStatus, amountPaid: effectivePaid, deliveryFee, total,
        depositRequired: current.paymentMethod === OrderPaymentMethod.CASH_ON_DELIVERY ? Math.ceil(current.subtotal / 2) : 0,
        adminNote: adminNote?.trim() ?? current.adminNote, trackingNumber: trackingNumber?.trim() ?? current.trackingNumber,
        transactionReference: transactionReference?.trim() ?? current.transactionReference,
        cancelledAt: status === OrderStatus.CANCELLED ? (current.cancelledAt || new Date()) : null,
      }, include: includeOrder });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async remove(id: string) {
    const order = await this.get(id);
    if (order.status !== OrderStatus.CANCELLED) throw new BadRequestException('Cancel an order first before deleting it. This preserves active order and stock history.');
    await this.prisma.order.delete({ where: { id } });
    return true;
  }
}
