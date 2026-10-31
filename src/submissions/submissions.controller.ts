import { Controller, Get, Query } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';

/**
 * Admin-only read endpoint for contact submissions.
 * AdminAuthGuard is registered globally in AppModule; do not mark this route public.
 */
@Controller('admin/submissions')
export class SubmissionsController {
  constructor(private readonly submissions: SubmissionsService) {}

  @Get('contacts')
  listContacts(@Query('search') search = '', @Query('status') status = '') {
    return this.submissions.listContacts(search, status);
  }
}
