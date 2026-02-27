import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validator';
import { authenticate } from '../middleware/auth';
import { requirePermission, requireSuperAdmin } from '../middleware/permissions';
import * as displayController from '../controllers/displayController';
import * as deviceController from '../controllers/deviceController';

const router = Router();

// All routes require authentication except public endpoints
router.use(authenticate);

// GET /api/displays - Get all displays
router.get(
  '/',
  requirePermission('displays.read'),
  [query('isActive').optional().isBoolean().withMessage('isActive muss boolean sein'), validate],
  displayController.getAllDisplays
);

// GET /api/displays/by-identifier/:identifier - Get display by identifier (for display-page setup)
router.get(
  '/by-identifier/:identifier',
  requirePermission('displays.read'),
  [
    param('identifier')
      .matches(/^[a-zA-Z0-9-_]+$/)
      .withMessage('Ungültiger Identifier-Format'),
    validate,
  ],
  displayController.getDisplayByIdentifier
);

// GET /api/displays/:id - Get single display
router.get(
  '/:id',
  requirePermission('displays.read'),
  [param('id').isInt().withMessage('Ungültige Display-ID'), validate],
  displayController.getDisplayById
);

// GET /api/displays/:id/posts - Get posts for specific display
router.get(
  '/:id/posts',
  requirePermission('displays.read'),
  [
    param('id').isInt().withMessage('Ungültige Display-ID'),
    query('isActive').optional().isBoolean().withMessage('isActive muss boolean sein'),
    validate,
  ],
  displayController.getDisplayPosts
);

// POST /api/displays - Create new display (Superadmin only, license limited)
router.post(
  '/',
  requireSuperAdmin,
  [
    body('name').notEmpty().trim().withMessage('Display-Name erforderlich'),
    body('identifier')
      .notEmpty()
      .trim()
      .matches(/^[a-zA-Z0-9-_]+$/)
      .withMessage('Identifier darf nur Buchstaben, Zahlen, Bindestriche und Unterstriche enthalten'),
    body('description').optional().trim(),
    body('isActive').optional().isBoolean().withMessage('isActive muss boolean sein'),
    validate,
  ],
  displayController.createDisplay
);

// PUT /api/displays/:id - Update display (Admin/Superadmin only)
router.put(
  '/:id',
  requirePermission('displays.update'),
  [
    param('id').isInt().withMessage('Ungültige Display-ID'),
    body('name').optional().notEmpty().trim().withMessage('Display-Name darf nicht leer sein'),
    body('identifier')
      .optional()
      .notEmpty()
      .trim()
      .matches(/^[a-zA-Z0-9-_]+$/)
      .withMessage('Identifier darf nur Buchstaben, Zahlen, Bindestriche und Unterstriche enthalten'),
    body('description').optional().trim(),
    body('isActive').optional().isBoolean().withMessage('isActive muss boolean sein'),
    validate,
  ],
  displayController.updateDisplay
);

// DELETE /api/displays/:id - Delete display (Superadmin only)
router.delete(
  '/:id',
  requirePermission('displays.delete'),
  [param('id').isInt().withMessage('Ungültige Display-ID'), validate],
  displayController.deleteDisplay
);

// POST /api/displays/:id/authorize - Authorize a pending device (Superadmin only)
router.post(
  '/:id/authorize',
  requireSuperAdmin,
  [param('id').isInt().withMessage('Ungültige Display-ID'), validate],
  deviceController.authorizeDevice
);

// POST /api/displays/:id/reject - Reject a pending device (Superadmin only)
router.post(
  '/:id/reject',
  requireSuperAdmin,
  [param('id').isInt().withMessage('Ungültige Display-ID'), validate],
  deviceController.rejectDevice
);

// POST /api/displays/:id/revoke - Revoke device authorization (Superadmin only)
router.post(
  '/:id/revoke',
  requireSuperAdmin,
  [param('id').isInt().withMessage('Ungültige Display-ID'), validate],
  deviceController.revokeDevice
);

export default router;
