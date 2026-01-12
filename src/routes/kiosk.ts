import express from 'express';
import * as kioskController from '../controllers/kioskController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

const router = express.Router();

/**
 * POST /api/kiosk/presentation - Start presentation mode
 */
router.post(
  '/presentation',
  authenticate,
  requirePermission('settings.manage'),
  kioskController.startPresentationMode
);

/**
 * POST /api/kiosk/display - Start normal display mode
 */
router.post(
  '/display',
  authenticate,
  requirePermission('settings.manage'),
  kioskController.startDisplayMode
);

/**
 * POST /api/kiosk/stop - Stop kiosk mode
 */
router.post(
  '/stop',
  authenticate,
  requirePermission('settings.manage'),
  kioskController.stopKioskMode
);

export default router;
