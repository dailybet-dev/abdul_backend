import { Module } from '@nestjs/common';
import { SubmissionsResolver } from './submissions.resolver';
import { SubmissionsService } from './submissions.service';

@Module({ providers: [SubmissionsResolver, SubmissionsService] })
export class SubmissionsModule {}
