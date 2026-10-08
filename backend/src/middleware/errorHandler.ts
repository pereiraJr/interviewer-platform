import type { NextFunction, Request, Response } from 'express';

export interface ErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function notFoundHandler(_req: Request, res: Response): void {
  const body: ErrorBody = {
    error: { code: 'NOT_FOUND', message: 'Resource not found' },
  };
  res.status(404).json(body);
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const isHttpError = error instanceof HttpError;
  const status = isHttpError ? error.status : 500;
  const code = isHttpError ? error.code : 'INTERNAL_ERROR';
  const message = isHttpError ? error.message : 'An unexpected error occurred';

  if (status >= 500) {
    console.error('[error]', error);
  }

  const body: ErrorBody = { error: { code, message } };
  res.status(status).json(body);
}
