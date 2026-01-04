import { Request, Response, NextFunction } from 'express';
import { Post, Category, User, Media } from '../models';
import { AppError } from '../middleware/errorHandler';
import { Op } from 'sequelize';
import { logger } from '../utils/logger';

/**
 * Get all posts with pagination, filtering, and sorting
 * GET /api/posts?page=1&limit=10&category=1&isActive=true&sort=priority
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

    const { count, rows: posts } = await Post.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order: [[sort as string, order as string]],
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
      backgroundMusicUrl,
      backgroundMusicVolume,
    } = req.body;

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
      backgroundMusicUrl: musicUrl || null,
      backgroundMusicVolume: musicVolume,
    });

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
      backgroundMusicUrl,
      backgroundMusicVolume,
    } = req.body;

    const post = await Post.findByPk(id);

    if (!post) {
      throw new AppError('Post nicht gefunden', 404);
    }

    // Check organization access
    if (req.user?.organizationId && post.organizationId !== req.user.organizationId) {
      throw new AppError('Keine Berechtigung für diesen Post', 403);
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

    const post = await Post.findByPk(id);

    if (!post) {
      throw new AppError('Post nicht gefunden', 404);
    }

    // Check organization access
    if (req.user?.organizationId && post.organizationId !== req.user.organizationId) {
      throw new AppError('Keine Berechtigung für diesen Post', 403);
    }

    await post.destroy();

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
