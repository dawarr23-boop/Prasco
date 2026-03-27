import { Request, Response, NextFunction, RequestHandler } from 'express';
import { logger } from '../utils/logger';

export interface ApiError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

export const errorHandler = (
    err: ApiError,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Interner Serverfehler';

    // Log error
    logger.error(`Error ${statusCode}: ${message}`, {
        error: err,
        url: req.url,
        method: req.method,
        ip: req.ip,
    });

    // Send error response
    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    });
};

export class AppError extends Error implements ApiError {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export default errorHandler;

/**
 * Wraps an async route handler so that any rejected promise is forwarded to
 * Express's next(err) error pipeline instead of causing an unhandled rejection.
 * Usage: router.get('/path', asyncHandler(myController.method))
 */
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
