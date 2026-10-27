import { randomUUID } from 'node:crypto';
import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const logger = new Logger('HTTP');

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
  }
}

/**
 * Gives every request an id (returned in the x-request-id header and in error bodies)
 * and logs one line per request. Bodies, headers and tokens are never logged.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header('x-request-id');
  const id = incoming && /^[\w-]{8,64}$/.test(incoming) ? incoming : randomUUID();
  req.requestId = id;
  res.setHeader('x-request-id', id);

  const started = Date.now();
  res.on('finish', () => {
    logger.log(`${id} ${req.method} ${req.originalUrl.split('?')[0]} ${res.statusCode} ${Date.now() - started}ms`);
  });
  next();
}
