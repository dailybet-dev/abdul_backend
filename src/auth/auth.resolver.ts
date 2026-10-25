import { Query, Resolver } from '@nestjs/graphql';
import { Admin } from './current-admin.decorator';

@Resolver()
export class AuthResolver {
  @Query(() => String, { name: 'adminSessionStatus' })
  adminSessionStatus(@Admin() admin: { id: string; email: string }) {
    return JSON.stringify({ authenticated: true, admin });
  }
}
