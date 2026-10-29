import { UnauthorizedException } from '@nestjs/common';
import { Args, Context, Field, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import type { Request, Response } from 'express';
import { Admin } from './current-admin.decorator';
import { Public } from './public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './login.dto';
import { ChangePasswordDto, UpdateProfileDto } from './account.dto';

@ObjectType()
class AdminAccount {
  @Field() id!: string;
  @Field() email!: string;
  @Field() displayName!: string;
}

@ObjectType()
class AdminLoginPayload {
  @Field() success!: boolean;
  @Field(() => AdminAccount) admin!: AdminAccount;
}

@ObjectType()
class MutationPayload {
  @Field() success!: boolean;
  @Field() message!: string;
}

type GraphQLContext = { req: Request & { admin?: AdminAccount }; res: Response };

@Resolver()
export class AuthResolver {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Mutation(() => AdminLoginPayload)
  async login(@Args('input') input: LoginDto, @Context() context: GraphQLContext): Promise<AdminLoginPayload> {
    const admin = await this.auth.login(input.email, input.password, context.req, context.res);
    if (!admin) throw new UnauthorizedException('Invalid email or password.');
    return { success: true, admin };
  }

  @Query(() => AdminAccount)
  adminMe(@Admin() admin: AdminAccount): AdminAccount {
    return admin;
  }

  @Query(() => String, { name: 'adminSessionStatus' })
  adminSessionStatus(@Admin() admin: AdminAccount) {
    return JSON.stringify({ authenticated: true, admin });
  }

  @Mutation(() => AdminAccount)
  async updateAdminProfile(
    @Admin() admin: AdminAccount,
    @Args('input') input: UpdateProfileDto,
  ): Promise<AdminAccount> {
    return this.auth.updateProfile(admin.id, input.displayName, input.email);
  }

  @Mutation(() => MutationPayload)
  async changeAdminPassword(
    @Admin() admin: AdminAccount,
    @Args('input') input: ChangePasswordDto,
  ): Promise<MutationPayload> {
    await this.auth.changePassword(admin.id, input.currentPassword, input.newPassword);
    return { success: true, message: 'Password updated. Please sign in again.' };
  }

  @Mutation(() => MutationPayload)
  async logout(@Context() context: GraphQLContext): Promise<MutationPayload> {
    const token = context.req.cookies?.admin_session as string | undefined;
    await this.auth.logout(token, context.res);
    return { success: true, message: 'Signed out successfully.' };
  }
}
