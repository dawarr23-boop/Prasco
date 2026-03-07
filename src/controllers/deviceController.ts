import { Request, Response, NextFunction } from 'express';
import { Display } from '../models';
import Setting from '../models/Setting';
import { AppError } from '../middleware/errorHandler';
import { logger, securityLogger } from '../utils/logger';
import { DeviceRequest } from '../middleware/deviceAuth';
import crypto from 'crypto';
import sequelize from '../config/database';
import { Transaction } from 'sequelize';

// ============================================
// Unified Registration Contract
// ============================================
//
// POST /api/devices/register
// Body:
//   serialNumber:      string  (required) — ANDROID_ID (native) oder "web-<uuid>" (web)
//   clientType:        string  (required) — "native" | "web"
//   deviceModel:       string  (required) — z.B. "Xiaomi MITV-MSSP1" oder "Chrome (Win32)"
//   appVersion:        string  (required) — z.B. "2.1.0" (native) oder "web-1.0" (web)
//   macAddress?:       string  (optional) — MAC-Adresse (nur native)
//   deviceOsVersion?:  string  (optional) — z.B. "Android 12"
//   displayIdentifier?: string (optional) — Ziel-Display für gezielte Registrierung
//
// Response:
//   { success, data: { deviceToken, authorizationStatus, displayId, displayIdentifier, displayName }, message? }
//
// Status-Flow:
//   Admin erstellt Display → pending (kein Gerät verknüpft)
//   Admin öffnet Registrierung → pending, registrationOpen=true
//   Client registriert sich → authorized (displayIdentifier) oder pending (global)
//   Admin autorisiert → authorized
//   Admin lehnt ab → rejected
//   Admin widerruft → revoked
// ============================================

/**
 * Determine clientType from serialNumber if not explicitly provided.
 * Backward-compatible: detects "web-" prefix.
 */
function resolveClientType(serialNumber: string, clientType?: string): 'native' | 'web' {
  if (clientType === 'native' || clientType === 'web') return clientType;
  return serialNumber.startsWith('web-') ? 'web' : 'native';
}

/**
 * Register a new device or return existing registration.
 * Uses database transactions to prevent race conditions.
 *
 * POST /api/devices/register
 */
