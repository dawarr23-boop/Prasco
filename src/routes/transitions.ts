import express from 'express';
import {
  getAvailableTransitions,
  getPostTransition,
  setPostTransition,
  deletePostTransition,
  getPostsWithTransitions,
} from '../controllers/transitionsController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Öffentliche Endpunkte (für Display)
router.get('/transitions', getAvailableTransitions);
router.get('/posts/with-transitions', getPostsWithTransitions);

// Geschützte Endpunkte (für Admin)
router.get('/posts/:postId/transition', authenticate, getPostTransition);
router.post('/posts/:postId/transition', authenticate, setPostTransition);
router.delete('/posts/:postId/transition', authenticate, deletePostTransition);

export default router;
