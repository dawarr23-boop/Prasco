import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { Post, Category, User, Media, Display } from '../models';
import { AppError } from '../middleware/errorHandler';
import { Op } from 'sequelize';
import { logger } from '../utils/logger';
import * as presentationService from '../services/presentationService';
import { cacheService } from '../utils/cache';
import { videoDownloadService } from '../services/videoDownloadService';
import { deleteMediaFiles } from '../services/mediaService';

/**
 * Get all posts with pagination, filtering, and sorting
 * GET /api/posts?page=1&limit=100&category=1&isActive=true&sort=priority
 */
export const getAllPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '100',
      category,
      isActive,
      sort = 'createdAt',
      order = 'DESC',
      search,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build filter conditions
    const where: any = {};

    if (category) {
      where.categoryId = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // User's organization filter (from auth middleware)
    if (req.user?.organizationId) {
      where.organizationId = req.user.organizationId;
    }

    // Build order clause - same as display sorting
    const orderClause: any[] = [];
    if (sort === 'priority') {
      // When sorting by priority, add createdAt as secondary sort
      orderClause.push(['priority', order as string]);
      orderClause.push(['createdAt', 'DESC']);
    } else if (sort === 'createdAt') {
      // When sorting by date, add priority as secondary sort
      orderClause.push(['createdAt', order as string]);
      orderClause.push(['priority', 'DESC']);
    } else {
      orderClause.push([sort as string, order as string]);
    }

    const { count, rows: posts } = await Post.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order: orderClause,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'color', 'icon'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: Media,
          as: 'media',
          attributes: ['id', 'url', 'thumbnailUrl', 'mimeType'],
        },
        {
          model: Display,
          as: 'displays',
          attributes: ['id', 'name', 'identifier', 'isActive'],
          through: { attributes: [] }, // Exclude junction table attributes
        },
      ],
    });

    const totalPages = Math.ceil(count / limitNum);

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages,
      },
    });

    logger.info(`Posts abgerufen: ${posts.length} von ${count}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single post by ID
 * GET /api/posts/:id
 */
export const getPostById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const post = await Post.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'color', 'icon'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: Media,
          as: 'media',
          attributes: ['id', 'url', 'thumbnailUrl', 'mimeType', 'originalName'],
        },
        {
          model: Display,
          as: 'displays',
          attributes: ['id', 'name', 'identifier', 'isActive'],
          through: { attributes: [] },
        },
      ],
    });

    if (!post) {
      throw new AppError('Post nicht gefunden', 404);
    }

    // Check organization access
    if (req.user?.organizationId && post.organizationId !== req.user.organizationId) {
      throw new AppError('Keine Berechtigung für diesen Post', 403);
    }

    res.json({
      success: true,
      data: post,
    });

    logger.info(`Post ${id} abgerufen`);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new post
 * POST /api/posts
 */
export const createPost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      title,
      content,
      contentType,
      categoryId,
      mediaId,
      startDate,
      endDate,
      duration,
      priority,
      isActive,
      showTitle,
      displayMode,
      displayIds,
      backgroundMusicUrl,
      backgroundMusicVolume,
      blendEffect,
      soundEnabled,
    } = req.body;

    // Validate priority range (0-100)
    if (priority !== undefined && (priority < 0 || priority > 100)) {
      throw new AppError('Priorität muss zwischen 0 und 100 liegen', 400);
    }

    // Validate category exists and belongs to user's organization
    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        throw new AppError('Kategorie nicht gefunden', 404);
      }
      if (req.user?.organizationId && category.organizationId !== req.user.organizationId) {
        throw new AppError('Kategorie gehört nicht zu Ihrer Organisation', 403);
      }
    }

    // Validate media if provided
    if (mediaId) {
      const media = await Media.findByPk(mediaId);
      if (!media) {
        throw new AppError('Media nicht gefunden', 404);
      }
      if (req.user?.organizationId && media.organizationId !== req.user.organizationId) {
        throw new AppError('Media gehört nicht zu Ihrer Organisation', 403);
      }
    }

    // Background music only for non-video content
    const musicUrl = contentType !== 'video' ? backgroundMusicUrl : null;
    const musicVolume =
      backgroundMusicVolume !== undefined ? Math.min(100, Math.max(0, backgroundMusicVolume)) : 50;

    // Automatisches Enddatum: 7 Tage nach Startdatum (oder jetzt) wenn nicht angegeben
    let calculatedEndDate = endDate;
    if (!endDate) {
      const baseDate = startDate ? new Date(startDate) : new Date();
      const autoEndDate = new Date(baseDate);
      autoEndDate.setDate(autoEndDate.getDate() + 7); // +7 Tage
      calculatedEndDate = autoEndDate;
      logger.info(`Automatisches Enddatum gesetzt: ${autoEndDate.toISOString()}`);
    }

    const post = await Post.create({
      title,
      content,
      contentType,
      categoryId: categoryId || null,
      mediaId: mediaId || null,
      organizationId: req.user?.organizationId,
      createdBy: req.user!.id,
      startDate: startDate || null,
      endDate: calculatedEndDate || null,
      duration: duration || 10,
      priority: priority || 0,
      isActive: isActive !== undefined ? isActive : true,
      showTitle: showTitle !== undefined ? showTitle : true,
      displayMode: displayMode || 'all',
      backgroundMusicUrl: musicUrl || null,
      backgroundMusicVolume: musicVolume,
      blendEffect: blendEffect || null,
      soundEnabled: soundEnabled !== undefined ? soundEnabled : true,
    });

    // Handle display assignments
    const { PostDisplay } = require('../models');
    if (displayMode === 'specific' && displayIds && Array.isArray(displayIds) && displayIds.length > 0) {
      
      // Create display assignments
      const assignments = displayIds.map((displayId: number) => ({
        postId: post.id,
        displayId: displayId,
      }));
      
      await PostDisplay.bulkCreate(assignments);
      logger.info(`Post ${post.id}: ${displayIds.length} Display-Zuweisungen erstellt`);
    }

    // Wenn es eine Präsentation ist UND ein Media-Objekt verknüpft ist, extrahiere Slides
    let createdPosts: any[] = [];
    logger.info(`[createPost] contentType=${contentType}, content=${content}, mediaId=${mediaId}`);
    
    if (contentType === 'presentation' && content) {
      // Der content enthält die presentationId
      const presentationId = content;
      logger.info(`[createPost] Präsentation erkannt, presentationId=${presentationId}`);
      
      const slides = presentationService.getSlideImages(presentationId);
      logger.info(`[createPost] Gefundene Slides: ${slides.length}`);
      
      if (slides.length > 0) {
        logger.info(`Erstelle ${slides.length} Posts für Präsentations-Slides`);
        
        // Lösche den ursprünglichen Post (war nur ein Platzhalter)
        await post.destroy();
        
        // Erstelle für jeden Slide einen eigenen Post
        // Höchste Priorität für ersten Slide, absteigend
        const basePriority = priority || 100;
        
        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          const slidePost = await Post.create({
            title: `${title} - Slide ${slide.slideNumber}`,
            content: slide.imageUrl, // URL wird im content gespeichert
            contentType: 'image',
            categoryId: categoryId || undefined,
            mediaId: undefined,
            organizationId: req.user?.organizationId,
            createdBy: req.user!.id,
            startDate: startDate || null,
            endDate: calculatedEndDate || null,
            duration: duration || 30,
            priority: basePriority - i, // Absteigende Priorität
            isActive: isActive !== undefined ? isActive : true,
            showTitle: false, // Titel bei Slides standardmäßig nicht anzeigen
            displayMode: displayMode || 'all',
            backgroundMusicUrl: musicUrl || null,
            backgroundMusicVolume: musicVolume,
            blendEffect: blendEffect || null,
          });

          // Display-Zuweisungen vom Original-Post übernehmen
          if (displayMode === 'specific' && displayIds && Array.isArray(displayIds) && displayIds.length > 0) {
            const slideAssignments = displayIds.map((did: number) => ({
              postId: slidePost.id,
              displayId: did,
            }));
            await PostDisplay.bulkCreate(slideAssignments);
          }
            
          createdPosts.push(slidePost);
        }
        
        // Lade alle erstellten Posts mit Associations in einer Query
        const slideIds = createdPosts.map(p => p.id);
        const postsWithAssociations = await Post.findAll({
          where: { id: slideIds },
          include: [
            { model: Category, as: 'category', attributes: ['id', 'name', 'color', 'icon'] },
            { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'email'] },
          ],
        });
          
        res.status(201).json({
          success: true,
          data: postsWithAssociations,
          message: `Präsentation erfolgreich erstellt: ${slides.length} Slides`,
        });
          
        logger.info(`Präsentation aufgeteilt: ${slides.length} Slide-Posts erstellt`);
          
        // Cache invalidieren
        cacheService.delByPrefix('public:posts:');
          
        return;
      }
      }

    // Fetch with associations
    const createdPost = await Post.findByPk(post.id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'color', 'icon'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    // Cache invalidieren
    cacheService.delByPrefix('public:posts:');

    // Video-Download im Hintergrund starten (für Hotspot-Modus)
    if (contentType === 'video' && content) {
      const videoUrl = content;
      if (videoDownloadService.isYouTubeUrl(videoUrl)) {
        logger.info(`Starte YouTube-Video-Download im Hintergrund für Post ${post.id}`);
        videoDownloadService
          .downloadYouTubeVideo(videoUrl)
          .then(async (result) => {
            if (result.success && result.localPath) {
              // Aktualisiere Post mit lokaler Video-URL
              await post.update({ 
                backgroundMusicUrl: result.localPath // Speichere lokalen Pfad für Offline-Verwendung
              });
              logger.info(`Video erfolgreich heruntergeladen: ${result.localPath}`);
            }
          })
          .catch((error) => {
            logger.error('Video-Download fehlgeschlagen:', error);
          });
      }
    }

    res.status(201).json({
      success: true,
      data: createdPost,
      message: 'Post erfolgreich erstellt',
    });

    logger.info(`Post erstellt: ${post.id} - ${title}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Update post
 * PUT /api/posts/:id
 */
export const updatePost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      contentType,
      categoryId,
      mediaId,
      startDate,
      endDate,
      duration,
      priority,
      isActive,
      showTitle,
      displayMode,
      displayIds,
      backgroundMusicUrl,
      backgroundMusicVolume,
      blendEffect,
      soundEnabled,
    } = req.body;

    const post = await Post.findByPk(id);

    if (!post) {
      throw new AppError('Post nicht gefunden', 404);
    }

    // Check organization access
    if (req.user?.organizationId && post.organizationId !== req.user.organizationId) {
      throw new AppError('Keine Berechtigung für diesen Post', 403);
    }

    // Datei-Cleanup: altes Medium löschen wenn es durch ein neues ersetzt wird
    if (mediaId !== undefined && mediaId !== post.mediaId && post.mediaId) {
      const oldMedia = await Media.findByPk(post.mediaId);
      if (oldMedia) {
        try {
          await deleteMediaFiles(oldMedia.filename, !!oldMedia.thumbnailUrl);
          await oldMedia.destroy();
          logger.info(`Altes Medium beim Update gelöscht: ${oldMedia.filename}`);
        } catch (err) {
          logger.warn(`Altes Medium konnte nicht gelöscht werden: ${oldMedia.filename}`, err);
        }
      }
    }

    // Datei-Cleanup: alte Hintergrundmusik löschen wenn ersetzt oder entfernt
    if (
      backgroundMusicUrl !== undefined &&
      backgroundMusicUrl !== post.backgroundMusicUrl &&
      post.backgroundMusicUrl?.startsWith('/uploads/')
    ) {
      try {
        await deleteMediaFiles(
          path.basename(post.backgroundMusicUrl),
          false
        );
        logger.info(`Alte Hintergrundmusik beim Update gelöscht: ${post.backgroundMusicUrl}`);
      } catch (err) {
        logger.warn(`Alte Hintergrundmusik konnte nicht gelöscht werden: ${post.backgroundMusicUrl}`, err);
      }
    }

    // Validate category if changing
    if (categoryId !== undefined && categoryId !== post.categoryId) {
      if (categoryId !== null) {
        const category = await Category.findByPk(categoryId);
        if (!category) {
          throw new AppError('Kategorie nicht gefunden', 404);
        }
        if (req.user?.organizationId && category.organizationId !== req.user.organizationId) {
          throw new AppError('Kategorie gehört nicht zu Ihrer Organisation', 403);
        }
      }
    }

    // Validate priority range (0-100)
    if (priority !== undefined && (priority < 0 || priority > 100)) {
      throw new AppError('Priorität muss zwischen 0 und 100 liegen', 400);
    }

    // Update fields
    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (contentType !== undefined) post.contentType = contentType;
    if (categoryId !== undefined) post.categoryId = categoryId === null ? undefined : categoryId;
    if (mediaId !== undefined) post.mediaId = mediaId === null ? undefined : mediaId;
    if (startDate !== undefined) post.startDate = startDate;
    if (endDate !== undefined) post.endDate = endDate;
    if (duration !== undefined) post.duration = duration;
    if (priority !== undefined) post.priority = priority;
    if (isActive !== undefined) post.isActive = isActive;
    if (showTitle !== undefined) post.showTitle = showTitle;
    if (displayMode !== undefined) post.displayMode = displayMode;
    if (blendEffect !== undefined) post.blendEffect = blendEffect;
    if (soundEnabled !== undefined) post.soundEnabled = soundEnabled;

    // Background music fields (only for non-video content)
    const effectiveContentType = contentType !== undefined ? contentType : post.contentType;
    if (backgroundMusicUrl !== undefined) {
      post.backgroundMusicUrl = effectiveContentType !== 'video' ? backgroundMusicUrl : undefined;
    }
    if (backgroundMusicVolume !== undefined) {
      post.backgroundMusicVolume = Math.min(100, Math.max(0, backgroundMusicVolume));
    }
    // Clear music if switching to video
    if (contentType === 'video') {
      post.backgroundMusicUrl = undefined;
    }

    await post.save();

    // Handle display assignments
    if (displayMode === 'specific' && displayIds !== undefined) {
      const { PostDisplay } = require('../models');
      
      // Remove old assignments
      await PostDisplay.destroy({ where: { postId: id } });
      
      // Create new assignments
      if (Array.isArray(displayIds) && displayIds.length > 0) {
        const assignments = displayIds.map((displayId: number) => ({
          postId: id,
          displayId: displayId,
        }));
        
        await PostDisplay.bulkCreate(assignments);
        logger.info(`Post ${id}: ${displayIds.length} Display-Zuweisungen aktualisiert`);
      }
    } else if (displayMode === 'all') {
      // Clear all display assignments if switching to 'all'
      const { PostDisplay } = require('../models');
      await PostDisplay.destroy({ where: { postId: id } });
      logger.info(`Post ${id}: Display-Zuweisungen entfernt (Modus: all)`);
    }

    // Fetch with associations
    const updatedPost = await Post.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'color', 'icon'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    // Cache invalidieren
    cacheService.delByPrefix('public:posts:');

    res.json({
      success: true,
      data: updatedPost,
      message: 'Post erfolgreich aktualisiert',
    });

    logger.info(`Post aktualisiert: ${id}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete post
 * DELETE /api/posts/:id
 */
export const deletePost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const post = await Post.findByPk(id, {
      include: [{ model: Media, as: 'media' }],
    });

    if (!post) {
      throw new AppError('Post nicht gefunden', 404);
    }

    // Check organization access
    if (req.user?.organizationId && post.organizationId !== req.user.organizationId) {
      throw new AppError('Keine Berechtigung für diesen Post', 403);
    }

    // Datei-Cleanup: hochgeladene Medien löschen
    if (post.mediaId) {
      const media = await Media.findByPk(post.mediaId);
      if (media) {
        try {
          await deleteMediaFiles(media.filename, !!media.thumbnailUrl);
          await media.destroy();
          logger.info(`Media-Datei gelöscht: ${media.filename}`);
        } catch (err) {
          logger.warn(`Media-Datei konnte nicht gelöscht werden: ${media.filename}`, err);
        }
      }
    }

    // Datei-Cleanup: heruntergeladene YouTube-Videos löschen
    if (post.backgroundMusicUrl && post.backgroundMusicUrl.startsWith('/uploads/')) {
      try {
        await videoDownloadService.deleteVideo(post.backgroundMusicUrl);
        logger.info(`Offline-Video gelöscht: ${post.backgroundMusicUrl}`);
      } catch (err) {
        logger.warn(`Offline-Video konnte nicht gelöscht werden: ${post.backgroundMusicUrl}`, err);
      }
    }

    // Datei-Cleanup: Präsentations-Ordner löschen
    if (post.contentType === 'presentation' && post.content) {
      try {
        presentationService.deletePresentation(post.content);
        logger.info(`Präsentation gelöscht: ${post.content}`);
      } catch (err) {
        logger.warn(`Präsentation konnte nicht gelöscht werden: ${post.content}`, err);
      }
    }

    await post.destroy();

    // Cache invalidieren
    cacheService.delByPrefix('public:posts:');

    res.json({
      success: true,
      message: 'Post erfolgreich gelöscht',
    });

    logger.info(`Post gelöscht: ${id}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder posts - update priority based on new order
 * PUT /api/posts/reorder
 */
export const reorderPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      throw new AppError('orderedIds muss ein nicht-leeres Array sein', 400);
    }

    // Update priority for each post based on position in array
    // Higher index = lower priority (first item gets highest priority)
    const totalItems = orderedIds.length;
    const updates = orderedIds.map((id: number, index: number) => {
      const priority = totalItems - index; // First item gets highest priority
      return Post.update(
        { priority },
        {
          where: {
            id,
            ...(req.user?.organizationId && { organizationId: req.user.organizationId }),
          },
        }
      );
    });

    await Promise.all(updates);

    res.json({
      success: true,
      message: 'Reihenfolge erfolgreich aktualisiert',
    });

    logger.info(`Posts neu sortiert: ${orderedIds.length} Einträge`);
  } catch (error) {
    next(error);
  }
};

