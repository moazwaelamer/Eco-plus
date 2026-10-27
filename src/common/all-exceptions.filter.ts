import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';

export interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
}

const CODE_BY_STATUS: Record<number, string> = {
  400: 'bad_request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  422: 'validation_failed',
  429: 'too_many_requests',
};

/** Every error leaves the API in one shape: { code, message, details?, requestId }. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ErrorBody = { code: 'internal_error', message: 'Something went wrong. Please try again.' };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();
      if (typeof payload === 'object' && payload !== null && 'code' in payload) {
        const p = payload as { code: string; message?: string; details?: unknown };
        body = { code: p.code, message: p.message ?? exception.message, details: p.details };
      } else {
        const message =
          typeof payload === 'string'
            ? payload
            : ((payload as { message?: string | string[] }).message ?? exception.message);
        body = {
          code: CODE_BY_STATUS[status] ?? 'error',
          message: Array.isArray(message) ? message.join('; ') : message,
        };
      }
    } else {
      // Unknown errors are logged in full but never leaked to the client.
      this.logger.error(
        `${req.requestId ?? '-'} ${req.method} ${req.originalUrl}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    body.requestId = req.requestId;
    res.status(status).json(body);
  }
}
