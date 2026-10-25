import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class ConfigService implements OnModuleInit {
  get sessionHashSecret() {
    const value = process.env.SESSION_HASH_SECRET || '';
    if (value.length < 32) throw new Error('SESSION_HASH_SECRET must contain at least 32 characters.');
    return value;
  }

  onModuleInit() {
    void this.sessionHashSecret;
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
    if (!process.env.FRONTEND_URL) throw new Error('FRONTEND_URL is required.');
  }
}
