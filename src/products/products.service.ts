import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductConditionType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type ProductConditionInputData = {
  condition: ProductConditionType;
  price: number;
  salePrice?: number | null;
  stock: number;
  isAvailable?: boolean;
  images?: string[];
};
export type ProductInputData = {
  name: string;
  sku?: string;
  description?: string;
  categoryId?: string | null;
  subcategoryId?: string | null;
  brandId?: string | null;
  conditions: ProductConditionInputData[];
};

const includeProduct = {
  category: { select: { id: true, name: true } },
  subcategory: { select: { id: true, name: true } },
  brand: { select: { id: true, name: true } },
  conditions: { orderBy: { condition: 'asc' as const } },
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  list(search = '') {
    const term = search.trim();
    return this.prisma.product.findMany({
      where: term ? { OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { sku: { contains: term, mode: 'insensitive' } },
        { brand: { is: { name: { contains: term, mode: 'insensitive' } } } },
        { category: { is: { name: { contains: term, mode: 'insensitive' } } } },
      ] } : undefined,
      include: includeProduct,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async get(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id }, include: includeProduct });
    if (!product) throw new NotFoundException('Product not found.');
    return product;
  }

  async nameExists(name: string, excludeId?: string) {
    const normalized = name.trim();
    if (!normalized) return false;
    const found = await this.prisma.product.findFirst({
      where: { name: { equals: normalized, mode: 'insensitive' }, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true, name: true },
    });
    return Boolean(found);
  }

  async create(input: ProductInputData) {
    const name = input.name.trim();
    if (!name) throw new BadRequestException('Product name is required.');
    if (await this.nameExists(name)) throw new BadRequestException('A product with the same name already exists.');
    const conditions = this.validateConditions(input.conditions);
    const sku = (input.sku || this.slugify(name).toUpperCase()).trim();
    const slug = this.slugify(name);
    if (!slug) throw new BadRequestException('A valid product name is required.');
    if (await this.prisma.product.findFirst({ where: { sku } })) throw new BadRequestException('This SKU already exists.');
    return this.prisma.product.create({
      data: {
        name, slug: await this.uniqueSlug(slug), sku,
        description: input.description?.trim() || '',
        categoryId: input.categoryId || null,
        subcategoryId: input.subcategoryId || null,
        brandId: input.brandId || null,
        conditions: { create: conditions },
      },
      include: includeProduct,
    });
  }

  async update(id: string, input: ProductInputData) {
    const current = await this.prisma.product.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Product not found.');
    const name = input.name.trim();
    if (!name) throw new BadRequestException('Product name is required.');
    if (await this.nameExists(name, id)) throw new BadRequestException('A product with the same name already exists.');
    const conditions = this.validateConditions(input.conditions);
    const sku = (input.sku || current.sku).trim();
    const skuOwner = await this.prisma.product.findFirst({ where: { sku, NOT: { id } } });
    if (skuOwner) throw new BadRequestException('This SKU already exists.');
    const slug = this.slugify(name);
    return this.prisma.$transaction(async tx => {
      await tx.product.update({ where: { id }, data: {
        name, slug: await this.uniqueSlug(slug, id), sku,
        description: input.description?.trim() || '',
        categoryId: input.categoryId || null,
        subcategoryId: input.subcategoryId || null,
        brandId: input.brandId || null,
      } });
      const existing = await tx.productCondition.findMany({ where: { productId: id }, select: { condition: true } });
      const keep = conditions.map(row => row.condition);
      await tx.productCondition.deleteMany({ where: { productId: id, condition: { notIn: keep } } });
      for (const condition of conditions) {
        await tx.productCondition.upsert({
          where: { productId_condition: { productId: id, condition: condition.condition } },
          create: { ...condition, productId: id },
          update: condition,
        });
      }
      return tx.product.findUniqueOrThrow({ where: { id }, include: includeProduct });
    });
  }

  async setOutOfStock(id: string, condition?: ProductConditionType) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found.');
    await this.prisma.productCondition.updateMany({
      where: { productId: id, ...(condition ? { condition } : {}) },
      data: { stock: 0, isAvailable: false },
    });
    return this.get(id);
  }

  private validateConditions(input: ProductConditionInputData[]) {
    if (!Array.isArray(input) || input.length < 1) throw new BadRequestException('Select at least one product condition.');
    const seen = new Set<string>();
    return input.map(row => {
      if (seen.has(row.condition)) throw new BadRequestException('Each condition can only be added once.');
      seen.add(row.condition);
      const images = Array.isArray(row.images) ? row.images : [];
      if (images.length > 6) throw new BadRequestException('Each condition can have a maximum of six images.');
      if (images.some(src => !/^data:image\/(png|jpeg|jpg);base64,/i.test(src) && !/^https?:\/\//i.test(src))) {
        throw new BadRequestException('Images must be JPG or PNG files.');
      }
      if (!Number.isInteger(row.price) || row.price < 0 || !Number.isInteger(row.stock) || row.stock < 0) {
        throw new BadRequestException('Price and stock must be non-negative whole numbers.');
      }
      if (row.salePrice != null && (!Number.isInteger(row.salePrice) || row.salePrice < 0)) throw new BadRequestException('Sale price must be a non-negative whole number.');
      return { condition: row.condition, price: row.price, salePrice: row.salePrice ?? null, stock: row.stock, isAvailable: row.isAvailable ?? true, images };
    });
  }

  private slugify(value: string) {
    return value.toLowerCase().trim().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  private async uniqueSlug(slug: string, excludeId?: string) {
    let candidate = slug;
    let count = 2;
    while (await this.prisma.product.findFirst({ where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) } })) {
      candidate = `${slug}-${count++}`;
    }
    return candidate;
  }
}
