import { Args, Field, GraphQLISODateTime, ID, InputType, Int, ObjectType, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CategoriesService, CategoryInputData, SubcategoriesService, SubcategoryInputData } from './categories.service';
import { Public } from '../auth/public.decorator';

@ObjectType()
class CategoryRecord {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field() slug!: string;
  @Field() icon!: string;
  @Field() description!: string;
  @Field(() => Int) sortOrder!: number;
  @Field(() => GraphQLISODateTime) createdAt!: Date;
  @Field(() => GraphQLISODateTime) updatedAt!: Date;
}

@InputType()
class CategoryInput {
  @Field() name!: string;
  @Field() slug!: string;
  @Field({ nullable: true }) icon?: string;
  @Field({ nullable: true }) description?: string;
  @Field(() => Int, { nullable: true }) sortOrder?: number;
}

@Resolver(() => CategoryRecord)
export class CategoriesResolver {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Query(() => [CategoryRecord], { name: 'categories' })
  categories(@Args('search', { type: () => String, nullable: true }) search?: string) {
    return this.categoriesService.list(search || '');
  }

  @Mutation(() => CategoryRecord)
  createCategory(@Args('input', { type: () => CategoryInput }) input: CategoryInput) {
    return this.categoriesService.create(input as CategoryInputData);
  }

  @Mutation(() => CategoryRecord)
  updateCategory(
    @Args('id', { type: () => ID }) id: string,
    @Args('input', { type: () => CategoryInput }) input: CategoryInput,
  ) {
    return this.categoriesService.update(id, input as CategoryInputData);
  }

  @Mutation(() => Boolean)
  deleteCategory(@Args('id', { type: () => ID }) id: string) {
    return this.categoriesService.remove(id);
  }
}


@ObjectType()
class SubcategoryParent {
  @Field(() => ID) id!: string;
  @Field() name!: string;
}

@ObjectType()
class SubcategoryRecord {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field() slug!: string;
  @Field() description!: string;
  @Field(() => Int) sortOrder!: number;
  @Field(() => ID, { nullable: true }) categoryId!: string | null;
  @Field(() => SubcategoryParent, { nullable: true }) category!: SubcategoryParent | null;
  @Field(() => GraphQLISODateTime) createdAt!: Date;
  @Field(() => GraphQLISODateTime) updatedAt!: Date;
}

@InputType()
class SubcategoryInput {
  @Field() name!: string;
  @Field() slug!: string;
  @Field({ nullable: true }) description?: string;
  @Field(() => Int, { nullable: true }) sortOrder?: number;
  @Field(() => ID, { nullable: true }) categoryId?: string | null;
}

@Resolver(() => SubcategoryRecord)
export class SubcategoriesResolver {
  constructor(private readonly subcategoriesService: SubcategoriesService) {}

  @Public()
  @Query(() => [SubcategoryRecord], { name: 'subcategories' })
  subcategories(@Args('search', { type: () => String, nullable: true }) search?: string) {
    return this.subcategoriesService.list(search || '');
  }

  @Mutation(() => SubcategoryRecord)
  createSubcategory(@Args('input', { type: () => SubcategoryInput }) input: SubcategoryInput) {
    return this.subcategoriesService.create(input as SubcategoryInputData);
  }

  @Mutation(() => SubcategoryRecord)
  updateSubcategory(
    @Args('id', { type: () => ID }) id: string,
    @Args('input', { type: () => SubcategoryInput }) input: SubcategoryInput,
  ) {
    return this.subcategoriesService.update(id, input as SubcategoryInputData);
  }

  @Mutation(() => Boolean)
  deleteSubcategory(@Args('id', { type: () => ID }) id: string) {
    return this.subcategoriesService.remove(id);
  }
}
