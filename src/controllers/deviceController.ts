import { Request, Response, NextFunction } from 'express';
import { DeviceRegistration } from '../models';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { MAC_ADDRESS_REGEX } from '../utils/validation';

/**
 * Register a new device (public – called by client on first boot)
 * POST /api/public/devices/register
 * Body: { serialNumber, macAddress, deviceName? }
 */
export const registerDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { serialNumber, macAddress, deviceName } = req.body;

    if (!serialNumber || !macAddress) {
      throw new AppError('serialNumber und macAddress sind erforderlich', 400);
    }

    if (!MAC_ADDRESS_REGEX.test(macAddress)) {
      throw new AppError('Ungültiges MAC-Adress-Format (erwartet: XX:XX:XX:XX:XX:XX)', 400);
    }

    // Upsert: if device already registered, just update lastSeen / deviceName
    const [device, created] = await DeviceRegistration.findOrCreate({
      where: { serialNumber },
      defaults: {
        serialNumber,
        macAddress,
        deviceName: deviceName || null,
        status: 'pending',
        lastSeen: new Date(),
      },
    });

    if (!created) {
      // Update macAddress (may change after network reset) and lastSeen
      device.macAddress = macAddress;
      device.lastSeen = new Date();
      if (deviceName) device.deviceName = deviceName;
      await device.save();
    }

    res.status(created ? 201 : 200).json({
      success: true,
      data: {
        id: device.id,
        serialNumber: device.serialNumber,
        macAddress: device.macAddress,
        status: device.status,
        deviceName: device.deviceName,
        displayId: device.displayId,
      },
      message: created
        ? 'Gerät registriert. Warten auf Freigabe durch Administrator.'
        : 'Gerät bereits registriert. Status aktualisiert.',
    });

    logger.info(`Gerät ${created ? 'registriert' : 'aktualisiert'}: ${serialNumber} (${macAddress})`);
  } catch (error) {
    next(error);
  }
};

/**
 * Verify device authorization (public – called by client periodically)
 * POST /api/public/devices/verify
 * Body: { serialNumber, macAddress }
 * Returns: { authorized: boolean, displayId?, displayIdentifier? }
 */
export const verifyDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { serialNumber, macAddress } = req.body;

    if (!serialNumber || !macAddress) {
      throw new AppError('serialNumber und macAddress sind erforderlich', 400);
    }

    const device = await DeviceRegistration.findOne({
      where: { serialNumber },
    });

    if (!device) {
      res.status(404).json({
        success: false,
        authorized: false,
        message: 'Gerät nicht registriert. Bitte registrieren Sie das Gerät zuerst.',
      });
      return;
    }

    // Update macAddress and lastSeen
    device.macAddress = macAddress;
    device.lastSeen = new Date();
    await device.save();

    if (device.status !== 'approved') {
      res.json({
        success: true,
        authorized: false,
        status: device.status,
        message:
          device.status === 'pending'
            ? 'Gerät wartet auf Freigabe durch den Administrator.'
            : 'Gerät wurde abgelehnt. Bitte kontaktieren Sie den Administrator.',
      });
      return;
    }

    // Device approved – return display info if linked
    let displayIdentifier: string | null = null;
    if (device.displayId) {
      const { Display } = await import('../models');
      const display = await Display.findByPk(device.displayId, {
        attributes: ['id', 'identifier', 'name', 'isActive'],
      });
      if (display && display.isActive) {
        displayIdentifier = display.identifier;
      }
    }

    res.json({
      success: true,
      authorized: true,
      status: 'approved',
      displayId: device.displayId ?? null,
      displayIdentifier,
      message: 'Gerät ist berechtigt.',
    });

    logger.info(`Gerät verifiziert: ${serialNumber} – autorisiert`);
  } catch (error) {
    next(error);
  }
};

/**
 * List all device registrations (admin)
 * GET /api/devices
 */
export const getAllDevices = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const where: Record<string, unknown> = {};

    if (req.user?.organizationId) {
      where.organizationId = req.user.organizationId;
    }

    const { status } = req.query;
    if (status && ['pending', 'approved', 'rejected'].includes(status as string)) {
      where.status = status;
    }

    const devices = await DeviceRegistration.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: devices });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single device registration (admin)
 * GET /api/devices/:id
 */
export const getDeviceById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const device = await DeviceRegistration.findByPk(req.params.id);

    if (!device) throw new AppError('Gerät nicht gefunden', 404);

    if (req.user?.organizationId && device.organizationId !== req.user.organizationId) {
      throw new AppError('Keine Berechtigung für dieses Gerät', 403);
    }

    res.json({ success: true, data: device });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a device (admin)
 * PUT /api/devices/:id/approve
 * Body: { displayId?, notes? }
 */
export const approveDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const device = await DeviceRegistration.findByPk(req.params.id);

    if (!device) throw new AppError('Gerät nicht gefunden', 404);

    if (req.user?.organizationId && device.organizationId !== req.user.organizationId) {
      throw new AppError('Keine Berechtigung für dieses Gerät', 403);
    }

    device.status = 'approved';
    if (req.body.displayId !== undefined) device.displayId = req.body.displayId || null;
    if (req.body.notes !== undefined) device.notes = req.body.notes;
    if (!device.organizationId && req.user?.organizationId) {
      device.organizationId = req.user.organizationId;
    }
    await device.save();

    res.json({ success: true, data: device, message: 'Gerät wurde freigegeben.' });
    logger.info(`Gerät freigegeben: ${device.serialNumber} von User ${req.user?.userId}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a device (admin)
 * PUT /api/devices/:id/reject
 * Body: { notes? }
 */
export const rejectDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const device = await DeviceRegistration.findByPk(req.params.id);

    if (!device) throw new AppError('Gerät nicht gefunden', 404);

    if (req.user?.organizationId && device.organizationId !== req.user.organizationId) {
      throw new AppError('Keine Berechtigung für dieses Gerät', 403);
    }

    device.status = 'rejected';
    if (req.body.notes !== undefined) device.notes = req.body.notes;
    await device.save();

    res.json({ success: true, data: device, message: 'Gerät wurde abgelehnt.' });
    logger.info(`Gerät abgelehnt: ${device.serialNumber} von User ${req.user?.userId}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Update device (admin) – change displayId, deviceName, notes
 * PUT /api/devices/:id
 */
export const updateDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const device = await DeviceRegistration.findByPk(req.params.id);

    if (!device) throw new AppError('Gerät nicht gefunden', 404);

    if (req.user?.organizationId && device.organizationId !== req.user.organizationId) {
      throw new AppError('Keine Berechtigung für dieses Gerät', 403);
    }

    if (req.body.deviceName !== undefined) device.deviceName = req.body.deviceName;
    if (req.body.displayId !== undefined) device.displayId = req.body.displayId || null;
    if (req.body.notes !== undefined) device.notes = req.body.notes;
    await device.save();

    res.json({ success: true, data: device, message: 'Gerät aktualisiert.' });
    logger.info(`Gerät aktualisiert: ${device.id}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete device registration (admin)
 * DELETE /api/devices/:id
 */
export const deleteDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const device = await DeviceRegistration.findByPk(req.params.id);

    if (!device) throw new AppError('Gerät nicht gefunden', 404);

    if (req.user?.organizationId && device.organizationId !== req.user.organizationId) {
      throw new AppError('Keine Berechtigung für dieses Gerät', 403);
    }

    await device.destroy();
    res.json({ success: true, message: 'Gerät gelöscht.' });
    logger.info(`Gerät gelöscht: ${req.params.id}`);
  } catch (error) {
    next(error);
  }
};
