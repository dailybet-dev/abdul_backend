import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type BrandInputData = { name: string; slug?: string };

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  list(search = '') {
    const term = search.trim();
    return this.prisma.brand.findMany({
      where: term ? { OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { slug: { contains: term, mode: 'insensitive' } },
      ] } : undefined,
      orderBy: [{ name: 'asc' }],
    });
  }

  async create(input: BrandInputData) {
    const name = input.name.trim();
    const slug = this.normalizeSlug(input.slug || name);
    if (!name || !slug) throw new BadRequestException('Brand name is required.');
    const exists = await this.prisma.brand.findUnique({ where: { slug } });
    if (exists) throw new BadRequestException('A brand with this name already exists.');
    return this.prisma.brand.create({ data: { name, slug } });
  }

  async update(id: string, input: BrandInputData) {
    const current = await this.prisma.brand.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Brand not found.');
    const name = input.name.trim();
    const slug = this.normalizeSlug(input.slug || name);
    if (!name || !slug) throw new BadRequestException('Brand name is required.');
    const duplicate = await this.prisma.brand.findFirst({ where: { slug, NOT: { id } } });
    if (duplicate) throw new BadRequestException('A brand with this name already exists.');
    return this.prisma.brand.update({ where: { id }, data: { name, slug } });
  }

  async remove(id: string) {
    const current = await this.prisma.brand.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Brand not found.');
    await this.prisma.brand.delete({ where: { id } });
    return true;
  }

  private normalizeSlug(value: string) {
    return value.toLowerCase().trim().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
}
