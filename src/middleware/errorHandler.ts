import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors';
import { withCorrelation } from '../utils/logger';

/**
 * Centralized Express error handler.
 *
 * Rule: the client (customer-facing API consumer, e.g. the WhatsApp layer
 * or the future admin dashboard) NEVER receives a stack trace or raw
 * error message unless the error is a known `AppError`. Everything else
 * is logged in full internally and reduced to a generic message outward.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  const log = withCorrelation(req.correlationId ?? 'no-correlation-id');

  if (err instanceof AppError) {
    log.warn({ err, code: err.code }, 'Handled application error');
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
      correlationId: req.correlationId,
    });
  }

  log.error({ err }, 'Unhandled error');
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan internal. Silakan coba lagi.' },
    correlationId: req.correlationId,
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
    correlationId: req.correlationId,
  });
}
