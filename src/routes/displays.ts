import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validator';
import { authenticate } from '../middleware/auth';
import { requirePermission, requireSuperAdmin } from '../middleware/permissions';
import * as displayController from '../controllers/displayController';
import * as deviceController from '../controllers/deviceController';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/temp/' });

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

// GET /api/displays/license - Get license info
router.get(
  '/license',
  requirePermission('displays.read'),
  displayController.getLicenseInfo
);

// PUT /api/displays/license - Update license limit (Superadmin only)
router.put(
  '/license',
  requireSuperAdmin,
  [
    body('maxDisplays').isInt({ min: 1, max: 100 }).withMessage('maxDisplays muss zwischen 1 und 100 liegen'),
    validate,
  ],
  displayController.updateLicenseLimit
);

// GET /api/displays/fleet - Get fleet overview with online/offline status
router.get(
  '/fleet',
  requirePermission('displays.read'),
  displayController.getFleetOverview
);

// GET /api/displays/apk/latest - Download latest APK
router.get(
  '/apk/latest',
  requirePermission('displays.read'),
  displayController.getLatestApk
);

// POST /api/displays/apk/upload - Upload APK (Superadmin only)
router.post(
  '/apk/upload',
  requireSuperAdmin,
  upload.single('apk'),
  displayController.uploadApk
);

// GET /api/displays/:id - Get single display (MUST be after /license, /fleet, /apk)
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

// GET /api/displays/:id/registration-info - Get registration info with QR code data
router.get(
  '/:id/registration-info',
  requireSuperAdmin,
  [param('id').isInt().withMessage('Ungültige Display-ID'), validate],
  displayController.getRegistrationInfo
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

// POST /api/displays/:id/open-registration - Open registration for next client (Superadmin only)
router.post(
  '/:id/open-registration',
  requireSuperAdmin,
  [param('id').isInt().withMessage('Ungültige Display-ID'), validate],
  deviceController.openRegistration
);

// POST /api/displays/:id/close-registration - Close registration (Superadmin only)
router.post(
  '/:id/close-registration',
  requireSuperAdmin,
  [param('id').isInt().withMessage('Ungültige Display-ID'), validate],
  deviceController.closeRegistration
);

export default router;
