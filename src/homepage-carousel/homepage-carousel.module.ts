import { Module } from '@nestjs/common';
import { HomepageCarouselResolver } from './homepage-carousel.resolver';
import { HomepageCarouselService } from './homepage-carousel.service';
@Module({ providers: [HomepageCarouselResolver, HomepageCarouselService] })
export class HomepageCarouselModule {}
