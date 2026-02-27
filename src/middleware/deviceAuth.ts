import { Request, Response, NextFunction } from 'express';
import { Display } from '../models';
import { AppError } from './errorHandler';
import { securityLogger } from '../utils/logger';

/**
 * Extended Request with device context
 */
export interface DeviceRequest extends Request {
  device?: Display;
}

/**
 * Device authentication middleware
 * Verifies the device token from Authorization header and checks authorization status.
 * Used for device-specific API endpoints (heartbeat, status).
 */
export const deviceAuth = async (
  req: DeviceRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Kein Device-Token gefunden. Geräte-Authentifizierung erforderlich.', 401);
    }

    const token = authHeader.substring(7);

    // Look up display by device token
    const display = await Display.findOne({
      where: { deviceToken: token },
    });

    if (!display) {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      securityLogger.logSuspiciousActivity('Invalid device token', ip, {
        path: req.path,
        method: req.method,
      });
      throw new AppError('Ungültiger Device-Token', 401);
    }

    // Attach device to request
    req.device = display;

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Geräte-Authentifizierung fehlgeschlagen', 401));
    }
  }
};

/**
 * Middleware to check if device is authorized (not just registered)
 * Use after deviceAuth middleware
 */
export const requireAuthorized = (
  req: DeviceRequest,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.device) {
    return next(new AppError('Geräte-Authentifizierung erforderlich', 401));
  }

  if (req.device.authorizationStatus !== 'authorized') {
    return next(new AppError(`Gerät ist nicht autorisiert. Status: ${req.device.authorizationStatus}`, 403));
  }

  next();
};

export default { deviceAuth, requireAuthorized };