/**
 * Update priorities for multiple posts
 * PUT /api/posts/update-priorities
 */
export const updatePriorities = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      throw new AppError('updates muss ein nicht-leeres Array sein', 400);
    }

    // Validate format: each update must have id and priority
    for (const update of updates) {
      if (!update.id || update.priority === undefined) {
        throw new AppError('Jedes Update muss id und priority enthalten', 400);
      }
    }

    // Update each post with new priority
    const updatePromises = updates.map((update: { id: number; priority: number }) => 
      Post.update(
        { priority: update.priority },
        {
          where: {
            id: update.id,
            ...(req.user?.organizationId && { organizationId: req.user.organizationId }),
          },
        }
      )
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: `${updates.length} Prioritäten erfolgreich aktualisiert`,
    });

    logger.info(`Post-Prioritäten aktualisiert: ${updates.length} Einträge`);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete all posts
 * DELETE /api/posts
 */
export const deleteAllPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const where: any = {};
    
    // Organization filter
    if (req.user?.organizationId) {
      where.organizationId = req.user.organizationId;
    }

    // Alle Posts mit zugehörigen Medien laden für Datei-Cleanup
    const posts = await Post.findAll({ where });

    // Dateien bereinigen
    for (const post of posts) {
      if (post.mediaId) {
        const media = await Media.findByPk(post.mediaId);
        if (media) {
          try {
            await deleteMediaFiles(media.filename, !!media.thumbnailUrl);
            await media.destroy();
          } catch (err) {
            logger.warn(`Media-Datei konnte nicht gelöscht werden: ${media.filename}`, err);
          }
        }
      }
      if (post.backgroundMusicUrl && post.backgroundMusicUrl.startsWith('/uploads/')) {
        try {
          await videoDownloadService.deleteVideo(post.backgroundMusicUrl);
        } catch (err) {
          logger.warn(`Offline-Video konnte nicht gelöscht werden: ${post.backgroundMusicUrl}`, err);
        }
      }
      if (post.contentType === 'presentation' && post.content) {
        try {
          presentationService.deletePresentation(post.content);
        } catch (err) {
          logger.warn(`Präsentation konnte nicht gelöscht werden: ${post.content}`, err);
        }
      }
    }

    const deletedCount = await Post.destroy({ where });

    res.json({
      success: true,
      message: `${deletedCount} Beiträge gelöscht`,
      deletedCount,
    });

    logger.info(`SECURITY: ${deletedCount} Posts gelöscht von ${req.user?.email}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Download video for a specific post
 * POST /api/posts/:id/download-video
 */
export const downloadVideo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const postId = parseInt(req.params.id);

    const post = await Post.findByPk(postId);
    if (!post) {
      throw new AppError('Post nicht gefunden', 404);
    }

    // Prüfe ob es ein Video-Post ist
    if (post.contentType !== 'video') {
      throw new AppError('Nur Video-Posts können heruntergeladen werden', 400);
    }

    // Prüfe ob bereits ein lokales Media existiert
    if (post.mediaId) {
      throw new AppError('Video ist bereits offline verfügbar', 400);
    }

    // Prüfe ob externe Video-URL
    const videoUrl = post.content;
    if (!videoUrl || !(videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') || videoUrl.includes('vimeo.com'))) {
      throw new AppError('Keine externe Video-URL gefunden', 400);
    }

    logger.info(`[Video Download] Starting download for post ${postId} (${post.title})`);

    // Starte Download im Hintergrund
    videoDownloadService.downloadVideoForPost(postId).catch(err => {
      logger.error(`[Video Download] Error downloading video for post ${postId}:`, err);
    });

    res.json({
      success: true,
      message: 'Video-Download wurde gestartet',
    });
  } catch (error) {
    next(error);
  }
};
