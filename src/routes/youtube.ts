import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validator';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);
const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Extract YouTube video ID from URL
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Convert duration string (HH:MM:SS or MM:SS or SS) to seconds
 */
function parseDuration(duration: string): number {
  const parts = duration.split(':').map(Number);
  
  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    // SS
    return parts[0];
  }
  
  return 60; // Fallback
}

/**
 * @openapi
 * /api/youtube/duration:
 *   post:
 *     tags:
 *       - YouTube
 *     summary: YouTube Video-Dauer abrufen
 *     description: Holt die Dauer eines YouTube-Videos mittels yt-dlp. Erfordert 'posts.create' Permission.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 example: https://www.youtube.com/watch?v=dQw4w9WgXcQ
 *     responses:
 *       200:
 *         description: Video-Dauer erfolgreich abgerufen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     duration:
 *                       type: integer
 *                       description: Video-Dauer in Sekunden
 *                       example: 212
 *                     videoId:
 *                       type: string
 *                       example: dQw4w9WgXcQ
 *       400:
 *         description: Ungültige YouTube URL
 *       500:
 *         description: Fehler beim Abrufen der Video-Dauer
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/duration',
  requirePermission('posts.create'),
  [
    body('url')
      .notEmpty()
      .withMessage('URL erforderlich')
      .isURL()
      .withMessage('Ungültige URL'),
    validate,
  ],
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { url } = req.body;

      // Extract video ID
      const videoId = extractYouTubeId(url);
      if (!videoId) {
        res.status(400).json({
          success: false,
          message: 'Ungültige YouTube URL',
        });
        return;
      }

      logger.info(`Rufe Video-Dauer ab für: ${videoId}`);

      // Use yt-dlp to get duration (with full path)
      const { stdout, stderr } = await execAsync(
        `/usr/local/bin/yt-dlp --get-duration "https://www.youtube.com/watch?v=${videoId}"`,
        { timeout: 10000 } // 10 second timeout
      );

      if (stderr) {
        logger.warn(`yt-dlp stderr: ${stderr}`);
      }

      const durationString = stdout.trim();
      const durationSeconds = parseDuration(durationString);

      logger.info(`Video-Dauer: ${durationString} = ${durationSeconds} Sekunden`);

      res.json({
        success: true,
        data: {
          duration: durationSeconds,
          videoId,
        },
      });
    } catch (error: any) {
      logger.error('Fehler beim Abrufen der Video-Dauer:', error);
      
      res.status(500).json({
        success: false,
        message: 'Fehler beim Abrufen der Video-Dauer',
        error: error.message,
      });
    }
  }
);

export default router;
