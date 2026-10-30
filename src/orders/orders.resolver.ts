import { Args, Field, GraphQLISODateTime, ID, InputType, Int, Mutation, ObjectType, Query, Resolver, registerEnumType } from '@nestjs/graphql';
import { OrderFulfilment, OrderPaymentMethod, OrderStatus, PaymentStatus, ProductConditionType } from '@prisma/client';
import { Public } from '../auth/public.decorator';
import { OrdersService } from './orders.service';

registerEnumType(OrderFulfilment, { name: 'OrderFulfilment' });
registerEnumType(OrderPaymentMethod, { name: 'OrderPaymentMethod' });
registerEnumType(OrderStatus, { name: 'OrderStatus' });
registerEnumType(PaymentStatus, { name: 'PaymentStatus' });

@ObjectType()
class OrderItemRecord {
  @Field(() => ID) id!: string;
  @Field(() => ID, { nullable: true }) productId!: string | null;
  @Field(() => ID, { nullable: true }) productConditionId!: string | null;
  @Field() productName!: string;
  @Field() productSku!: string;
  @Field(() => ProductConditionType, { nullable: true }) condition!: ProductConditionType | null;
  @Field(() => Int) quantity!: number;
  @Field(() => Int) unitPrice!: number;
  @Field(() => Int) lineTotal!: number;
  @Field() inventoryTracked!: boolean;
}
@ObjectType()
class OrderRecord {
  @Field(() => ID) id!: string;
  @Field() orderNumber!: string;
  @Field() customerName!: string;
  @Field() customerPhone!: string;
  @Field() customerEmail!: string;
  @Field(() => OrderFulfilment) fulfilment!: OrderFulfilment;
  @Field() pickupLocation!: string;
  @Field() deliveryAddress!: string;
  @Field() deliveryArea!: string;
  @Field() deliveryNotes!: string;
  @Field(() => OrderPaymentMethod) paymentMethod!: OrderPaymentMethod;
  @Field() orderChannel!: string;
  @Field(() => PaymentStatus) paymentStatus!: PaymentStatus;
  @Field(() => OrderStatus) status!: OrderStatus;
  @Field(() => Int) subtotal!: number;
  @Field(() => Int) deliveryFee!: number;
  @Field(() => Int) total!: number;
  @Field(() => Int) depositRequired!: number;
  @Field(() => Int) amountPaid!: number;
  @Field() transactionReference!: string;
  @Field() customerNote!: string;
  @Field() adminNote!: string;
  @Field() trackingNumber!: string;
  @Field() inventoryReserved!: boolean;
  @Field() inventoryNote!: string;
  @Field(() => [OrderItemRecord]) items!: OrderItemRecord[];
  @Field(() => GraphQLISODateTime) createdAt!: Date;
  @Field(() => GraphQLISODateTime) updatedAt!: Date;
  @Field(() => GraphQLISODateTime, { nullable: true }) cancelledAt!: Date | null;
}
@InputType()
class OrderItemInput {
  @Field({ nullable: true }) productId?: string;
  @Field() productName!: string;
  @Field({ nullable: true }) productSku?: string;
  @Field(() => ProductConditionType, { nullable: true }) condition?: ProductConditionType;
  @Field(() => Int) quantity!: number;
  @Field(() => Int) unitPrice!: number;
}
@InputType()
class CreateOrderInput {
  @Field() customerName!: string;
  @Field() customerPhone!: string;
  @Field({ nullable: true }) customerEmail?: string;
  @Field(() => OrderFulfilment) fulfilment!: OrderFulfilment;
  @Field({ nullable: true }) pickupLocation?: string;
  @Field({ nullable: true }) deliveryAddress?: string;
  @Field({ nullable: true }) deliveryArea?: string;
  @Field({ nullable: true }) deliveryNotes?: string;
  @Field(() => OrderPaymentMethod) paymentMethod!: OrderPaymentMethod;
  @Field({ nullable: true }) orderChannel?: string;
  @Field({ nullable: true }) customerNote?: string;
  @Field(() => [OrderItemInput]) items!: OrderItemInput[];
}

@Resolver(() => OrderRecord)
export class OrdersResolver {
  constructor(private readonly orders: OrdersService) {}
  @Public()
  @Mutation(() => OrderRecord)
  placeOrder(@Args('input', { type: () => CreateOrderInput }) input: CreateOrderInput) { return this.orders.create(input); }
  @Query(() => [OrderRecord])
  ordersList(
    @Args('search', { type: () => String, nullable: true }) search = '',
    @Args('status', { type: () => String, nullable: true }) status = '',
    @Args('paymentStatus', { type: () => String, nullable: true }) paymentStatus = '',
  ) { return this.orders.list(search, status, paymentStatus); }
  @Query(() => OrderRecord)
  order(@Args('id', { type: () => ID }) id: string) { return this.orders.get(id); }
  @Mutation(() => OrderRecord)
  updateOrder(
    @Args('id', { type: () => ID }) id: string,
    @Args('status', { type: () => OrderStatus }) status: OrderStatus,
    @Args('paymentStatus', { type: () => PaymentStatus }) paymentStatus: PaymentStatus,
    @Args('amountPaid', { type: () => Int }) amountPaid: number,
    @Args('deliveryFee', { type: () => Int }) deliveryFee: number,
    @Args('adminNote', { nullable: true }) adminNote?: string,
    @Args('trackingNumber', { nullable: true }) trackingNumber?: string,
    @Args('transactionReference', { nullable: true }) transactionReference?: string,
  ) { return this.orders.update(id, status, paymentStatus, amountPaid, deliveryFee, adminNote, trackingNumber, transactionReference); }
  @Mutation(() => Boolean)
  deleteOrder(@Args('id', { type: () => ID }) id: string) { return this.orders.remove(id); }
}
