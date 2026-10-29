import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type CategoryInputData = {
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  sortOrder?: number;
};

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list(search = '') {
    const term = search.trim();
    return this.prisma.category.findMany({
      where: term ? {
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { slug: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ],
      } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async create(input: CategoryInputData) {
    const name = input.name.trim();
    const slug = this.normalizeSlug(input.slug || name);
    if (!name) throw new BadRequestException('Category name is required.');
    if (!slug) throw new BadRequestException('A valid category slug is required.');
    const exists = await this.prisma.category.findUnique({ where: { slug } });
    if (exists) throw new BadRequestException('A category with this slug already exists.');
    return this.prisma.category.create({
      data: {
        name, slug, icon: input.icon?.trim() || '📦',
        description: input.description?.trim() || '',
        sortOrder: input.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, input: CategoryInputData) {
    const current = await this.prisma.category.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Category not found.');
    const name = input.name.trim();
    const slug = this.normalizeSlug(input.slug || name);
    if (!name || !slug) throw new BadRequestException('Category name and slug are required.');
    const duplicate = await this.prisma.category.findFirst({ where: { slug, NOT: { id } } });
    if (duplicate) throw new BadRequestException('A category with this slug already exists.');
    return this.prisma.category.update({
      where: { id },
      data: {
        name, slug, icon: input.icon?.trim() || '📦',
        description: input.description?.trim() || '',
        sortOrder: input.sortOrder ?? current.sortOrder,
      },
    });
  }

  async remove(id: string) {
    const current = await this.prisma.category.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Category not found.');
    await this.prisma.category.delete({ where: { id } });
    return true;
  }

  private normalizeSlug(value: string) {
    return value.toLowerCase().trim().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
}


export type SubcategoryInputData = {
  name: string;
  slug: string;
  description?: string;
  sortOrder?: number;
  categoryId?: string | null;
};

@Injectable()
export class SubcategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list(search = '') {
    const term = search.trim();
    return this.prisma.subcategory.findMany({
      where: term ? {
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { slug: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { category: { is: { name: { contains: term, mode: 'insensitive' } } } },
        ],
      } : undefined,
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async create(input: SubcategoryInputData) {
    const name = input.name.trim();
    const slug = this.normalizeSlug(input.slug || name);
    if (!name || !slug) throw new BadRequestException('Subcategory name and slug are required.');
    const exists = await this.prisma.subcategory.findUnique({ where: { slug } });
    if (exists) throw new BadRequestException('A subcategory with this slug already exists.');
    if (input.categoryId) {
      const parent = await this.prisma.category.findUnique({ where: { id: input.categoryId } });
      if (!parent) throw new BadRequestException('Selected parent category was not found.');
    }
    return this.prisma.subcategory.create({
      data: { name, slug, description: input.description?.trim() || '', sortOrder: input.sortOrder ?? 0, categoryId: input.categoryId || null },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, input: SubcategoryInputData) {
    const current = await this.prisma.subcategory.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Subcategory not found.');
    const name = input.name.trim();
    const slug = this.normalizeSlug(input.slug || name);
    if (!name || !slug) throw new BadRequestException('Subcategory name and slug are required.');
    const duplicate = await this.prisma.subcategory.findFirst({ where: { slug, NOT: { id } } });
    if (duplicate) throw new BadRequestException('A subcategory with this slug already exists.');
    if (input.categoryId) {
      const parent = await this.prisma.category.findUnique({ where: { id: input.categoryId } });
      if (!parent) throw new BadRequestException('Selected parent category was not found.');
    }
    return this.prisma.subcategory.update({
      where: { id },
      data: { name, slug, description: input.description?.trim() || '', sortOrder: input.sortOrder ?? current.sortOrder, categoryId: input.categoryId || null },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async remove(id: string) {
    const row = await this.prisma.subcategory.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Subcategory not found.');
    await this.prisma.subcategory.delete({ where: { id } });
    return true;
  }

  private normalizeSlug(value: string) {
    return value.toLowerCase().trim().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
}
