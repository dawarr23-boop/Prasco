import { Router, Request, Response } from 'express';
import { param, query } from 'express-validator';
import { validate } from '../middleware/validator';
import * as publicController from '../controllers/publicController';
import * as displayController from '../controllers/displayController';
import fs from 'fs';
import path from 'path';

const router = Router();

// Public routes - no authentication required

// GET /api/public/info - Get application info (version, developer, etc.)
router.get('/info', (_req: Request, res: Response) => {
  try {
    const packagePath = path.resolve(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    res.json({
      success: true,
      data: {
        name: 'PRASCO Digital Signage',
        version: packageJson.version || '1.0.0',
        developer: 'Christian Pöser',
        license: 'MIT License',
        description: packageJson.description || 'Digitales Schwarzes Brett für Unternehmen',
        buildYear: new Date().getFullYear(),
        technologies: ['Node.js', 'Express', 'TypeScript', 'PostgreSQL', 'Sequelize'],
      },
    });
  } catch {
    res.json({
      success: true,
      data: {
        name: 'PRASCO Digital Signage',
        version: '2.0.0',
        developer: 'Christian Pöser',
        license: 'MIT License',
        description: 'Digitales Schwarzes Brett für Unternehmen',
        buildYear: new Date().getFullYear(),
        technologies: ['Node.js', 'Express', 'TypeScript', 'PostgreSQL', 'Sequelize'],
      },
    });
  }
});

// GET /api/public/posts - Get all active posts for display
router.get(
  '/posts',
  [
    query('organization').optional().isString().trim(),
    query('category').optional().isInt().withMessage('Kategorie-ID muss eine Zahl sein'),
    validate,
  ],
  publicController.getActivePosts
);

// GET /api/public/posts/:id - Get single active post
router.get(
  '/posts/:id',
  [param('id').isInt().withMessage('Ungültige Post-ID'), validate],
  publicController.getPostById
);

// GET /api/public/categories - Get all active categories
router.get(
  '/categories',
  [query('organization').optional().isString().trim(), validate],
  publicController.getActiveCategories
);

// GET /api/public/displays - Get all active displays (for Android TV app)
router.get('/displays', displayController.getPublicDisplays);

// GET /api/public/display/:identifier - Get display info by identifier (for display page, no auth needed)
router.get(
  '/display/:identifier',
  [
    param('identifier')
      .matches(/^[a-zA-Z0-9-_]+$/)
      .withMessage('Ungültiger Display-Identifier'),
    validate,
  ],
  displayController.getDisplayByIdentifier
);

// GET /api/public/display/:identifier/posts - Get posts for specific display (for display page)
router.get(
  '/display/:identifier/posts',
  [
    param('identifier')
      .matches(/^[a-zA-Z0-9-_]+$/)
      .withMessage('Ungültiger Display-Identifier'),
    validate,
  ],
  displayController.getPublicDisplayPosts
);

export default router;
