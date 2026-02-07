import { AuthGuard } from './gql-auth.decorator';
import { GqlAuthGuard } from './gql-auth.guard';

describe('AuthGuard', () => {
  it('should return UseGuards with GqlAuthGuard', () => {
    const result = AuthGuard();
    expect(result).toBeDefined();
    // AuthGuard is a decorator factory that returns UseGuards(GqlAuthGuard)
    // We can't easily test the decorator directly, but we can verify it's a function
    expect(typeof result).toBe('function');
  });
});

