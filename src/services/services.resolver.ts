import { Args, Field, GraphQLISODateTime, ID, InputType, Int, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { Allow } from 'class-validator';
import { Public } from '../auth/public.decorator';
import { ServicesService, ServiceInputData } from './services.service';

@ObjectType()
class ServiceRecord {
  @Field(() => ID) id!: string;
  @Allow()
  @Field() title!: string;
  @Allow()
  @Field() slug!: string;
  @Allow()
  @Field() category!: string;
  @Allow()
  @Field() description!: string;
  @Allow()
  @Field() homeDescription!: string;
  @Allow()
  @Field() imageUrl!: string;
  @Allow()
  @Field() icon!: string;
  @Allow()
  @Field() whatsappMessage!: string;
  @Allow()
  @Field() intro!: string;
  @Allow()
  @Field() detailDescription!: string;
  @Allow()
  @Field(() => [String]) detailItems!: string[];
  @Allow()
  @Field(() => Int) sortOrder!: number;
  @Allow()
  @Field() isActive!: boolean;
  @Field(() => GraphQLISODateTime) createdAt!: Date;
  @Field(() => GraphQLISODateTime) updatedAt!: Date;
}

@InputType()
class ServiceInput {
  @Field() title!: string;
  @Field({ nullable: true }) slug?: string;
  @Field({ nullable: true }) category?: string;
  @Field({ nullable: true }) description?: string;
  @Field({ nullable: true }) homeDescription?: string;
  @Field({ nullable: true }) imageUrl?: string;
  @Field({ nullable: true }) icon?: string;
  @Field({ nullable: true }) whatsappMessage?: string;
  @Field({ nullable: true }) intro?: string;
  @Field({ nullable: true }) detailDescription?: string;
  @Field(() => [String], { nullable: true }) detailItems?: string[];
  @Field(() => Int, { nullable: true }) sortOrder?: number;
  @Field({ nullable: true }) isActive?: boolean;
}

@Resolver(() => ServiceRecord)
export class ServicesResolver {
  constructor(private readonly services: ServicesService) {}

  @Public()
  @Query(() => [ServiceRecord], { name: 'services' })
  listServices(
    @Args('activeOnly', { type: () => Boolean, nullable: true }) activeOnly = false,
    @Args('search', { type: () => String, nullable: true }) search = '',
  ) {
    return this.services.list(activeOnly, search);
  }

  @Public()
  @Query(() => ServiceRecord, { name: 'serviceBySlug' })
  serviceBySlug(@Args('slug') slug: string) {
    return this.services.getBySlug(slug);
  }

  @Mutation(() => ServiceRecord)
  createService(@Args('input', { type: () => ServiceInput }) input: ServiceInput) {
    return this.services.create(input as ServiceInputData);
  }

  @Mutation(() => ServiceRecord)
  updateService(@Args('id', { type: () => ID }) id: string, @Args('input', { type: () => ServiceInput }) input: ServiceInput) {
    return this.services.update(id, input as ServiceInputData);
  }

  @Mutation(() => Boolean)
  deleteService(@Args('id', { type: () => ID }) id: string) {
    return this.services.remove(id);
  }
}
