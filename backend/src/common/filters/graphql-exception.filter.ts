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

    throw new GraphQLError(message, {
      extensions: {
        code: response?.error || 'HTTP_ERROR',
        status,
      },
      path: ctx?.path,
    });
  }
}
