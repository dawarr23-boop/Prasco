import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validator';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import * as deviceController from '../controllers/deviceController';

const router = Router();

// All admin device routes require authentication
router.use(authenticate);

// GET /api/devices - List all device registrations
router.get(
  '/',
  requirePermission('displays.read'),
  [
    query('status')
      .optional()
      .isIn(['pending', 'approved', 'rejected'])
      .withMessage('Status muss pending, approved oder rejected sein'),
    validate,
  ],
  deviceController.getAllDevices
);

// GET /api/devices/:id - Get single device
router.get(
  '/:id',
  requirePermission('displays.read'),
  [param('id').isInt().withMessage('Ungültige Geräte-ID'), validate],
  deviceController.getDeviceById
);

// PUT /api/devices/:id - Update device (name, displayId, notes)
router.put(
  '/:id',
  requirePermission('displays.update'),
  [
    param('id').isInt().withMessage('Ungültige Geräte-ID'),
    body('deviceName').optional().trim(),
    body('displayId').optional({ nullable: true }).isInt().withMessage('displayId muss eine Zahl sein'),
    body('notes').optional().trim(),
    validate,
  ],
  deviceController.updateDevice
);

// PUT /api/devices/:id/approve - Approve device
router.put(
  '/:id/approve',
  requirePermission('displays.update'),
  [
    param('id').isInt().withMessage('Ungültige Geräte-ID'),
    body('displayId').optional({ nullable: true }).isInt().withMessage('displayId muss eine Zahl sein'),
    body('notes').optional().trim(),
    validate,
  ],
  deviceController.approveDevice
);

// PUT /api/devices/:id/reject - Reject device
router.put(
  '/:id/reject',
  requirePermission('displays.update'),
  [
    param('id').isInt().withMessage('Ungültige Geräte-ID'),
    body('notes').optional().trim(),
    validate,
  ],
  deviceController.rejectDevice
);

// DELETE /api/devices/:id - Delete device registration
router.delete(
  '/:id',
  requirePermission('displays.delete'),
  [param('id').isInt().withMessage('Ungültige Geräte-ID'), validate],
  deviceController.deleteDevice
);

export default router;
