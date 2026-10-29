import { Args, Field, GraphQLISODateTime, ID, InputType, Int, Mutation, ObjectType, Query, Resolver, registerEnumType } from '@nestjs/graphql';
import { ProductConditionType } from '@prisma/client';
import { ProductsService, ProductInputData } from './products.service';

registerEnumType(ProductConditionType, { name: 'ProductConditionType' });

@ObjectType()
class ProductRef {
  @Field(() => ID) id!: string;
  @Field() name!: string;
}
@ObjectType()
class ProductConditionRecord {
  @Field(() => ID) id!: string;
  @Field(() => ProductConditionType) condition!: ProductConditionType;
  @Field(() => Int) price!: number;
  @Field(() => Int, { nullable: true }) salePrice!: number | null;
  @Field(() => Int) stock!: number;
  @Field() isAvailable!: boolean;
  @Field(() => [String]) images!: string[];
}
@ObjectType()
class ProductRecord {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field() slug!: string;
  @Field() sku!: string;
  @Field() description!: string;
  @Field(() => ID, { nullable: true }) categoryId!: string | null;
  @Field(() => ID, { nullable: true }) subcategoryId!: string | null;
  @Field(() => ID, { nullable: true }) brandId!: string | null;
  @Field(() => ProductRef, { nullable: true }) category!: ProductRef | null;
  @Field(() => ProductRef, { nullable: true }) subcategory!: ProductRef | null;
  @Field(() => ProductRef, { nullable: true }) brand!: ProductRef | null;
  @Field(() => [ProductConditionRecord]) conditions!: ProductConditionRecord[];
  @Field(() => GraphQLISODateTime) createdAt!: Date;
  @Field(() => GraphQLISODateTime) updatedAt!: Date;
}
@InputType()
class ProductConditionInput {
  @Field(() => ProductConditionType) condition!: ProductConditionType;
  @Field(() => Int) price!: number;
  @Field(() => Int, { nullable: true }) salePrice?: number | null;
  @Field(() => Int) stock!: number;
  @Field({ nullable: true }) isAvailable?: boolean;
  @Field(() => [String], { nullable: true }) images?: string[];
}
@InputType()
class ProductInput {
  @Field() name!: string;
  @Field({ nullable: true }) sku?: string;
  @Field({ nullable: true }) description?: string;
  @Field(() => ID, { nullable: true }) categoryId?: string | null;
  @Field(() => ID, { nullable: true }) subcategoryId?: string | null;
  @Field(() => ID, { nullable: true }) brandId?: string | null;
  @Field(() => [ProductConditionInput]) conditions!: ProductConditionInput[];
}
@ObjectType()
class ProductNameCheck {
  @Field() exists!: boolean;
  @Field({ nullable: true }) name?: string;
}

@Resolver(() => ProductRecord)
export class ProductsResolver {
  constructor(private readonly productsService: ProductsService) {}
  @Query(() => [ProductRecord], { name: 'products' })
  products(@Args('search', { type: () => String, nullable: true }) search?: string) {
    return this.productsService.list(search || '');
  }
  @Query(() => ProductRecord, { name: 'product' })
  product(@Args('id', { type: () => ID }) id: string) { return this.productsService.get(id); }
  @Query(() => ProductNameCheck, { name: 'productNameExists' })
  async productNameExists(@Args('name') name: string, @Args('excludeId', { type: () => ID, nullable: true }) excludeId?: string) {
    return { exists: await this.productsService.nameExists(name, excludeId), name: name.trim() };
  }
  @Mutation(() => ProductRecord)
  createProduct(@Args('input', { type: () => ProductInput }) input: ProductInput) {
    return this.productsService.create(input as ProductInputData);
  }
  @Mutation(() => ProductRecord)
  updateProduct(@Args('id', { type: () => ID }) id: string, @Args('input', { type: () => ProductInput }) input: ProductInput) {
    return this.productsService.update(id, input as ProductInputData);
  }
  @Mutation(() => ProductRecord)
  markProductOutOfStock(
    @Args('id', { type: () => ID }) id: string,
    @Args('condition', { type: () => ProductConditionType, nullable: true }) condition?: ProductConditionType,
  ) { return this.productsService.setOutOfStock(id, condition); }
}
