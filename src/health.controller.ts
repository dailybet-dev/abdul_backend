import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/public.decorator';

@Controller('api/health')
export class HealthController {
  @Public()
  @Get()
  health() {
    return { status: 'ok', service: 'abdul-backend' };
  }
}
