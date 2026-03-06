import { Request, Response, NextFunction } from 'express';
import { Display } from '../models';
import Setting from '../models/Setting';
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
    const { serialNumber, macAddress, deviceModel, deviceOsVersion, appVersion, displayIdentifier } = req.body;

    if (!serialNumber) {
      throw new AppError('Seriennummer ist erforderlich', 400);
    }

    // ===== Display-spezifische Registrierung (Priorität!) =====
    // Wenn ein displayIdentifier mitgesendet wird, prüfe ob dieses Display
    // registration_open = true hat (vom Admin geöffnet).
    // Dies hat Vorrang vor der serialNumber-Prüfung, damit ein Client
    // auch dann verknüpft werden kann, wenn er vorher anderswo registriert war.
    if (displayIdentifier) {
      const targetDisplay = await Display.findOne({ where: { identifier: displayIdentifier } });

      if (targetDisplay && targetDisplay.registrationOpen) {
        // Falls diese Seriennummer noch auf einem anderen Display liegt, dort entfernen
        const oldDisplay = await Display.findOne({ where: { serialNumber } });
        if (oldDisplay && oldDisplay.id !== targetDisplay.id) {
          oldDisplay.serialNumber = null as any;
          oldDisplay.deviceToken = null as any;
          oldDisplay.macAddress = null as any;
          oldDisplay.authorizationStatus = 'pending';
          await oldDisplay.save();
          logger.info(`Alte Verknüpfung entfernt: SN ${serialNumber} von Display ${oldDisplay.id}`);
        }

        // Admin hat Registrierung für dieses Display geöffnet → Client direkt verknüpfen
        const deviceToken = crypto.randomUUID();

        targetDisplay.serialNumber = serialNumber;
        targetDisplay.macAddress = macAddress || undefined;
        targetDisplay.deviceToken = deviceToken;
        targetDisplay.deviceModel = deviceModel || undefined;
        targetDisplay.deviceOsVersion = deviceOsVersion || undefined;
        targetDisplay.appVersion = appVersion || undefined;
        targetDisplay.authorizationStatus = 'authorized';
        targetDisplay.lastSeenAt = new Date();
        targetDisplay.registeredAt = new Date();
        targetDisplay.registrationOpen = false;
        await targetDisplay.save();

        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        logger.info(`Client verknüpft mit Display ${targetDisplay.id} (${displayIdentifier}) via offene Registrierung. SN: ${serialNumber}, IP: ${ip}`);

        res.status(201).json({
          success: true,
          data: {
            deviceToken,
            authorizationStatus: 'authorized',
            displayId: targetDisplay.id,
            displayIdentifier: targetDisplay.identifier,
            displayName: targetDisplay.name,
          },
          message: 'Gerät erfolgreich mit Display verknüpft und autorisiert.',
        });
        return;
      }
      // If display exists but registration not open, fall through to normal logic
    }

    // Check if device is already registered (by serialNumber on any display)
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

    // New device — check if global registration mode is enabled
    const regModeSetting = await Setting.findOne({ where: { key: 'display.registrationMode' } });
    const registrationMode = regModeSetting?.value === 'true';

    if (!registrationMode) {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      securityLogger.logSuspiciousActivity('Device registration attempted while registration mode is disabled', ip, {
        serialNumber,
        macAddress,
        deviceModel,
      });
      throw new AppError(
        'Registrierung ist derzeit deaktiviert. Bitte den Administrator kontaktieren.',
        403
      );
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
      organizationId: 1, // Standard-Organisation
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

/**
 * Admin: Open registration on a display — next connecting client will be linked
 * POST /api/displays/:id/open-registration
 */
export const openRegistration = async (
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

    // If already has a registered device, clear it first
    if (display.serialNumber || display.deviceToken) {
      display.serialNumber = undefined;
      display.macAddress = undefined;
      display.deviceToken = undefined;
      display.deviceModel = undefined;
      display.deviceOsVersion = undefined;
      display.appVersion = undefined;
      display.lastSeenAt = undefined;
      display.registeredAt = undefined;
      display.authorizationStatus = 'authorized';
    }

    display.registrationOpen = true;
    await display.save();

    logger.info(`Registrierung geöffnet für Display ${id} (${display.identifier})`);

    res.json({
      success: true,
      data: display,
      message: `Registrierung für Display "${display.name}" geöffnet. Der nächste Client wird verknüpft.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Close registration on a display
 * POST /api/displays/:id/close-registration
 */
export const closeRegistration = async (
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

    display.registrationOpen = false;
    await display.save();

    logger.info(`Registrierung geschlossen für Display ${id} (${display.identifier})`);

    res.json({
      success: true,
      data: display,
      message: `Registrierung für Display "${display.name}" geschlossen.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register a device via GET (Android WebView compatibility)
 * GET /api/devices/register?serialNumber=...&displayIdentifier=...
 * Android WebView's shouldInterceptRequest kann POST-Bodys nicht weiterleiten,
 * daher bieten wir die gleiche Logik auch per GET mit Query-Parametern.
 */
export const registerDeviceGet = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Query-Parameter in req.body kopieren, damit registerDevice funktioniert
  req.body = {
    ...req.body,
    serialNumber: req.query.serialNumber,
    macAddress: req.query.macAddress,
    deviceModel: req.query.deviceModel,
    deviceOsVersion: req.query.deviceOsVersion,
    appVersion: req.query.appVersion,
    displayIdentifier: req.query.displayIdentifier,
  };
  return registerDevice(req, res, next);
};
