import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import {
  getSettings,
  getSetting,
  setSetting,
  setBulkSettings,
  deleteSetting,
} from '../controllers/settingsController';

const router = Router();

/**
 * GET /api/settings
 * Hole alle Einstellungen (optional gefiltert nach Kategorie)
 * Query: ?category=display
 * Public: Lesezugriff für Display-Einstellungen
 */
router.get('/', getSettings);

/**
 * GET /api/settings/:key
 * Hole eine einzelne Einstellung
 * Public: Lesezugriff für Display-Einstellungen
 */
router.get('/:key', getSetting);

/**
 * POST /api/settings/bulk
 * Setze mehrere Einstellungen auf einmal
 * Body: { settings: { key1: value1, key2: value2, ... } }
 */
router.post('/bulk', authenticate, requirePermission('settings.write'), setBulkSettings);

/**
 * PUT /api/settings
 * Erstelle oder aktualisiere eine Einstellung
 * Body: { key, value, type?, category?, description? }
 */
router.put('/', authenticate, requirePermission('settings.write'), setSetting);

/**
 * DELETE /api/settings/:key
 * Lösche eine Einstellung
 */
router.delete('/:key', authenticate, requirePermission('settings.write'), deleteSetting);

export default router;
