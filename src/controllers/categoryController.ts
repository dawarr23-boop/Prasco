import { Request, Response, NextFunction } from 'express';
import { Category } from '../models';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

/**
 * Get all categories
 * GET /api/categories
 */
export const getAllCategories = async (
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

    const categories = await Category.findAll({
      where,
      order: [
        ['sortOrder', 'ASC'],
        ['name', 'ASC'],
      ],
      attributes: [
        'id',
        'name',
        'color',
        'icon',
        'sortOrder',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });

    res.json({
      success: true,
      data: categories,
    });

    logger.info(`Kategorien abgerufen: ${categories.length}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single category by ID
 * GET /api/categories/:id
 */
export const getCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id, {
      attributes: [
        'id',
        'name',
        'color',
        'icon',
        'isActive',
        'organizationId',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!category) {
      throw new AppError('Kategorie nicht gefunden', 404);
    }

    // Check organization access
    if (req.user?.organizationId && category.organizationId !== req.user.organizationId) {
      throw new AppError('Keine Berechtigung für diese Kategorie', 403);
    }

    res.json({
      success: true,
      data: category,
    });

    logger.info(`Kategorie ${id} abgerufen`);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new category (Admin only)
 * POST /api/categories
 */
export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, color, icon } = req.body;

    // Check if category with same name exists in organization
    if (req.user?.organizationId) {
      const existing = await Category.findOne({
        where: {
          name,
          organizationId: req.user.organizationId,
        },
      });

      if (existing) {
        throw new AppError('Kategorie mit diesem Namen existiert bereits', 400);
      }
    }

    const category = await Category.create({
      name,
      color: color || '#c41e3a',
      icon: icon || undefined,
      organizationId: req.user?.organizationId,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: category,
      message: 'Kategorie erfolgreich erstellt',
    });

    logger.info(`Kategorie erstellt: ${category.id} - ${name}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Update category (Admin only)
 * PUT /api/categories/:id
 */
export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, color, icon, isActive } = req.body;

    const category = await Category.findByPk(id);

    if (!category) {
      throw new AppError('Kategorie nicht gefunden', 404);
    }

    // Check organization access
    if (req.user?.organizationId && category.organizationId !== req.user.organizationId) {
      throw new AppError('Keine Berechtigung für diese Kategorie', 403);
    }

    // Check if new name conflicts with existing category
    if (name && name !== category.name && req.user?.organizationId) {
      const existing = await Category.findOne({
        where: {
          name,
          organizationId: req.user.organizationId,
        },
      });

      if (existing && existing.id !== category.id) {
        throw new AppError('Kategorie mit diesem Namen existiert bereits', 400);
      }
    }

    // Update fields
    if (name !== undefined) category.name = name;
    if (color !== undefined) category.color = color;
    if (icon !== undefined) category.icon = icon;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.json({
      success: true,
      data: category,
      message: 'Kategorie erfolgreich aktualisiert',
    });

    logger.info(`Kategorie aktualisiert: ${id}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete category (Admin only)
 * DELETE /api/categories/:id
 */
export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);

    if (!category) {
      throw new AppError('Kategorie nicht gefunden', 404);
    }

    // Check organization access
    if (req.user?.organizationId && category.organizationId !== req.user.organizationId) {
      throw new AppError('Keine Berechtigung für diese Kategorie', 403);
    }

    // Check if category has posts
    const Post = require('../models').Post;
    const postsCount = await Post.count({
      where: { categoryId: id },
    });

    if (postsCount > 0) {
      throw new AppError(
        `Kategorie kann nicht gelöscht werden: ${postsCount} Post(s) verwenden diese Kategorie`,
        400
      );
    }

    await category.destroy();

    res.json({
      success: true,
      message: 'Kategorie erfolgreich gelöscht',
    });

    logger.info(`Kategorie gelöscht: ${id}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder categories - update sortOrder based on new order
 * PUT /api/categories/reorder
 */
export const reorderCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      throw new AppError('orderedIds muss ein nicht-leeres Array sein', 400);
    }

    // Update sortOrder for each category based on position in array
    const updates = orderedIds.map((id: number, index: number) => {
      return Category.update(
        { sortOrder: index },
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

    logger.info(`Kategorien neu sortiert: ${orderedIds.length} Einträge`);
  } catch (error) {
    next(error);
  }
};
