import { HttpException, HttpStatus, PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

/** Validates a request body, query or param against a Zod schema and returns the parsed value. */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;
    throw new HttpException(
      {
        code: 'validation_failed',
        message: 'The request is not valid.',
        details: result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
