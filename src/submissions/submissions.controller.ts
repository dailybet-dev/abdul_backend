import { Controller, Get, Query } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';

/** Admin-only submission reads; protected by the global AdminAuthGuard. */
@Controller('admin/submissions')
export class SubmissionsController {
  constructor(private readonly submissions: SubmissionsService) {}

  @Get('contacts')
  listContacts(@Query('search') search = '', @Query('status') status = '') {
    return this.submissions.listContacts(search, status);
  }

  @Get('newsletter')
  listNewsletter(@Query('search') search = '', @Query('status') status = '') {
    return this.submissions.listNewsletter(search, status);
  }
}
