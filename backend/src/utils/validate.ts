import { AppError } from './errors.js';

export const assertNonEmpty = (value: string, fieldName: string) => {
  if (!value.trim()) {
    throw new AppError(`${fieldName} is required`, 'VALIDATION_ERROR', 400);
  }
};
