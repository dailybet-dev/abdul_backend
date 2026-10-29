import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

@InputType('UpdateProfileInput')
export class UpdateProfileDto {
  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  displayName!: string;

  @Field()
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

@InputType('ChangeAdminPasswordInput')
export class ChangePasswordDto {
  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  currentPassword!: string;

  @Field()
  @IsString()
  @MinLength(12)
  @MaxLength(200)
  newPassword!: string;
}
