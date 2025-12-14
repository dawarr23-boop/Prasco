import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from './errorHandler';
import { JWTPayload } from '../types';
import { securityLogger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Kein Token gefunden. Authentifizierung erforderlich.', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify token
    const decoded = verifyAccessToken(token);

    // Attach user to request
    req.user = decoded;

    next();
  } catch (error) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    securityLogger.logSuspiciousActivity('Invalid token attempt', ip, {
      path: req.path,
      method: req.method,
    });

    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Ungültiger oder abgelaufener Token', 401));
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentifizierung erforderlich', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('Zugriff verweigert. Unzureichende Berechtigungen.', 403);
    }

    next();
  };
};

export default { authenticate, authorize };
