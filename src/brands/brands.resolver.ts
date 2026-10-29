import { Args, Field, GraphQLISODateTime, ID, InputType, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { BrandsService, BrandInputData } from './brands.service';

@ObjectType()
class BrandRecord {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field() slug!: string;
  @Field(() => GraphQLISODateTime) createdAt!: Date;
  @Field(() => GraphQLISODateTime) updatedAt!: Date;
}

@InputType()
class BrandInput {
  @Field() name!: string;
  @Field({ nullable: true }) slug?: string;
}

@Resolver(() => BrandRecord)
export class BrandsResolver {
  constructor(private readonly brandsService: BrandsService) {}

  @Query(() => [BrandRecord], { name: 'brands' })
  brands(@Args('search', { type: () => String, nullable: true }) search?: string) {
    return this.brandsService.list(search || '');
  }

  @Mutation(() => BrandRecord)
  createBrand(@Args('input', { type: () => BrandInput }) input: BrandInput) {
    return this.brandsService.create(input as BrandInputData);
  }

  @Mutation(() => BrandRecord)
  updateBrand(@Args('id', { type: () => ID }) id: string, @Args('input', { type: () => BrandInput }) input: BrandInput) {
    return this.brandsService.update(id, input as BrandInputData);
  }

  @Mutation(() => Boolean)
  deleteBrand(@Args('id', { type: () => ID }) id: string) {
    return this.brandsService.remove(id);
  }
}
