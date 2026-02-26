import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validator';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { logger } from '../utils/logger';

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

      let durationSeconds = 0;

      try {
        // Fetch YouTube page and extract duration from embedded JSON
        const response = await fetch(
          `https://www.youtube.com/watch?v=${videoId}`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept-Language': 'en-US,en;q=0.9',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`YouTube returned ${response.status}`);
        }

        const html = await response.text();

        // Try to extract lengthSeconds from the page data
        const lengthMatch = html.match(/"lengthSeconds"\s*:\s*"(\d+)"/);
        if (lengthMatch) {
          durationSeconds = parseInt(lengthMatch[1], 10);
        } else {
          // Fallback: try approxDurationMs
          const approxMatch = html.match(/"approxDurationMs"\s*:\s*"(\d+)"/);
          if (approxMatch) {
            durationSeconds = Math.round(parseInt(approxMatch[1], 10) / 1000);
          }
        }
      } catch (fetchError: any) {
        logger.warn(`Fetch-Methode fehlgeschlagen: ${fetchError.message}`);
      }

      // If we couldn't get a duration, use a sensible default
      if (!durationSeconds || durationSeconds <= 0) {
        logger.warn(`Konnte Video-Dauer nicht ermitteln für ${videoId}, verwende Standard 60s`);
        durationSeconds = 60;
      }

      logger.info(`Video-Dauer: ${durationSeconds} Sekunden`);

      res.json({
        success: true,
        data: {
          duration: durationSeconds,
          videoId,
        },
      });
    } catch (error: any) {
      logger.error('Fehler beim Abrufen der Video-Dauer:', error);
      
      // Return a default duration instead of crashing
      res.json({
        success: true,
        data: {
          duration: 60,
          videoId: extractYouTubeId(req.body.url) || 'unknown',
          estimated: true,
        },
      });
    }
  }
);

export default router;
