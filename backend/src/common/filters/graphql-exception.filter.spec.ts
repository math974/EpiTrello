import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { GraphqlHttpExceptionFilter } from './graphql-exception.filter';

describe('GraphqlHttpExceptionFilter', () => {
  let filter: GraphqlHttpExceptionFilter;
  let mockArgumentsHost: ArgumentsHost;
  let mockGqlHost: any;

  beforeEach(() => {
    filter = new GraphqlHttpExceptionFilter();
    mockGqlHost = {
      getContext: jest.fn().mockReturnValue({
        path: ['test', 'query'],
      }),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn(),
      getType: jest.fn(),
      getArgByIndex: jest.fn(),
      getArgs: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
    } as any;

    jest.spyOn(GqlArgumentsHost, 'create').mockReturnValue(mockGqlHost as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should convert HttpException to GraphQLError with string message', () => {
    const exception = new HttpException('Test error message', HttpStatus.BAD_REQUEST);

    expect(() => filter.catch(exception, mockArgumentsHost)).toThrow(GraphQLError);

    try {
      filter.catch(exception, mockArgumentsHost);
    } catch (error) {
      const graphQLError = error as GraphQLError;
      expect(graphQLError).toBeInstanceOf(GraphQLError);
      expect(graphQLError.message).toBe('Test error message');
      expect(graphQLError.extensions).toEqual({
        code: 'HTTP_ERROR',
        status: 400,
      });
      expect(graphQLError.path).toEqual(['test', 'query']);
    }
  });

  it('should handle HttpException with object response containing message', () => {
    const exception = new HttpException(
      { message: 'Custom error message', error: 'CUSTOM_ERROR' },
      HttpStatus.FORBIDDEN
    );

    expect(() => filter.catch(exception, mockArgumentsHost)).toThrow(GraphQLError);

    try {
      filter.catch(exception, mockArgumentsHost);
    } catch (error) {
      const graphQLError = error as GraphQLError;
      expect(graphQLError).toBeInstanceOf(GraphQLError);
      expect(graphQLError.message).toBe('Custom error message');
      expect(graphQLError.extensions).toEqual({
        code: 'CUSTOM_ERROR',
        status: 403,
      });
    }
  });

  it('should handle HttpException with array message', () => {
    const exception = new HttpException(
      { message: ['Error 1', 'Error 2'], error: 'VALIDATION_ERROR' },
      HttpStatus.BAD_REQUEST
    );

    expect(() => filter.catch(exception, mockArgumentsHost)).toThrow(GraphQLError);

    try {
      filter.catch(exception, mockArgumentsHost);
    } catch (error) {
      const graphQLError = error as GraphQLError;
      expect(graphQLError).toBeInstanceOf(GraphQLError);
      expect(graphQLError.message).toBe('Error 1, Error 2');
      expect(graphQLError.extensions).toEqual({
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    }
  });

  it('should use exception message when response message is not available', () => {
    const exception = new HttpException(
      { error: 'SOME_ERROR' },
      HttpStatus.INTERNAL_SERVER_ERROR
    );

    expect(() => filter.catch(exception, mockArgumentsHost)).toThrow(GraphQLError);

    try {
      filter.catch(exception, mockArgumentsHost);
    } catch (error) {
      const graphQLError = error as GraphQLError;
      expect(graphQLError).toBeInstanceOf(GraphQLError);
      // When response.message is not available, it uses exception.message
      expect(graphQLError.message).toBe('Http Exception');
      expect(graphQLError.extensions).toEqual({
        code: 'SOME_ERROR',
        status: 500,
      });
    }
  });

  it('should handle context without path', () => {
    mockGqlHost.getContext.mockReturnValue({});
    const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

    expect(() => filter.catch(exception, mockArgumentsHost)).toThrow(GraphQLError);

    try {
      filter.catch(exception, mockArgumentsHost);
    } catch (error) {
      const graphQLError = error as GraphQLError;
      expect(graphQLError).toBeInstanceOf(GraphQLError);
      expect(graphQLError.path).toBeUndefined();
    }
  });

  it('should handle context with null path', () => {
    mockGqlHost.getContext.mockReturnValue({ path: null });
    const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

    expect(() => filter.catch(exception, mockArgumentsHost)).toThrow(GraphQLError);

    try {
      filter.catch(exception, mockArgumentsHost);
    } catch (error) {
      const graphQLError = error as GraphQLError;
      expect(graphQLError).toBeInstanceOf(GraphQLError);
      // When path is null, it becomes undefined in the GraphQLError
      expect(graphQLError.path).toBeUndefined();
    }
  });
});

