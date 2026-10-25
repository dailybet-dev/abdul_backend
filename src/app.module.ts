import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AdminAuthGuard } from './auth/admin-auth.guard';
import { HealthController } from './health.controller';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      path: '/api/graphql',
      context: ({ req, res }) => ({ req, res }),
      playground: process.env.NODE_ENV !== 'production',
      introspection: process.env.NODE_ENV !== 'production',
    }),
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: AdminAuthGuard }],
})
export class AppModule {}
