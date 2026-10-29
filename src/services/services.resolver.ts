import { Args, Field, GraphQLISODateTime, ID, InputType, Int, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { Public } from '../auth/public.decorator';
import { ServicesService, ServiceInputData } from './services.service';

@ObjectType()
class ServiceRecord {
  @Field(() => ID) id!: string;
  @Field() title!: string;
  @Field() slug!: string;
  @Field() category!: string;
  @Field() description!: string;
  @Field() homeDescription!: string;
  @Field() imageUrl!: string;
  @Field() icon!: string;
  @Field() whatsappMessage!: string;
  @Field() intro!: string;
  @Field() detailDescription!: string;
  @Field(() => [String]) detailItems!: string[];
  @Field(() => Int) sortOrder!: number;
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
