import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type HomepageSlideInput = {
  eyebrow?: string; title: string; highlight?: string; description?: string;
  imageUrl: string; alt?: string; primaryLabel?: string; primaryHref?: string;
  secondaryLabel?: string; secondaryHref?: string; sortOrder?: number; isActive?: boolean;
};

@Injectable()
export class HomepageCarouselService {
  constructor(private readonly prisma: PrismaService) {}

  list(activeOnly = false) {
    return this.prisma.homepageSlide.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(input: HomepageSlideInput) {
    return this.prisma.homepageSlide.create({ data: this.normalize(input) });
  }

  async update(id: string, input: HomepageSlideInput) {
    if (!await this.prisma.homepageSlide.findUnique({ where: { id } })) throw new NotFoundException('Homepage slide not found.');
    return this.prisma.homepageSlide.update({ where: { id }, data: this.normalize(input) });
  }

  async remove(id: string) {
    if (!await this.prisma.homepageSlide.findUnique({ where: { id } })) throw new NotFoundException('Homepage slide not found.');
    await this.prisma.homepageSlide.delete({ where: { id } });
    return true;
  }

  private normalize(input: HomepageSlideInput) {
    const title = input.title?.trim();
    const imageUrl = input.imageUrl?.trim();
    if (!title) throw new BadRequestException('Slide title is required.');
    if (!imageUrl || !(imageUrl.startsWith('/') && !imageUrl.startsWith('//') || /^https:\/\/[^\s]+$/i.test(imageUrl))) {
      throw new BadRequestException('Use a site-relative image path (for example /images/hero.png) or a valid HTTPS image URL.');
    }
    const sortOrder = Number(input.sortOrder ?? 0);
    if (!Number.isInteger(sortOrder) || sortOrder < 0) throw new BadRequestException('Slide order must be a non-negative whole number.');
    const href = (value: string | undefined, fallback: string) => {
      const v = value?.trim() || fallback;
      if (!(v.startsWith('/') && !v.startsWith('//') || /^https:\/\/[^\s]+$/i.test(v))) throw new BadRequestException('Slide links must be local paths or HTTPS URLs.');
      return v;
    };
    return {
      eyebrow: input.eyebrow?.trim() || '', title, highlight: input.highlight?.trim() || '',
      description: input.description?.trim() || '', imageUrl, alt: input.alt?.trim() || title,
      primaryLabel: input.primaryLabel?.trim() || 'Explore Services',
      primaryHref: href(input.primaryHref, '/services'),
      secondaryLabel: input.secondaryLabel?.trim() || 'Buy Products',
      secondaryHref: href(input.secondaryHref, '/shop'),
      sortOrder, isActive: input.isActive ?? true,
    };
  }
}
