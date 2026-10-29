import { Args, Field, GraphQLISODateTime, ID, InputType, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { Public } from '../auth/public.decorator';
import { SubmissionsService } from './submissions.service';

@ObjectType()
class NewsletterSubscriptionRecord {
  @Field(() => ID) id!: string;
  @Field() email!: string;
  @Field() status!: string;
  @Field() source!: string;
  @Field(() => GraphQLISODateTime) subscribedAt!: Date;
  @Field(() => GraphQLISODateTime, { nullable: true }) unsubscribedAt!: Date | null;
  @Field(() => GraphQLISODateTime) createdAt!: Date;
  @Field(() => GraphQLISODateTime) updatedAt!: Date;
}
@ObjectType()
class ContactSubmissionRecord {
  @Field(() => ID) id!: string;
  @Field() name!: string; @Field() email!: string; @Field() phone!: string;
  @Field() service!: string; @Field() message!: string; @Field() status!: String;
  @Field() adminNote!: string;
  @Field(() => GraphQLISODateTime) createdAt!: Date;
  @Field(() => GraphQLISODateTime) updatedAt!: Date;
}
@ObjectType()
class TrainingEnquiryRecord {
  @Field(() => ID) id!: string;
  @Field() fullName!: string; @Field() phone!: string; @Field() email!: string;
  @Field() course!: string; @Field() level!: string; @Field() schedule!: string;
  @Field() startDate!: string; @Field() goal!: string; @Field() notes!: string;
  @Field() status!: String; @Field() adminNote!: string;
  @Field(() => GraphQLISODateTime) createdAt!: Date;
  @Field(() => GraphQLISODateTime) updatedAt!: Date;
}
@InputType()
class ContactSubmissionInput {
  @Field() name!: string; @Field() email!: string;
  @Field({ nullable: true }) phone?: string;
  @Field() service!: string; @Field() message!: string;
}
@InputType()
class TrainingEnquiryInput {
  @Field() fullName!: string; @Field() phone!: string;
  @Field({ nullable: true }) email?: string;
  @Field() course!: string; @Field() level!: string; @Field() schedule!: string;
  @Field({ nullable: true }) startDate?: string;
  @Field({ nullable: true }) goal?: string;
  @Field({ nullable: true }) notes?: string;
}

@Resolver()
export class SubmissionsResolver {
  constructor(private readonly submissions: SubmissionsService) {}

  @Public()
  @Mutation(() => NewsletterSubscriptionRecord)
  subscribeNewsletter(@Args('email') email: string) { return this.submissions.subscribe(email); }

  @Public()
  @Mutation(() => ContactSubmissionRecord)
  submitContactSubmission(@Args('input', { type: () => ContactSubmissionInput }) input: ContactSubmissionInput) { return this.submissions.submitContact(input); }

  @Public()
  @Mutation(() => TrainingEnquiryRecord)
  submitTrainingEnquiry(@Args('input', { type: () => TrainingEnquiryInput }) input: TrainingEnquiryInput) { return this.submissions.submitTraining(input); }

  @Query(() => [NewsletterSubscriptionRecord])
  newsletterSubscriptions(@Args('search', { type: () => String, nullable: true }) search = '', @Args('status', { type: () => String, nullable: true }) status = '') { return this.submissions.listNewsletter(search, status); }
  @Query(() => [ContactSubmissionRecord])
  contactSubmissions(@Args('search', { type: () => String, nullable: true }) search = '', @Args('status', { type: () => String, nullable: true }) status = '') { return this.submissions.listContacts(search, status); }
  @Query(() => [TrainingEnquiryRecord])
  trainingEnquiries(@Args('search', { type: () => String, nullable: true }) search = '', @Args('status', { type: () => String, nullable: true }) status = '') { return this.submissions.listTraining(search, status); }

  @Mutation(() => NewsletterSubscriptionRecord)
  updateNewsletterSubscription(@Args('id', { type: () => ID }) id: string, @Args('status') status: string) { return this.submissions.updateNewsletter(id, status); }
  @Mutation(() => ContactSubmissionRecord)
  updateContactSubmission(@Args('id', { type: () => ID }) id: string, @Args('status') status: string, @Args('adminNote', { nullable: true }) adminNote?: string) { return this.submissions.updateContact(id, status, adminNote); }
  @Mutation(() => TrainingEnquiryRecord)
  updateTrainingEnquiry(@Args('id', { type: () => ID }) id: string, @Args('status') status: string, @Args('adminNote', { nullable: true }) adminNote?: string) { return this.submissions.updateTraining(id, status, adminNote); }

  @Mutation(() => Boolean)
  deleteNewsletterSubscription(@Args('id', { type: () => ID }) id: string) { return this.submissions.deleteNewsletter(id); }
  @Mutation(() => Boolean)
  deleteContactSubmission(@Args('id', { type: () => ID }) id: string) { return this.submissions.deleteContact(id); }
  @Mutation(() => Boolean)
  deleteTrainingEnquiry(@Args('id', { type: () => ID }) id: string) { return this.submissions.deleteTraining(id); }
}
