import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Display } from '../models';
import Setting from '../models/Setting';
import { AppError } from './errorHandler';
import { securityLogger, logger } from '../utils/logger';

/**
 * Extended Request with device context
 */
export interface DeviceRequest extends Request {
  device?: Display;
}

// ============================================
// Setting cache — avoids DB hit on every request
// ============================================
interface SettingCacheEntry {
  value: string;
  expiresAt: number;
}

const settingCache = new Map<string, SettingCacheEntry>();
const SETTING_CACHE_TTL = 60_000; // 60 seconds

export async function getCachedSetting(key: string, defaultValue: string): Promise<string> {
  const cached = settingCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  try {
    const setting = await Setting.findOne({ where: { key } });
    const value = setting ? setting.value : defaultValue;
    settingCache.set(key, { value, expiresAt: Date.now() + SETTING_CACHE_TTL });
    return value;
  } catch (error) {
    logger.warn(`Fehler beim Laden von Setting ${key}, verwende Default: ${defaultValue}`);
    return defaultValue;
  }
}

/**
 * Invalidate a cached setting (call when admin updates settings)
 */
export function invalidateSettingCache(key?: string): void {
  if (key) {
    settingCache.delete(key);
  } else {
    settingCache.clear();
  }
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

/**
 * Conditional device authentication middleware for public endpoints.
 * Checks 'display.secureMode' setting:
 *   - false (default): No auth required, passes through
 *   - true: Requires valid, authorized device token
 *
 * Returns structured JSON errors so the display client can react:
 *   401 → { requiresAuth: true } — no token or invalid token
 *   403 → { authorizationStatus: '...' } — token valid but not authorized
 */
export const conditionalDeviceAuth = async (
  req: DeviceRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const secureMode = await getCachedSetting('display.secureMode', 'false');

    // Open mode — no auth needed
    if (secureMode !== 'true') {
      return next();
    }

    // Admin preview — bypass device auth (content is public by nature)
    if (req.query.preview !== undefined) {
      return next();
    }

    // Secure mode — check for device token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        requiresAuth: true,
        message: 'Gesicherter Modus aktiv. Device-Token erforderlich.',
      });
      return;
    }

    const token = authHeader.substring(7);

    const display = await Display.findOne({
      where: { deviceToken: token },
    });

    if (!display) {
      // Allow admin preview: accept valid user JWT when ?preview is set
      if (req.query.preview !== undefined) {
        try {
          const secret = process.env.JWT_SECRET || 'change-this-in-production';
          jwt.verify(token, secret);
          return next();
        } catch {
          // Not a valid user JWT — fall through to 401
        }
      }
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      securityLogger.logSuspiciousActivity('Invalid device token (secure mode)', ip, {
        path: req.path,
        method: req.method,
      });
      res.status(401).json({
        success: false,
        requiresAuth: true,
        message: 'Ungültiger Device-Token.',
      });
      return;
    }

    // Token valid — check authorization status
    if (display.authorizationStatus !== 'authorized') {
      res.status(403).json({
        success: false,
        authorizationStatus: display.authorizationStatus,
        message: `Gerät ist nicht autorisiert. Status: ${display.authorizationStatus}`,
      });
      return;
    }

    // All good — attach device and continue
    req.device = display;
    next();
  } catch (error) {
    logger.error('Fehler in conditionalDeviceAuth:', error);
    // On error, fail open to avoid locking out all displays
    next();
  }
};

export default { deviceAuth, requireAuthorized, conditionalDeviceAuth, invalidateSettingCache };
