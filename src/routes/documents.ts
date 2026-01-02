import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { parseDocument, getSupportedFormats } from '../controllers/documentController';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configure multer for document upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/temp');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/pdf',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Nur Word (.docx) und PDF-Dokumente sind erlaubt'));
    }
  },
});

/**
 * POST /api/documents/parse
 * Upload and parse document (Word/PDF)
 * Returns parsed content ready for post creation
 */
router.post(
  '/parse',
  authenticate,
  requirePermission('posts.create'),
  upload.single('document'),
  parseDocument
);

/**
 * GET /api/documents/formats
 * Get list of supported document formats
 */
router.get('/formats', authenticate, getSupportedFormats);

export default router;
