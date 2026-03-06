import { Router } from 'express';
import { body, query } from 'express-validator';
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
    body('displayIdentifier').optional().trim().matches(/^[a-zA-Z0-9-_]+$/).withMessage('Ungültiger Display-Identifier'),
    validate,
  ],
  deviceController.registerDevice
);

// GET /api/devices/register - Register via query params (Android WebView compatibility)
// shouldInterceptRequest in der Android App kann POST-Bodys nicht weiterleiten,
// daher bieten wir auch einen GET-Endpunkt mit Query-Parametern an.
router.get(
  '/register',
  [
    query('serialNumber').notEmpty().trim().withMessage('Seriennummer ist erforderlich'),
    query('macAddress').optional().trim(),
    query('deviceModel').optional().trim(),
    query('deviceOsVersion').optional().trim(),
    query('appVersion').optional().trim(),
    query('displayIdentifier').optional().trim().matches(/^[a-zA-Z0-9-_]+$/).withMessage('Ungültiger Display-Identifier'),
    validate,
  ],
  deviceController.registerDeviceGet
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
