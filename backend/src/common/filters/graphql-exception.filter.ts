import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

@Catch(HttpException)
export class GraphqlHttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    const ctx = gqlHost.getContext();

    const status = exception.getStatus();
    const response = exception.getResponse() as { message?: string | string[]; error?: string };
    const message = Array.isArray(response?.message)
      ? response.message.join(', ')
      : response?.message || exception.message;

    // Map HTTP status codes to GraphQL error codes
    let errorCode = response?.error || 'HTTP_ERROR';
    if (status === 401) {
      errorCode = 'UNAUTHENTICATED';
    } else if (status === 403) {
      errorCode = 'FORBIDDEN';
    } else if (status === 404) {
      errorCode = 'NOT_FOUND';
    } else if (status === 400) {
      errorCode = 'BAD_REQUEST';
    }

    throw new GraphQLError(message, {
      extensions: {
        code: errorCode,
        status,
        originalError: {
          statusCode: status,
          message,
        },
      },
      path: ctx?.path,
    });
  }
}
