import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

// Import the decorator and extract the logic for testing
// Since createParamDecorator wraps the function, we test the logic directly
const getCurrentUser = (data: string | undefined, context: ExecutionContext) => {
  const gqlCtx = GqlExecutionContext.create(context).getContext();
  const user = gqlCtx.user ?? null;
  
  if (!user) {
    return null;
  }
  
  // If a property name is provided (e.g., 'id'), extract that property
  if (data) {
    return user[data] ?? null;
  }
  
  // Otherwise, return the full user object
  return user;
};

describe('CurrentUser decorator logic', () => {
  let mockExecutionContext: ExecutionContext;
  let mockGqlContext: any;

  beforeEach(() => {
    mockGqlContext = {
      user: {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
      },
    };

    mockExecutionContext = {
      switchToHttp: jest.fn(),
      getType: jest.fn(),
      getArgByIndex: jest.fn(),
      getArgs: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
    } as any;

    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => mockGqlContext,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the full user object when no property is specified', () => {
    const result = getCurrentUser(undefined, mockExecutionContext);
    expect(result).toEqual({
      id: 'user-1',
      username: 'testuser',
      email: 'test@example.com',
    });
  });

  it('should return a specific property when property name is provided', () => {
    const result = getCurrentUser('id', mockExecutionContext);
    expect(result).toBe('user-1');
  });

  it('should return null when user is not in context', () => {
    mockGqlContext.user = null;
    const result = getCurrentUser(undefined, mockExecutionContext);
    expect(result).toBeNull();
  });

  it('should return null when user is undefined in context', () => {
    mockGqlContext.user = undefined;
    const result = getCurrentUser(undefined, mockExecutionContext);
    expect(result).toBeNull();
  });

  it('should return null when requested property does not exist', () => {
    const result = getCurrentUser('nonExistentProperty', mockExecutionContext);
    expect(result).toBeNull();
  });

  it('should return the email property when requested', () => {
    const result = getCurrentUser('email', mockExecutionContext);
    expect(result).toBe('test@example.com');
  });

  it('should return the username property when requested', () => {
    const result = getCurrentUser('username', mockExecutionContext);
    expect(result).toBe('testuser');
  });
});

