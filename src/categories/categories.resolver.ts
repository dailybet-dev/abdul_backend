import { Args, Field, ID, InputType, Int, ObjectType, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CategoriesService, CategoryInputData } from './categories.service';

@ObjectType()
class CategoryRecord {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field() slug!: string;
  @Field() icon!: string;
  @Field() description!: string;
  @Field(() => Int) sortOrder!: number;
  @Field(() => String) createdAt!: Date;
  @Field(() => String) updatedAt!: Date;
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
