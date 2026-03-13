import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { Post, Category, Media, Display } from '../models';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';

const router = Router();

router.use(authenticate);

// ── POST /api/backup/export ──────────────────────────────────────────────────
// Creates a JSON snapshot of all posts (incl. category + media metadata).
// Requires posts.read permission. Returns JSON as downloadable file.
router.get(
  '/export',
  requirePermission('posts.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const where: any = {};
      if (req.user?.organizationId) {
        where.organizationId = req.user.organizationId;
      }

      const posts = await Post.findAll({
        where,
        order: [['priority', 'DESC'], ['createdAt', 'DESC']],
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'color', 'icon'],
          },
          {
            model: Media,
            as: 'media',
            attributes: ['id', 'url', 'thumbnailUrl', 'mimeType', 'originalName'],
          },
          {
            model: Display,
            as: 'displays',
            attributes: ['id', 'name', 'identifier'],
            through: { attributes: [] },
          },
        ],
      });

      const backup = {
        version: '1.0',
        appVersion: '2.1.0',
        createdAt: new Date().toISOString(),
        createdBy: req.user?.email ?? 'unknown',
        organizationId: req.user?.organizationId ?? null,
        postCount: posts.length,
        posts: posts.map((p) => p.toJSON()),
      };

      const filename = `prasco-posts-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json(backup);

      logger.info(`Backup erstellt: ${posts.length} Posts exportiert von ${req.user?.email}`);
    } catch (error) {
      next(error);
    }
  }
);

// ── POST /api/backup/restore ─────────────────────────────────────────────────
// Restores posts from a JSON backup.
// mode=merge  → adds posts whose title+contentType doesn't already exist (default)
// mode=append → always creates new posts regardless of duplicates
// Requires posts.create permission.
router.post(
  '/restore',
  requirePermission('posts.create'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { backup, mode = 'merge' } = req.body as {
        backup: {
          version?: string;
          posts: any[];
        };
        mode?: 'merge' | 'append';
      };

      if (!backup || !Array.isArray(backup.posts)) {
        throw new AppError('Ungültiges Backup-Format: "backup.posts" fehlt oder ist kein Array', 400);
      }

      if (backup.version && backup.version !== '1.0') {
        throw new AppError(`Nicht unterstützte Backup-Version: ${backup.version}`, 400);
      }

      const postsToRestore = backup.posts;
      const orgId = req.user?.organizationId ?? null;

      let created = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const p of postsToRestore) {
        try {
          // Merge mode: skip if a post with the same title+contentType already exists
          if (mode === 'merge') {
            const existing = await Post.findOne({
              where: {
                title: p.title,
                contentType: p.contentType,
                ...(orgId ? { organizationId: orgId } : {}),
              },
            });
            if (existing) {
              skipped++;
              continue;
            }
          }

          // Try to resolve mediaId: keep if the media still exists, otherwise null
          let resolvedMediaId: number | null = null;
          if (p.mediaId) {
            const mediaExists = await Media.findByPk(p.mediaId);
            if (mediaExists) resolvedMediaId = p.mediaId;
          }

          // Try to resolve categoryId: keep if category still exists
          let resolvedCategoryId: number | null = null;
          if (p.categoryId) {
            const catExists = await Category.findByPk(p.categoryId);
            if (catExists) resolvedCategoryId = p.categoryId;
          }

          const newPost = await Post.create({
            title: p.title,
            content: p.content ?? '',
            contentType: p.contentType ?? 'text',
            duration: p.duration ?? 10,
            priority: p.priority ?? 0,
            isActive: p.isActive ?? true,
            showTitle: p.showTitle ?? true,
            displayMode: p.displayMode ?? 'all',
            bgTheme: p.bgTheme ?? 'light',
            blendEffect: p.blendEffect ?? 'fade',
            soundEnabled: p.soundEnabled ?? true,
            titleFontSize: p.titleFontSize ?? null,
            titleFontFamily: p.titleFontFamily ?? null,
            backgroundMusicUrl: p.backgroundMusicUrl ?? null,
            backgroundMusicVolume: p.backgroundMusicVolume ?? 50,
            startDate: p.startDate ?? null,
            endDate: p.endDate ?? null,
            mediaId: resolvedMediaId ?? undefined,
            categoryId: resolvedCategoryId ?? undefined,
            organizationId: orgId ?? undefined,
            createdBy: req.user!.id,
          });

          // Restore display assignments if mode=specific and display IDs still exist
          if (p.displayMode === 'specific' && Array.isArray(p.displays) && p.displays.length > 0) {
            const displayIds = p.displays.map((d: any) => d.id).filter(Boolean);
            if (displayIds.length > 0) {
              const validDisplays = await Display.findAll({
                where: { id: { [Op.in]: displayIds } },
              });
              if (validDisplays.length > 0) {
                await (newPost as any).setDisplays(validDisplays);
              }
            }
          }

          created++;
        } catch (postError: any) {
          errors.push(`Post "${p.title}": ${postError.message}`);
        }
      }

      res.json({
        success: true,
        message: `Wiederherstellung abgeschlossen`,
        data: {
          total: postsToRestore.length,
          created,
          skipped,
          errors,
        },
      });

      logger.info(
        `Backup wiederhergestellt: ${created} erstellt, ${skipped} übersprungen von ${req.user?.email}`
      );
    } catch (error) {
      next(error);
    }
  }
);

export default router;
