import { Args, Field, GraphQLISODateTime, ID, InputType, Int, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { Public } from '../auth/public.decorator';
import { HomepageCarouselService, HomepageSlideInput } from './homepage-carousel.service';

@ObjectType()
class HomepageSlideRecord {
  @Field(() => ID) id!: string;
  @Field() eyebrow!: string;
  @Field() title!: string;
  @Field() highlight!: string;
  @Field() description!: string;
  @Field() imageUrl!: string;
  @Field() alt!: string;
  @Field() primaryLabel!: string;
  @Field() primaryHref!: string;
  @Field() secondaryLabel!: string;
  @Field() secondaryHref!: string;
  @Field(() => Int) sortOrder!: number;
  @Field() isActive!: boolean;
  @Field(() => GraphQLISODateTime) createdAt!: Date;
  @Field(() => GraphQLISODateTime) updatedAt!: Date;
}
@InputType()
class HomepageSlideInputType {
  @Field({ nullable: true }) eyebrow?: string;
  @Field() title!: string;
  @Field({ nullable: true }) highlight?: string;
  @Field({ nullable: true }) description?: string;
  @Field() imageUrl!: string;
  @Field({ nullable: true }) alt?: string;
  @Field({ nullable: true }) primaryLabel?: string;
  @Field({ nullable: true }) primaryHref?: string;
  @Field({ nullable: true }) secondaryLabel?: string;
  @Field({ nullable: true }) secondaryHref?: string;
  @Field(() => Int, { nullable: true }) sortOrder?: number;
  @Field({ nullable: true }) isActive?: boolean;
}
@Resolver(() => HomepageSlideRecord)
export class HomepageCarouselResolver {
  constructor(private readonly carousel: HomepageCarouselService) {}
  @Public()
  @Query(() => [HomepageSlideRecord], { name: 'homepageSlides' })
  list(@Args('activeOnly', { type: () => Boolean, nullable: true }) activeOnly = false) { return this.carousel.list(activeOnly); }
  @Mutation(() => HomepageSlideRecord)
  createHomepageSlide(@Args('input', { type: () => HomepageSlideInputType }) input: HomepageSlideInputType) { return this.carousel.create(input as HomepageSlideInput); }
  @Mutation(() => HomepageSlideRecord)
  updateHomepageSlide(@Args('id', { type: () => ID }) id: string, @Args('input', { type: () => HomepageSlideInputType }) input: HomepageSlideInputType) { return this.carousel.update(id, input as HomepageSlideInput); }
  @Mutation(() => Boolean)
  deleteHomepageSlide(@Args('id', { type: () => ID }) id: string) { return this.carousel.remove(id); }
}
