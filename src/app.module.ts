import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AdminAuthGuard } from './auth/admin-auth.guard';
import { GqlThrottlerGuard } from './auth/gql-throttler.guard';
import { CategoriesModule } from './categories/categories.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CategoriesModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      path: '/api/graphql',
      context: ({ req, res }) => ({ req, res }),
      // GraphiQL is intentionally enabled in production so administrators can
      // open the schema explorer directly at /api/graphql in Chrome.
      graphiql: true,
      introspection: true,
    }),
  ],
  providers: [
    { provide: APP_GUARD, useClass: GqlThrottlerGuard },
    { provide: APP_GUARD, useClass: AdminAuthGuard },
  ],
})
export class AppModule {}
