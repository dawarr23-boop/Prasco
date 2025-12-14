import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validator';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import * as categoryController from '../controllers/categoryController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/categories - Get all categories
router.get(
  '/',
  requirePermission('categories.read'),
  [query('isActive').optional().isBoolean().withMessage('isActive muss boolean sein'), validate],
  categoryController.getAllCategories
);

// PUT /api/categories/reorder - Reorder categories (must be before /:id routes!)
router.put(
  '/reorder',
  requirePermission('categories.update'),
  [
    body('orderedIds')
      .isArray({ min: 1 })
      .withMessage('orderedIds muss ein nicht-leeres Array sein'),
    body('orderedIds.*').isInt({ min: 1 }).withMessage('Alle IDs müssen positive Zahlen sein'),
    validate,
  ],
  categoryController.reorderCategories
);

// GET /api/categories/:id - Get single category
router.get(
  '/:id',
  requirePermission('categories.read'),
  [param('id').isInt().withMessage('Ungültige Kategorie-ID'), validate],
  categoryController.getCategoryById
);

// POST /api/categories - Create new category (Admin only)
router.post(
  '/',
  requirePermission('categories.create'),
  [
    body('name').notEmpty().trim().withMessage('Kategorie-Name erforderlich'),
    body('color')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('Ungültiges Farbformat (verwenden Sie #RRGGBB)'),
    body('icon').optional().trim(),
    validate,
  ],
  categoryController.createCategory
);

// PUT /api/categories/:id - Update category (Admin only)
router.put(
  '/:id',
  requirePermission('categories.update'),
  [
    param('id').isInt().withMessage('Ungültige Kategorie-ID'),
    body('name').optional().trim().notEmpty().withMessage('Kategorie-Name darf nicht leer sein'),
    body('color')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('Ungültiges Farbformat (verwenden Sie #RRGGBB)'),
    body('icon').optional().trim(),
    body('isActive').optional().isBoolean().withMessage('isActive muss boolean sein'),
    validate,
  ],
  categoryController.updateCategory
);

// DELETE /api/categories/:id - Delete category (Admin only)
router.delete(
  '/:id',
  requirePermission('categories.delete'),
  [param('id').isInt().withMessage('Ungültige Kategorie-ID'), validate],
  categoryController.deleteCategory
);

export default router;
