import { Request, Response, NextFunction } from 'express';
import { Display } from '../models';
import { AppError } from '../middleware/errorHandler';
import { logger, securityLogger } from '../utils/logger';
import { DeviceRequest } from '../middleware/deviceAuth';
import crypto from 'crypto';
import sequelize from '../config/database';

/**
 * Register a new device or return existing registration
 * POST /api/devices/register
 * Body: { serialNumber, macAddress, deviceModel, deviceOsVersion, appVersion }
 */
export const registerDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { serialNumber, macAddress, deviceModel, deviceOsVersion, appVersion } = req.body;

    if (!serialNumber) {
      throw new AppError('Seriennummer ist erforderlich', 400);
    }

    // Check if device is already registered
    let display = await Display.findOne({
      where: { serialNumber },
    });

    if (display) {
      // Device already known - update info and return token
      display.macAddress = macAddress || display.macAddress;
      display.deviceModel = deviceModel || display.deviceModel;
      display.deviceOsVersion = deviceOsVersion || display.deviceOsVersion;
      display.appVersion = appVersion || display.appVersion;
      display.lastSeenAt = new Date();
      await display.save();

      logger.info(`Gerät erneut registriert: ${serialNumber} (Display ${display.id}, Status: ${display.authorizationStatus})`);

      res.json({
        success: true,
        data: {
          deviceToken: display.deviceToken,
          authorizationStatus: display.authorizationStatus,
          displayId: display.id,
          displayIdentifier: display.identifier,
          displayName: display.name,
        },
      });
      return;
    }

    // New device - check license limit
    const MAX_LICENSED_DISPLAYS = 2;
    const displayCount = await Display.count();
    if (displayCount >= MAX_LICENSED_DISPLAYS) {
      throw new AppError(
        `Display-Lizenzlimit erreicht (${MAX_LICENSED_DISPLAYS}/${MAX_LICENSED_DISPLAYS}). Neue Geräte können nicht registriert werden.`,
        403
      );
    }

    // Create new display for this device
    const deviceToken = crypto.randomUUID();
    
    // Generate sequential identifier: display01, display02, ...
    const allDisplays = await Display.findAll({
      attributes: ['identifier'],
      where: sequelize.where(
        sequelize.fn('LEFT', sequelize.col('identifier'), 7),
        'display'
      ),
      order: [['identifier', 'ASC']],
    });
    
    let nextNum = 1;
    const usedNums = new Set(
      allDisplays
        .map(d => parseInt(d.identifier.replace('display', ''), 10))
        .filter(n => !isNaN(n))
    );
    while (usedNums.has(nextNum)) nextNum++;
    const uniqueIdentifier = `display${String(nextNum).padStart(2, '0')}`;

    display = await Display.create({
      name: `Display ${String(nextNum).padStart(2, '0')} — ${deviceModel || 'Android TV'}`,
      identifier: uniqueIdentifier,
      description: `Automatisch registriert: ${deviceModel || 'Unbekanntes Gerät'}`,
      isActive: true,
      serialNumber,
      macAddress: macAddress || null,
      deviceToken,
      authorizationStatus: 'pending',
      deviceModel: deviceModel || null,
      deviceOsVersion: deviceOsVersion || null,
      appVersion: appVersion || null,
      lastSeenAt: new Date(),
      registeredAt: new Date(),
    });

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    securityLogger.logSuspiciousActivity('New device registered', ip, {
      serialNumber,
      macAddress,
      deviceModel,
      displayId: display.id,
    });

    logger.info(`Neues Gerät registriert: ${serialNumber} → Display ${display.id} (${uniqueIdentifier}), Status: pending`);

    res.status(201).json({
      success: true,
      data: {
        deviceToken,
        authorizationStatus: 'pending',
        displayId: display.id,
        displayIdentifier: uniqueIdentifier,
        displayName: display.name,
      },
      message: 'Gerät registriert. Warten auf Autorisierung durch Administrator.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get device authorization status
 * GET /api/devices/status
 * Requires: Device token in Authorization header
 */
export const getDeviceStatus = async (
  req: DeviceRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const display = req.device!;

    res.json({
      success: true,
      data: {
        authorizationStatus: display.authorizationStatus,
        displayId: display.id,
        displayIdentifier: display.identifier,
        displayName: display.name,
        isActive: display.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Device heartbeat - update last seen timestamp
 * POST /api/devices/heartbeat
 * Requires: Device token in Authorization header
 */
export const deviceHeartbeat = async (
  req: DeviceRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const display = req.device!;
    const { appVersion } = req.body;

    display.lastSeenAt = new Date();
    if (appVersion) {
      display.appVersion = appVersion;
    }
    await display.save();

    res.json({
      success: true,
      data: {
        authorizationStatus: display.authorizationStatus,
        isActive: display.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Authorize a pending device
 * POST /api/displays/:id/authorize
 */
export const authorizeDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const display = await Display.findByPk(id);
    if (!display) {
      throw new AppError('Display nicht gefunden', 404);
    }

    if (!display.serialNumber) {
      throw new AppError('Dieses Display ist kein registriertes Gerät', 400);
    }

    display.authorizationStatus = 'authorized';
    await display.save();

    logger.info(`Gerät autorisiert: Display ${id} (SN: ${display.serialNumber})`);

    res.json({
      success: true,
      data: display,
      message: `Gerät ${display.serialNumber} wurde autorisiert.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Reject a pending device
 * POST /api/displays/:id/reject
 */
export const rejectDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const display = await Display.findByPk(id);
    if (!display) {
      throw new AppError('Display nicht gefunden', 404);
    }

    if (!display.serialNumber) {
      throw new AppError('Dieses Display ist kein registriertes Gerät', 400);
    }

    display.authorizationStatus = 'rejected';
    await display.save();

    logger.info(`Gerät abgelehnt: Display ${id} (SN: ${display.serialNumber})`);

    res.json({
      success: true,
      data: display,
      message: `Gerät ${display.serialNumber} wurde abgelehnt.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Revoke authorization of a device
 * POST /api/displays/:id/revoke
 */
export const revokeDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const display = await Display.findByPk(id);
    if (!display) {
      throw new AppError('Display nicht gefunden', 404);
    }

    if (!display.serialNumber) {
      throw new AppError('Dieses Display ist kein registriertes Gerät', 400);
    }

    display.authorizationStatus = 'revoked';
    await display.save();

    logger.info(`Gerät-Autorisierung widerrufen: Display ${id} (SN: ${display.serialNumber})`);

    res.json({
      success: true,
      data: display,
      message: `Autorisierung für Gerät ${display.serialNumber} wurde widerrufen.`,
    });
  } catch (error) {
    next(error);
  }
};
