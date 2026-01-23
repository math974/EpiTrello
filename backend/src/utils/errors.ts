export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, code = 'INTERNAL_ERROR', statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const unauthorizedError = () => new AppError('Unauthorized', 'UNAUTHORIZED', 401);
