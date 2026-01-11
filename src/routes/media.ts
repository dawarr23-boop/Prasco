import { Router } from 'express';
import { param } from 'express-validator';
import { validate } from '../middleware/validator';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { upload } from '../config/upload';
import * as mediaController from '../controllers/mediaController';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /api/media/upload:
 *   post:
 *     tags:
 *       - Media
 *     summary: Mediendatei hochladen
 *     description: |
 *       Lädt eine Bilddatei hoch und generiert automatisch ein Thumbnail (300x300px).
 *       Unterstützte Formate: JPEG, PNG, GIF, WebP, SVG.
 *       Max Größe: 10MB für Bilder, 100MB für Videos.
 *       Rate Limit: 10 Uploads pro Stunde.
 *       Erfordert 'media.upload' Permission (Editor).
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Bild- oder Videodatei zum Hochladen
 *     responses:
 *       201:
 *         description: Datei erfolgreich hochgeladen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Datei erfolgreich hochgeladen
 *                 data:
 *                   $ref: '#/components/schemas/Media'
 *       400:
 *         description: Ungültiger Dateityp oder zu groß
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       429:
 *         $ref: '#/components/responses/RateLimitExceeded'
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/upload',
  requirePermission('media.upload'),
  upload.single('file'),
  mediaController.uploadMedia
);

/**
 * @openapi
 * /api/media:
 *   get:
 *     tags:
 *       - Media
 *     summary: Alle Mediendateien abrufen
 *     description: Listet alle hochgeladenen Mediendateien der Organisation. Erfordert 'media.read' Permission.
 *     responses:
 *       200:
 *         description: Liste aller Mediendateien
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Media'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *     security:
 *       - bearerAuth: []
 */
router.get('/', requirePermission('media.read'), mediaController.getAllMedia);

/**
 * @openapi
 * /api/media/{id}:
 *   get:
 *     tags:
 *       - Media
 *     summary: Einzelne Mediendatei abrufen
 *     description: Holt eine spezifische Mediendatei mit Metadaten. Erfordert 'media.read' Permission.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Media-ID
 *     responses:
 *       200:
 *         description: Mediendatei erfolgreich abgerufen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Media'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id',
  requirePermission('media.read'),
  [param('id').isInt().withMessage('Ungültige Media-ID'), validate],
  mediaController.getMediaById
);

/**
 * @openapi
 * /api/media/{id}:
 *   delete:
 *     tags:
 *       - Media
 *     summary: Mediendatei löschen
 *     description: Löscht eine Mediendatei und deren Thumbnail permanent. Erfordert 'media.delete' Permission (nur Super-Admin).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Media-ID
 *     responses:
 *       200:
 *         description: Mediendatei erfolgreich gelöscht
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  requirePermission('media.delete'),
  [param('id').isInt().withMessage('Ungültige Media-ID'), validate],
  mediaController.deleteMedia
);

/**
 * @openapi
 * /api/media/presentations/{presentationId}/slides:
 *   get:
 *     tags:
 *       - Media
 *     summary: PowerPoint Slides abrufen
 *     description: Gibt alle konvertierten Slides einer PowerPoint-Präsentation zurück.
 *     parameters:
 *       - in: path
 *         name: presentationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Präsentations-ID
 *     responses:
 *       200:
 *         description: Liste der Slides
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/presentations/:presentationId/slides',
  requirePermission('media.read'),
  mediaController.getPresentationSlides
);

/**
 * @openapi
 * /api/media/download-external:
 *   post:
 *     tags:
 *       - Media
 *     summary: Download external videos
 *     description: |
 *       Scans all video posts for external URLs (YouTube, Vimeo, etc.) 
 *       and downloads them to local storage for offline playback.
 *       Requires 'media.upload' Permission (Editor).
 *     responses:
 *       200:
 *         description: Download process completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Downloads completed
 *                 stats:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     downloaded:
 *                       type: integer
 *                     updated:
 *                       type: integer
 *                     skipped:
 *                       type: integer
 *                     failed:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/download-external',
  requirePermission('media.upload'),
  mediaController.downloadExternalVideos
);

export default router;
