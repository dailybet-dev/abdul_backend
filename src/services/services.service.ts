import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ServiceInputData = {
  title: string;
  slug?: string;
  category?: string;
  description?: string;
  homeDescription?: string;
  imageUrl?: string;
  icon?: string;
  whatsappMessage?: string;
  intro?: string;
  detailDescription?: string;
  detailItems?: string[];
  sortOrder?: number;
  isActive?: boolean;
};

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  list(activeOnly = false, search = '') {
    const term = search.trim();
    return this.prisma.service.findMany({
      where: {
        ...(activeOnly ? { isActive: true } : {}),
        ...(term ? { OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { category: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ] } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });
  }

  async getBySlug(slug: string) {
    const service = await this.prisma.service.findUnique({ where: { slug } });
    if (!service || !service.isActive) throw new NotFoundException('Service not found.');
    return service;
  }

  async create(input: ServiceInputData) {
    const title = input.title?.trim();
    if (!title) throw new BadRequestException('Service title is required.');
    const slug = this.slugify(input.slug || title);
    if (!slug) throw new BadRequestException('A valid service slug is required.');
    if (await this.prisma.service.findUnique({ where: { slug } })) {
      throw new BadRequestException('A service with this slug already exists.');
    }
    return this.prisma.service.create({ data: this.normalize(input, title, slug) });
  }

  async update(id: string, input: ServiceInputData) {
    const current = await this.prisma.service.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Service not found.');
    const title = input.title?.trim();
    if (!title) throw new BadRequestException('Service title is required.');
    const slug = this.slugify(input.slug || title);
    if (!slug) throw new BadRequestException('A valid service slug is required.');
    const owner = await this.prisma.service.findFirst({ where: { slug, NOT: { id } } });
    if (owner) throw new BadRequestException('A service with this slug already exists.');
    return this.prisma.service.update({ where: { id }, data: this.normalize(input, title, slug) });
  }

  async remove(id: string) {
    const existing = await this.prisma.service.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Service not found.');
    await this.prisma.service.delete({ where: { id } });
    return true;
  }

  private normalize(input: ServiceInputData, title: string, slug: string) {
    const sortOrder = Number(input.sortOrder ?? 0);
    if (!Number.isInteger(sortOrder) || sortOrder < 0) throw new BadRequestException('Sort order must be a non-negative whole number.');
    return {
      title,
      slug,
      category: input.category?.trim() || 'ICT & Electrical',
      description: input.description?.trim() || '',
      homeDescription: input.homeDescription?.trim() || input.description?.trim() || '',
      imageUrl: input.imageUrl?.trim() || '',
      icon: input.icon?.trim() || 'Wrench',
      whatsappMessage: input.whatsappMessage?.trim() || `Hello Abdul ICT & Electrical Solutions, I would like to enquire about ${title}. Please share more details.`,
      intro: input.intro?.trim() || input.description?.trim() || '',
      detailDescription: input.detailDescription?.trim() || input.description?.trim() || '',
      detailItems: Array.isArray(input.detailItems) ? input.detailItems.map(item => item.trim()).filter(Boolean) : [],
      sortOrder,
      isActive: input.isActive ?? true,
    };
  }

  private slugify(value: string) {
    return value.toLowerCase().trim().normalize('NFKD')
      .replace(/[\\u0300-\\u036f]/g, '')
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
