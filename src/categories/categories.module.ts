import { Module } from '@nestjs/common';
import { CategoriesResolver, SubcategoriesResolver } from './categories.resolver';
import { CategoriesService, SubcategoriesService } from './categories.service';

@Module({
  providers: [CategoriesResolver, CategoriesService, SubcategoriesResolver, SubcategoriesService],
})
export class CategoriesModule {}
