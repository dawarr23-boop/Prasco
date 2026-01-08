import { Router } from 'express';
import * as motionPathsController from '../controllers/motionPathsController';

const router = Router();

/**
 * Motion Paths Routes
 * 
 * GET    /api/motion-paths/templates              - Vordefinierte Path-Templates
 * GET    /api/motion-paths/animation/:animationId - Motion Path für Animation laden
 * GET    /api/motion-paths/:id                    - Motion Path nach ID laden
 * POST   /api/motion-paths                        - Neuen Motion Path erstellen
 * POST   /api/motion-paths/upsert                 - Motion Path erstellen oder aktualisieren
 * PUT    /api/motion-paths/:id                    - Motion Path aktualisieren
 * DELETE /api/motion-paths/:id                    - Motion Path löschen
 */

// Templates (muss vor :id Route stehen)
router.get('/templates', motionPathsController.getPathTemplates);

// Animation-specific (muss vor :id Route stehen)
router.get('/animation/:animationId', motionPathsController.getMotionPathByAnimationId);

// Upsert (muss vor :id Route stehen)
router.post('/upsert', motionPathsController.upsertMotionPath);

// CRUD Operations
router.get('/:id', motionPathsController.getMotionPathById);
router.post('/', motionPathsController.createMotionPath);
router.put('/:id', motionPathsController.updateMotionPath);
router.delete('/:id', motionPathsController.deleteMotionPath);

export default router;
