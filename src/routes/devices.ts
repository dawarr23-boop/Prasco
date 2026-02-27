import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validator';
import { deviceAuth } from '../middleware/deviceAuth';
import * as deviceController from '../controllers/deviceController';

const router = Router();

// POST /api/devices/register - Register a new device (no auth required)
router.post(
  '/register',
  [
    body('serialNumber').notEmpty().trim().withMessage('Seriennummer ist erforderlich'),
    body('macAddress').optional().trim().matches(/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/).withMessage('Ungültiges MAC-Adress-Format'),
    body('deviceModel').optional().trim(),
    body('deviceOsVersion').optional().trim(),
    body('appVersion').optional().trim(),
    validate,
  ],
  deviceController.registerDevice
);

// GET /api/devices/status - Get device authorization status (requires device token)
router.get(
  '/status',
  deviceAuth,
  deviceController.getDeviceStatus
);

// POST /api/devices/heartbeat - Device heartbeat (requires device token)
router.post(
  '/heartbeat',
  deviceAuth,
  [
    body('appVersion').optional().trim(),
    validate,
  ],
  deviceController.deviceHeartbeat
);

export default router;