export const registerDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const t: Transaction = await sequelize.transaction();

  try {
    const { serialNumber, macAddress, deviceModel, deviceOsVersion, appVersion, displayIdentifier } = req.body;
    const clientType = resolveClientType(serialNumber, req.body.clientType);

    if (!serialNumber) {
      await t.rollback();
      throw new AppError('Seriennummer ist erforderlich', 400);
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    // ===== Pfad 1: Gezielte Registrierung (displayIdentifier) =====
    if (displayIdentifier) {
      const targetDisplay = await Display.findOne({
        where: { identifier: displayIdentifier },
        lock: Transaction.LOCK.UPDATE,
        transaction: t,
      });

      if (targetDisplay && targetDisplay.registrationOpen) {
        // Falls diese Seriennummer noch auf einem anderen Display liegt, dort entfernen
        const oldDisplay = await Display.findOne({
          where: { serialNumber },
          transaction: t,
        });
        if (oldDisplay && oldDisplay.id !== targetDisplay.id) {
          await oldDisplay.update({
            serialNumber: null as any,
            deviceToken: null as any,
            macAddress: null as any,
            clientType: null as any,
            deviceModel: null as any,
            deviceOsVersion: null as any,
            appVersion: null as any,
            authorizationStatus: 'pending',
            lastSeenAt: null as any,
            registeredAt: null as any,
          }, { transaction: t });
          logger.info(`Alte Verknüpfung entfernt: SN ${serialNumber} von Display ${oldDisplay.id}`);
        }

        // Client direkt verknüpfen und autorisieren
        const deviceToken = crypto.randomUUID();

        await targetDisplay.update({
          serialNumber,
          macAddress: macAddress || null,
          deviceToken,
          clientType,
          deviceModel: deviceModel || null,
          deviceOsVersion: deviceOsVersion || null,
          appVersion: appVersion || null,
          authorizationStatus: 'authorized',
          lastSeenAt: new Date(),
          registeredAt: new Date(),
          registrationOpen: false,
        }, { transaction: t });

        await t.commit();

        logger.info(`Client verknüpft mit Display ${targetDisplay.id} (${displayIdentifier}) via offene Registrierung. SN: ${serialNumber}, Typ: ${clientType}, IP: ${ip}`);

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

    // ===== Pfad 2: Bekanntes Gerät (serialNumber bereits registriert) =====
    const existingDisplay = await Display.findOne({
      where: { serialNumber },
      transaction: t,
    });

    if (existingDisplay) {
      await existingDisplay.update({
        macAddress: macAddress || existingDisplay.macAddress,
        clientType,
        deviceModel: deviceModel || existingDisplay.deviceModel,
        deviceOsVersion: deviceOsVersion || existingDisplay.deviceOsVersion,
        appVersion: appVersion || existingDisplay.appVersion,
        lastSeenAt: new Date(),
      }, { transaction: t });

      await t.commit();

      logger.info(`Gerät erneut registriert: ${serialNumber} (Display ${existingDisplay.id}, Status: ${existingDisplay.authorizationStatus})`);

      res.json({
        success: true,
        data: {
          deviceToken: existingDisplay.deviceToken,
          authorizationStatus: existingDisplay.authorizationStatus,
          displayId: existingDisplay.id,
          displayIdentifier: existingDisplay.identifier,
          displayName: existingDisplay.name,
        },
      });
      return;
    }

    // ===== Pfad 2b: Offenes Display suchen (registrationOpen=true, kein Gerät) =====
    const openDisplay = await Display.findOne({
      where: {
        serialNumber: null as any,
        registrationOpen: true,
      },
      lock: Transaction.LOCK.UPDATE,
      transaction: t,
    });

    if (openDisplay) {
      const deviceToken = crypto.randomUUID();

      await openDisplay.update({
        serialNumber,
        macAddress: macAddress || null,
        deviceToken,
        clientType,
        deviceModel: deviceModel || null,
        deviceOsVersion: deviceOsVersion || null,
        appVersion: appVersion || null,
        authorizationStatus: 'authorized',
        lastSeenAt: new Date(),
        registeredAt: new Date(),
        registrationOpen: false,
      }, { transaction: t });

      await t.commit();

      logger.info(`Client auto-verknüpft mit offenem Display ${openDisplay.id} (${openDisplay.identifier}). SN: ${serialNumber}, Typ: ${clientType}, IP: ${ip}`);

      res.status(201).json({
        success: true,
        data: {
          deviceToken,
          authorizationStatus: 'authorized',
          displayId: openDisplay.id,
          displayIdentifier: openDisplay.identifier,
          displayName: openDisplay.name,
        },
        message: 'Gerät erfolgreich mit offenem Display verknüpft und autorisiert.',
      });
      return;
    }

    // ===== Pfad 3: Neues Gerät — Globale Registrierung =====
    const regModeSetting = await Setting.findOne({
      where: { key: 'display.registrationMode' },
      transaction: t,
    });
    const registrationMode = regModeSetting?.value === 'true';

    if (!registrationMode) {
      await t.rollback();
      securityLogger.logSuspiciousActivity('Device registration attempted while disabled', ip, {
        serialNumber, macAddress, deviceModel, clientType,
      });
      throw new AppError(
        'Registrierung ist derzeit deaktiviert. Bitte den Administrator kontaktieren.',
        403
      );
    }

    // Lizenzlimit prüfen
    const licenseSetting = await Setting.findOne({
      where: { key: 'display.maxLicensedDisplays' },
      transaction: t,
    });
    const MAX_LICENSED_DISPLAYS = licenseSetting ? parseInt(licenseSetting.value, 10) : 5;
    const displayCount = await Display.count({ transaction: t });
    if (displayCount >= MAX_LICENSED_DISPLAYS) {
      await t.rollback();
      throw new AppError(
        `Display-Lizenzlimit erreicht (${displayCount}/${MAX_LICENSED_DISPLAYS}). Neue Geräte können nicht registriert werden.`,
        403
      );
    }

    // Sequentiellen Identifier generieren
    const allDisplays = await Display.findAll({
      attributes: ['identifier'],
      where: sequelize.where(
        sequelize.fn('LEFT', sequelize.col('identifier'), 7),
        'display'
      ),
      order: [['identifier', 'ASC']],
      transaction: t,
    });

    let nextNum = 1;
    const usedNums = new Set(
      allDisplays
        .map(d => parseInt(d.identifier.replace('display', ''), 10))
        .filter(n => !isNaN(n))
    );
    while (usedNums.has(nextNum)) nextNum++;
    const uniqueIdentifier = `display${String(nextNum).padStart(2, '0')}`;

    const deviceToken = crypto.randomUUID();

    const display = await Display.create({
      name: `Display ${String(nextNum).padStart(2, '0')} — ${deviceModel || 'Unbekannt'}`,
      identifier: uniqueIdentifier,
      description: `Automatisch registriert: ${deviceModel || 'Unbekanntes Gerät'}`,
      isActive: true,
      organizationId: 1,
      serialNumber,
      macAddress: macAddress || null,
      deviceToken,
      clientType,
      authorizationStatus: 'pending',
      deviceModel: deviceModel || null,
      deviceOsVersion: deviceOsVersion || null,
      appVersion: appVersion || null,
      lastSeenAt: new Date(),
      registeredAt: new Date(),
    }, { transaction: t });

    await t.commit();

    securityLogger.logSuspiciousActivity('New device registered', ip, {
      serialNumber, macAddress, clientType, deviceModel, displayId: display.id,
    });

    logger.info(`Neues Gerät registriert: ${serialNumber} → Display ${display.id} (${uniqueIdentifier}), Typ: ${clientType}, Status: pending`);

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
    try { await t.rollback(); } catch (_) { /* already committed/rolled back */ }
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
      throw new AppError('Dieses Display hat kein verknüpftes Gerät', 400);
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
      throw new AppError('Dieses Display hat kein verknüpftes Gerät', 400);
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
      throw new AppError('Dieses Display hat kein verknüpftes Gerät', 400);
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
 * Admin: Unlink device from display (keep display, clear device data)
 * POST /api/displays/:id/unlink
 */
export const unlinkDevice = async (
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
      throw new AppError('Dieses Display hat kein verknüpftes Gerät', 400);
    }

    const oldSerial = display.serialNumber;

    await display.update({
      serialNumber: null as any,
      macAddress: null as any,
      deviceToken: null as any,
      clientType: null as any,
      deviceModel: null as any,
      deviceOsVersion: null as any,
      appVersion: null as any,
      authorizationStatus: 'pending',
      lastSeenAt: null as any,
      registeredAt: null as any,
      registrationOpen: true,
    });

    logger.info(`Gerät getrennt von Display ${id}: SN ${oldSerial} — Display ist nun offen für neue Registrierung`);

    res.json({
      success: true,
      data: display,
      message: `Gerät ${oldSerial} wurde von Display "${display.name}" getrennt.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Open registration on a display — next connecting client will be linked.
 * Clears any existing device binding and sets registrationOpen = true.
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

    // Clear any existing device data and open for registration
    await display.update({
      serialNumber: null as any,
      macAddress: null as any,
      deviceToken: null as any,
      clientType: null as any,
      deviceModel: null as any,
      deviceOsVersion: null as any,
      appVersion: null as any,
      authorizationStatus: 'pending',
      lastSeenAt: null as any,
      registeredAt: null as any,
      registrationOpen: true,
    });

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
 * Register a device via GET (WebView compatibility).
 * WebView's shouldInterceptRequest kann POST-Bodys nicht weiterleiten,
 * daher bieten wir die gleiche Logik auch per GET mit Query-Parametern.
 *
 * GET /api/devices/register?serialNumber=...&clientType=web&...
 */
export const registerDeviceGet = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Query-Parameter in req.body kopieren, damit registerDevice funktioniert
  req.body = {
    serialNumber: req.query.serialNumber,
    clientType: req.query.clientType,
    macAddress: req.query.macAddress,
    deviceModel: req.query.deviceModel,
    deviceOsVersion: req.query.deviceOsVersion,
    appVersion: req.query.appVersion,
    displayIdentifier: req.query.displayIdentifier,
  };
  return registerDevice(req, res, next);
};
