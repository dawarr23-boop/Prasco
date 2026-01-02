import { Request, Response, NextFunction } from 'express';
import { DocumentService } from '../services/documentService';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import path from 'path';

/**
 * Upload and parse document (Word/PDF) for post creation
 * POST /api/documents/parse
 */
export const parseDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      throw new AppError('Keine Datei hochgeladen', 400);
    }

    // Validate document
    DocumentService.validateDocument(req.file);

    logger.info(
      `Document upload: ${req.file.originalname} (${req.file.size} bytes) by user ${req.user?.id}`
    );

    // Parse document
    const result = await DocumentService.parseDocument(req.file.path);

    // Cleanup temporary file
    await DocumentService.cleanupDocument(req.file.path);

    res.json({
      success: true,
      data: {
        title: result.title,
        content: result.content,
        contentType: result.contentType,
        metadata: {
          originalFileName: req.file.originalname,
          fileSize: req.file.size,
          pageCount: result.pageCount,
          wordCount: result.wordCount,
        },
      },
      message: 'Dokument erfolgreich geparst',
    });

    logger.info(`Document parsed successfully: ${req.file.originalname}`);
  } catch (error) {
    // Cleanup on error
    if (req.file) {
      await DocumentService.cleanupDocument(req.file.path).catch(() => {});
    }
    next(error);
  }
};

/**
 * Get supported document formats
 * GET /api/documents/formats
 */
export const getSupportedFormats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.json({
      success: true,
      data: {
        formats: [
          {
            extension: '.docx',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            description: 'Microsoft Word-Dokument',
            maxSize: '10MB',
          },
          {
            extension: '.pdf',
            mimeType: 'application/pdf',
            description: 'PDF-Dokument',
            maxSize: '10MB',
          },
        ],
        limitations: [
          'Maximale Dateigröße: 10MB',
          'Word-Dokumente werden zu HTML konvertiert',
          'PDF-Dokumente werden zu formatiertem Text konvertiert',
          'Bilder in Dokumenten werden aktuell nicht unterstützt',
        ],
      },
    });
  } catch (error) {
    next(error);
  }
};
