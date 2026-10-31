import { Module } from '@nestjs/common';
import { SubmissionsResolver } from './submissions.resolver';
import { SubmissionsService } from './submissions.service';
import { SubmissionsController } from './submissions.controller';

@Module({ controllers: [SubmissionsController], providers: [SubmissionsResolver, SubmissionsService] })
export class SubmissionsModule {}
