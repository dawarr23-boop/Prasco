import express from 'express';
import {
  getAvailableEffects,
  getPostAnimations,
  createAnimation,
  updateAnimation,
  deleteAnimation,
  bulkCreateAnimations,
  deletePostAnimations,
  reorderAnimations,
} from '../controllers/animationsController';

const router = express.Router();

// GET /api/animations/effects - Verfügbare Effekte
router.get('/effects', getAvailableEffects);

// GET /api/animations/post/:postId - Alle Animationen eines Posts
router.get('/post/:postId', getPostAnimations);

// POST /api/animations - Neue Animation erstellen
router.post('/', createAnimation);

// POST /api/animations/bulk - Mehrere Animationen erstellen
router.post('/bulk', bulkCreateAnimations);

// PUT /api/animations/:id - Animation aktualisieren
router.put('/:id', updateAnimation);

// PUT /api/animations/reorder - Reihenfolge ändern
router.put('/reorder', reorderAnimations);

// DELETE /api/animations/:id - Animation löschen
router.delete('/:id', deleteAnimation);

// DELETE /api/animations/post/:postId - Alle Animationen eines Posts löschen
router.delete('/post/:postId', deletePostAnimations);

export default router;
