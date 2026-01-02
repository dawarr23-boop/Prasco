import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { promises as fs } from 'fs';
import path from 'path';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export interface DocumentParseResult {
  title: string;
  content: string;
  contentType: 'text' | 'html';
  extractedText?: string;
  pageCount?: number;
  wordCount?: number;
}

export class DocumentService {
  /**
   * Parse Word document (.docx) to HTML
   */
  static async parseWordDocument(filePath: string): Promise<DocumentParseResult> {
    try {
      logger.info(`Parsing Word document: ${filePath}`);

      const buffer = await fs.readFile(filePath);
      const result = await mammoth.convertToHtml({ buffer });

      if (result.messages.length > 0) {
        logger.warn('Word parsing warnings:', result.messages);
      }

      // Extract plain text for word count
      const textResult = await mammoth.extractRawText({ buffer });
      const wordCount = textResult.value.split(/\s+/).filter(Boolean).length;

      // Extract title from filename or first heading
      const fileName = path.basename(filePath, path.extname(filePath));
      let title = fileName.replace(/[-_]/g, ' ');

      // Try to extract first H1 as title
      const h1Match = result.value.match(/<h1[^>]*>(.*?)<\/h1>/i);
      if (h1Match && h1Match[1]) {
        title = h1Match[1].replace(/<[^>]*>/g, '').trim();
      }

      return {
        title,
        content: result.value,
        contentType: 'html',
        extractedText: textResult.value,
        wordCount,
      };
    } catch (error) {
      logger.error('Error parsing Word document:', error);
      throw new AppError('Fehler beim Parsen des Word-Dokuments', 500);
    }
  }

  /**
   * Parse PDF document to text
   */
  static async parsePdfDocument(filePath: string): Promise<DocumentParseResult> {
    try {
      logger.info(`Parsing PDF document: ${filePath}`);

      const buffer = await fs.readFile(filePath);
      const data = await pdfParse(buffer);

      // Extract title from filename
      const fileName = path.basename(filePath, path.extname(filePath));
      const title = fileName.replace(/[-_]/g, ' ');

      // Convert text to HTML with paragraphs
      const htmlContent = this.convertTextToHtml(data.text);

      const wordCount = data.text.split(/\s+/).filter(Boolean).length;

      return {
        title,
        content: htmlContent,
        contentType: 'html',
        extractedText: data.text,
        pageCount: data.numpages,
        wordCount,
      };
    } catch (error) {
      logger.error('Error parsing PDF document:', error);
      throw new AppError('Fehler beim Parsen des PDF-Dokuments', 500);
    }
  }

  /**
   * Convert plain text to simple HTML
   */
  private static convertTextToHtml(text: string): string {
    // Split by double line breaks for paragraphs
    const paragraphs = text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    // Wrap each paragraph in <p> tags
    const html = paragraphs
      .map((p) => {
        // Replace single line breaks with <br>
        const formatted = p.replace(/\n/g, '<br>');
        return `<p>${formatted}</p>`;
      })
      .join('\n');

    return `<div style="font-family: Arial, sans-serif; font-size: 1rem; line-height: 1.6;">\n${html}\n</div>`;
  }

  /**
   * Parse document based on file extension
   */
  static async parseDocument(filePath: string): Promise<DocumentParseResult> {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.docx':
        return this.parseWordDocument(filePath);
      case '.pdf':
        return this.parsePdfDocument(filePath);
      default:
        throw new AppError(`Nicht unterstütztes Dokumentformat: ${ext}`, 400);
    }
  }

  /**
   * Validate document file
   */
  static validateDocument(file: Express.Multer.File): void {
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/pdf',
    ];

    const allowedExtensions = ['.docx', '.pdf'];

    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedMimeTypes.includes(file.mimetype) && !allowedExtensions.includes(ext)) {
      throw new AppError('Nur Word (.docx) und PDF-Dokumente sind erlaubt', 400);
    }

    // Max file size: 10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new AppError('Dokument darf maximal 10MB groß sein', 400);
    }
  }

  /**
   * Clean up temporary document file
   */
  static async cleanupDocument(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      logger.info(`Cleaned up document: ${filePath}`);
    } catch (error) {
      logger.warn(`Failed to cleanup document: ${filePath}`, error);
    }
  }
}
