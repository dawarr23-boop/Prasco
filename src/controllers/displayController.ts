import { Request, Response, NextFunction } from 'express';
import { Display, Post, PostDisplay, Category, Media } from '../models';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { cacheService } from '../utils/cache';
import { Op } from 'sequelize';

/**
 * Get all displays
 * GET /api/displays
 */
export const getAllDisplays = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const where: any = {};

    // Filter by organization
    if (req.user?.organizationId) {
      where.organizationId = req.user.organizationId;
    }

    // Filter by active status
    const { isActive } = req.query;
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const displays = await Display.findAll({
      where,
      order: [
        ['name', 'ASC'],
      ],
      attributes: [
        'id',
        'name',
        'identifier',
        'description',
        'isActive',
        'organizationId',
        'serialNumber',
        'macAddress',
        'authorizationStatus',
        'deviceModel',
        'deviceOsVersion',
        'appVersion',
        'lastSeenAt',
        'registeredAt',
        'createdAt',
        'updatedAt',
      ],
    });

    res.json({
      success: true,
      data: displays,
    });

    logger.info(`Displays abgerufen: ${displays.length}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single display by ID
 * GET /api/displays/:id
 */
export const getDisplayById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const display = await Display.findByPk(id, {
      attributes: [
        'id',
        'name',
        'identifier',
        'description',
        'isActive',
        'organizationId',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!display) {
      throw new AppError('Display nicht gefunden', 404);
    }

    // Check organization access
    if (req.user?.organizationId && display.organizationId !== req.user.organizationId) {
      throw new AppError('Keine Berechtigung für dieses Display', 403);
    }

    res.json({
      success: true,
      data: display,
    });

    logger.info(`Display abgerufen: ${id}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get display by identifier (for public display page)
 * GET /api/displays/by-identifier/:identifier
 */
export const getDisplayByIdentifier = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { identifier } = req.params;

    const display = await Display.findOne({
      where: { identifier },
      attributes: [
        'id',
        'name',
        'identifier',
        'description',
        'isActive',
        'showTransitData',
        'showTrafficData',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!display) {
      throw new AppError('Display nicht gefunden', 404);
    }

    if (!display.isActive) {
      throw new AppError('Display ist nicht aktiv', 403);
    }

    res.json({
      success: true,
      data: display,
    });

    logger.info(`Display by identifier abgerufen: ${identifier}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new display
 * POST /api/displays
 */
export const createDisplay = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, identifier, description, isActive } = req.body;

    // License check: max 2 displays
    const MAX_LICENSED_DISPLAYS = 2;
    const displayCount = await Display.count();
    if (displayCount >= MAX_LICENSED_DISPLAYS) {
      throw new AppError(
        `Display-Lizenzlimit erreicht (${MAX_LICENSED_DISPLAYS}/${MAX_LICENSED_DISPLAYS}). Bitte kontaktieren Sie den Vertrieb unter info@prasco.de, um weitere Display-Lizenzen zu erwerben.`,
        403
      );
    }

    // Validate required fields
    if (!name || !identifier) {
      throw new AppError('Name und Identifier sind erforderlich', 400);
    }

    // Validate identifier format
    const identifierRegex = /^[a-zA-Z0-9-_]+$/;
    if (!identifierRegex.test(identifier)) {
      throw new AppError('Identifier darf nur Buchstaben, Zahlen, Bindestriche und Unterstriche enthalten', 400);
    }

    // Check if identifier already exists
    const existingDisplay = await Display.findOne({ where: { identifier } });
    if (existingDisplay) {
      throw new AppError('Display mit diesem Identifier existiert bereits', 409);
    }

    const display = await Display.create({
      name,
      identifier,
      description: description || null,
      isActive: isActive !== undefined ? isActive : true,
      showTransitData: req.body.showTransitData !== undefined ? req.body.showTransitData : true,
      showTrafficData: req.body.showTrafficData !== undefined ? req.body.showTrafficData : true,
      organizationId: req.user?.organizationId,
    });

    res.status(201).json({
      success: true,
      data: display,
      message: 'Display erfolgreich erstellt',
    });

    logger.info(`Display erstellt: ${display.id} (${identifier})`);
  } catch (error) {
    next(error);
  }
};

/**
 * Update display
 * PUT /api/displays/:id
 */
export const updateDisplay = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, identifier, description, isActive } = req.body;

    const display = await Display.findByPk(id);

    if (!display) {
      throw new AppError('Display nicht gefunden', 404);
    }

    // Check organization access
    if (req.user?.organizationId && display.organizationId !== req.user.organizationId) {
      throw new AppError('Keine Berechtigung für dieses Display', 403);
    }

    // If identifier is being changed, check uniqueness
    if (identifier && identifier !== display.identifier) {
      const identifierRegex = /^[a-zA-Z0-9-_]+$/;
      if (!identifierRegex.test(identifier)) {
        throw new AppError('Identifier darf nur Buchstaben, Zahlen, Bindestriche und Unterstriche enthalten', 400);
      }

      const existingDisplay = await Display.findOne({ where: { identifier } });
      if (existingDisplay) {
        throw new AppError('Display mit diesem Identifier existiert bereits', 409);
      }
    }

    // Update fields
    if (name !== undefined) display.name = name;
    if (identifier !== undefined) display.identifier = identifier;
    if (description !== undefined) display.description = description;
    if (isActive !== undefined) display.isActive = isActive;
    if (req.body.showTransitData !== undefined) display.showTransitData = req.body.showTransitData;
    if (req.body.showTrafficData !== undefined) display.showTrafficData = req.body.showTrafficData;

    await display.save();

    res.json({
      success: true,
      data: display,
      message: 'Display erfolgreich aktualisiert',
    });

    logger.info(`Display aktualisiert: ${id}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete display
 * DELETE /api/displays/:id
 */
export const deleteDisplay = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const display = await Display.findByPk(id);

    if (!display) {
      throw new AppError('Display nicht gefunden', 404);
    }

    // Check organization access
    if (req.user?.organizationId && display.organizationId !== req.user.organizationId) {
      throw new AppError('Keine Berechtigung für dieses Display', 403);
    }

    // Check if display has assigned posts
    const postCount = await PostDisplay.count({ where: { displayId: id } });
    if (postCount > 0) {
      // Option 1: Prevent deletion if posts are assigned
      // throw new AppError(`Display kann nicht gelöscht werden. ${postCount} Posts sind diesem Display zugewiesen.`, 400);
      
      // Option 2: Delete assignments (CASCADE already handled by DB)
      logger.info(`Display ${id} wird gelöscht. ${postCount} Post-Zuweisungen werden entfernt.`);
    }

    await display.destroy();

    res.json({
      success: true,
      message: 'Display erfolgreich gelöscht',
    });

    logger.info(`Display gelöscht: ${id}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get posts for a specific display (admin view)
 * GET /api/displays/:id/posts
 */
export const getDisplayPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive } = req.query;

    const display = await Display.findByPk(id);

    if (!display) {
      throw new AppError('Display nicht gefunden', 404);
    }

    // Check organization access
    if (req.user?.organizationId && display.organizationId !== req.user.organizationId) {
      throw new AppError('Keine Berechtigung für dieses Display', 403);
    }

    // Build query
    const where: any = {};
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Get posts: either displayMode='all' OR explicitly assigned to this display
    const posts = await Post.findAll({
      where: {
        ...where,
        [Op.or]: [
          { displayMode: 'all' },
          {
            displayMode: 'specific',
            id: {
              [Op.in]: await PostDisplay.findAll({
                where: { displayId: id },
                attributes: ['postId'],
              }).then(pds => pds.map(pd => pd.postId)),
            },
          },
        ],
      },
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      include: [
        {
          model: Display,
          as: 'displays',
          through: { attributes: ['priorityOverride'] },
        },
      ],
    });

    res.json({
      success: true,
      data: posts,
    });

    logger.info(`Posts für Display ${id} abgerufen: ${posts.length}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all active displays (public API for Android TV app)
 * GET /api/public/displays
 */
export const getPublicDisplays = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cacheKey = 'public:displays:list';
    const cached = cacheService.get<any>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const displays = await Display.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'identifier', 'description', 'isActive', 'showTransitData', 'showTrafficData', 'organizationId'],
    });

    const response = {
      success: true,
      data: displays,
      count: displays.length,
    };

    // Cache für 60 Sekunden
    cacheService.set(cacheKey, response, 60);

    res.json(response);

    logger.info(`Public displays abgerufen: ${displays.length}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get posts for a specific display (public API for display page)
 * GET /api/public/display/:identifier/posts
 */
export const getPublicDisplayPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { identifier } = req.params;

    // Cache-Key für öffentliche Display-Posts
    const cacheKey = `public:display:${identifier}:posts`;
    const cached = cacheService.get<any>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const display = await Display.findOne({
      where: { identifier, isActive: true },
    });

    if (!display) {
      throw new AppError('Display nicht gefunden oder nicht aktiv', 404);
    }

    const now = new Date();

    // Get active posts for this display
    const postIds = await PostDisplay.findAll({
      where: { displayId: display.id },
      attributes: ['postId'],
    });

    const assignedPostIds = postIds.map(pd => pd.postId);

    const posts = await Post.findAll({
      where: {
        [Op.and]: [
          { isActive: true },
          {
            [Op.or]: [
              { displayMode: 'all' },
              {
                displayMode: 'specific',
                id: { [Op.in]: assignedPostIds },
              },
            ],
          },
          {
            [Op.or]: [
              { startDate: null },
              { startDate: { [Op.lte]: now } },
            ],
          },
          {
            [Op.or]: [
              { endDate: null },
              { endDate: { [Op.gte]: now } },
            ],
          },
        ],
      } as any,
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC'],
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
    });

    const response = {
      success: true,
      data: posts,
      display: {
        id: display.id,
        name: display.name,
        identifier: display.identifier,
        showTransitData: display.showTransitData,
        showTrafficData: display.showTrafficData,
      },
    };

    // Cache für 30 Sekunden
    cacheService.set(cacheKey, response, 30);

    res.json(response);

    logger.info(`Public posts für Display ${identifier} abgerufen: ${posts.length}`);
  } catch (error) {
    next(error);
  }
};
