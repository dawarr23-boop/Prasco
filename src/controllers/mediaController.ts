import { Request, Response, NextFunction } from 'express';
import { Media, User } from '../models';
import { AppError } from '../middleware/errorHandler';
import { processMedia, deleteMediaFiles } from '../services/mediaService';
import { processPowerPoint, getSlideImages } from '../services/presentationService';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';
import path from 'path';

// PowerPoint MIME types
const PRESENTATION_MIME_TYPES = [
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.presentation',
];

export const uploadMedia = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      throw new AppError('Keine Datei hochgeladen', 400);
    }

    const file = req.file;
    const userId = req.user!.id;
    const organizationId = req.user!.organizationId;

    // Check if it's a PowerPoint file
    if (PRESENTATION_MIME_TYPES.includes(file.mimetype)) {
      const result = await processPowerPoint(file.path, file.originalname);

      if (!result.success) {
        throw new AppError(result.error || 'PowerPoint-Verarbeitung fehlgeschlagen', 500);
      }

      // Create Media entry for presentation
      const presentationUrl = `/uploads/presentations/${result.presentationId}/presentation${path.extname(file.originalname).toLowerCase()}`;

      const media = await Media.create({
        filename: `${result.presentationId}${path.extname(file.originalname).toLowerCase()}`,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: presentationUrl,
        uploadedBy: userId,
        organizationId: organizationId || undefined,
      });

      logger.info(`PowerPoint uploaded: ${result.presentationId}`);

      res.status(201).json({
        success: true,
        message: 'PowerPoint erfolgreich hochgeladen',
        data: {
          id: media.id, // Media ID für Post-Verknüpfung
          type: 'presentation',
          presentationId: result.presentationId,
          url: presentationUrl,
          originalName: file.originalname,
          slides: result.slides,
          totalSlides: result.totalSlides,
        },
      });
      return;
    }

    const processed = await processMedia(file.path, file.filename, file.mimetype);

    const media = await Media.create({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: processed.size,
      url: `/uploads/originals/${file.filename}`,
      thumbnailUrl: processed.thumbnailPath
        ? `/uploads/thumbnails/thumb_${file.filename}`
        : undefined,
      width: processed.width,
      height: processed.height,
      uploadedBy: userId,
      organizationId: organizationId || undefined,
    });

    logger.info(`Media uploaded: ${file.filename}`);

    res.status(201).json({
      success: true,
      message: 'Datei erfolgreich hochgeladen',
      data: media,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllMedia = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = '1', limit = '20', type } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};
    if (type === 'image') {
      where.mimeType = { [Op.like]: 'image/%' };
    } else if (type === 'video') {
      where.mimeType = { [Op.like]: 'video/%' };
    }

    if (req.user!.role !== 'super_admin' && req.user!.organizationId) {
      where.organizationId = req.user!.organizationId;
    }

    const { count, rows: media } = await Media.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'uploader', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    res.json({
      success: true,
      data: {
        media,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count,
          totalPages: Math.ceil(count / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMediaById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const media = await Media.findByPk(id, {
      include: [
        { model: User, as: 'uploader', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    if (!media) {
      throw new AppError('Medium nicht gefunden', 404);
    }

    res.json({ success: true, data: media });
  } catch (error) {
    next(error);
  }
};

export const deleteMedia = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const media = await Media.findByPk(id);

    if (!media) {
      throw new AppError('Medium nicht gefunden', 404);
    }

    if (req.user!.role !== 'super_admin' && media.uploadedBy !== req.user!.id) {
      throw new AppError('Keine Berechtigung zum Löschen', 403);
    }

    const hasThumbnail = media.thumbnailUrl !== null;
    await deleteMediaFiles(media.filename, hasThumbnail);
    await media.destroy();

    logger.info(`Media deleted: ${media.filename}`);

    res.json({ success: true, message: 'Medium erfolgreich gelöscht' });
  } catch (error) {
    next(error);
  }
};

// PowerPoint Slides abrufen
export const getPresentationSlides = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { presentationId } = req.params;

    if (!presentationId) {
      throw new AppError('Presentation ID fehlt', 400);
    }

    const slides = getSlideImages(presentationId);

    res.json({
      success: true,
      data: {
        presentationId,
        slides,
        totalSlides: slides.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
