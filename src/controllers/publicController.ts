import { Request, Response, NextFunction } from 'express';
import { Post, Category, Media } from '../models';
import { Op } from 'sequelize';
import { logger } from '../utils/logger';
import { cacheService } from '../utils/cache';

/**
 * Get all active posts for public display
 * GET /api/public/posts?organization=prasco
 */
export const getActivePosts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organization, category } = req.query;

    // Cache-Key basierend auf Query-Parametern
    const cacheKey = `public:posts:${organization || 'all'}:${category || 'all'}`;
    
    // Versuche aus Cache zu laden (60 Sekunden TTL für Public Display)
    const cached = cacheService.get<any>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const now = new Date();

    // Build where clause with proper date filtering
    const where: any = {
      isActive: true,
      [Op.and]: [
        // startDate: null OR startDate <= now
        {
          [Op.or]: [{ startDate: null }, { startDate: { [Op.lte]: now } }],
        },
        // endDate: null OR endDate >= now
        {
          [Op.or]: [{ endDate: null }, { endDate: { [Op.gte]: now } }],
        },
      ],
    };

    // Filter by organization slug if provided
    if (organization) {
      const Organization = require('../models').Organization;
      const org = await Organization.findOne({
        where: { slug: organization as string },
      });

      if (org) {
        where.organizationId = org.id;
      }
    }

    // Filter by category if provided
    if (category) {
      where.categoryId = category;
    }

    const posts = await Post.findAll({
      where,
      order: [
        ['priority', 'DESC'], // Higher priority first
        ['createdAt', 'DESC'], // Newer posts first
      ],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'color', 'icon'],
        },
        {
          model: Media,
          as: 'media',
          attributes: ['id', 'url', 'thumbnailUrl', 'mimeType'],
        },
      ],
      attributes: [
        'id',
        'title',
        'content',
        'contentType',
        'duration',
        'priority',
        'startDate',
        'endDate',
        'viewCount',
        'showTitle',
        'backgroundMusicUrl',
        'backgroundMusicVolume',
        'blendEffect',
        'soundEnabled',
        'createdAt',
      ],
    });

    const response = {
      success: true,
      data: posts,
      count: posts.length,
    };

    // Speichere im Cache (60 Sekunden TTL)
    cacheService.set(cacheKey, response, 60);

    res.json(response);

    logger.info(`Aktive Posts für Display abgerufen: ${posts.length}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single active post by ID (for public display)
 * GET /api/public/posts/:id
 */
export const getPostById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const post = await Post.findOne({
      where: {
        id,
        isActive: true,
      },
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
      ],
      attributes: [
        'id',
        'title',
        'content',
        'contentType',
        'duration',
        'priority',
        'startDate',
        'endDate',
        'viewCount',
        'backgroundMusicUrl',
        'backgroundMusicVolume',
        'soundEnabled',
        'createdAt',
      ],
    });

    if (!post) {
      res.status(404).json({
        success: false,
        message: 'Post nicht gefunden oder nicht aktiv',
      });
      return;
    }

    // Increment view count
    await post.increment('viewCount');

    res.json({
      success: true,
      data: post,
    });

    logger.info(`Public Post ${id} abgerufen (Views: ${post.viewCount + 1})`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get active categories for public display
 * GET /api/public/categories?organization=prasco
 */
export const getActiveCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organization } = req.query;

    // Cache key includes organization filter
    const cacheKey = `public:categories:org_${organization || 'all'}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const where: any = {
      isActive: true,
    };

    // Filter by organization slug if provided
    if (organization) {
      const Organization = require('../models').Organization;
      const org = await Organization.findOne({
        where: { slug: organization as string },
      });

      if (org) {
        where.organizationId = org.id;
      }
    }

    const categories = await Category.findAll({
      where,
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'color', 'icon'],
    });

    const response = {
      success: true,
      data: categories,
      count: categories.length,
    };

    // Cache for 5 minutes (same as admin categories)
    cacheService.set(cacheKey, response, 300);

    res.json(response);

    logger.info(`Aktive Kategorien für Display abgerufen: ${categories.length}`);
  } catch (error) {
    next(error);
  }
};
