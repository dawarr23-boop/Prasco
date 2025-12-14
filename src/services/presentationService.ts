import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { UPLOAD_PATHS } from '../config/upload';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

// PowerPoint Slide Interface
export interface PresentationSlide {
  slideNumber: number;
  imageUrl: string;
  title?: string;
  notes?: string;
}

export interface PresentationResult {
  success: boolean;
  slides: PresentationSlide[];
  totalSlides: number;
  presentationId: string;
  error?: string;
}

// Presentations folder
const PRESENTATIONS_PATH = path.join(UPLOAD_PATHS.BASE, 'presentations');

// Ensure presentations directory exists
if (!fs.existsSync(PRESENTATIONS_PATH)) {
  fs.mkdirSync(PRESENTATIONS_PATH, { recursive: true });
}

/**
 * Prüft ob LibreOffice installiert ist
 */
async function checkLibreOffice(): Promise<string | null> {
  const possiblePaths = [
    // Windows
    'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    // Linux/Mac
    '/usr/bin/soffice',
    '/usr/bin/libreoffice',
    '/usr/local/bin/soffice',
    '/Applications/LibreOffice.app/Contents/MacOS/soffice',
  ];

  // Versuche zuerst den Befehl direkt
  try {
    await execAsync('soffice --version');
    return 'soffice';
  } catch {
    // Suche nach installiertem Pfad
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return `"${p}"`;
      }
    }
  }

  return null;
}

/**
 * Konvertiert PowerPoint zu PNG-Bildern mit LibreOffice
 */
async function convertWithLibreOffice(
  inputPath: string,
  outputDir: string
): Promise<{ success: boolean; slideCount: number; error?: string }> {
  const soffice = await checkLibreOffice();

  if (!soffice) {
    logger.warn('LibreOffice nicht gefunden - Slides werden nicht automatisch generiert');
    return {
      success: false,
      slideCount: 0,
      error: 'LibreOffice nicht installiert',
    };
  }

  try {
    // Erst zu PDF konvertieren
    const pdfCmd = `${soffice} --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`;
    logger.info(`Konvertiere zu PDF: ${pdfCmd}`);
    await execAsync(pdfCmd, { timeout: 120000 });

    // Finde die PDF-Datei
    const files = fs.readdirSync(outputDir);
    const pdfFile = files.find((f) => f.endsWith('.pdf'));

    if (!pdfFile) {
      throw new Error('PDF-Konvertierung fehlgeschlagen');
    }

    const pdfPath = path.join(outputDir, pdfFile);

    // PDF zu PNG konvertieren (mehrere Seiten)
    // LibreOffice kann PDF direkt zu PNG konvertieren
    const pngCmd = `${soffice} --headless --convert-to png --outdir "${outputDir}" "${pdfPath}"`;
    logger.info(`Konvertiere zu PNG: ${pngCmd}`);

    try {
      await execAsync(pngCmd, { timeout: 120000 });
    } catch {
      // Falls PDF->PNG nicht funktioniert, verwende alternative Methode
      logger.info('Versuche alternative PNG-Konvertierung...');
    }

    // Zähle die generierten PNG-Dateien
    const pngFiles = fs.readdirSync(outputDir).filter((f) => f.endsWith('.png'));

    if (pngFiles.length === 0) {
      // Wenn keine PNGs erzeugt wurden, behalte die PDF
      logger.info('Keine PNGs erzeugt, PDF wird als Fallback verwendet');
      return {
        success: true,
        slideCount: 0,
        error: 'PDF erstellt, aber keine PNG-Slides',
      };
    }

    // Benenne die PNG-Dateien um zu slide_001.png, slide_002.png, etc.
    pngFiles.sort();
    let slideNumber = 1;
    for (const pngFile of pngFiles) {
      const oldPath = path.join(outputDir, pngFile);
      const newPath = path.join(outputDir, `slide_${slideNumber.toString().padStart(3, '0')}.png`);
      if (oldPath !== newPath) {
        fs.renameSync(oldPath, newPath);
      }
      slideNumber++;
    }

    // Lösche die temporäre PDF
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }

    logger.info(`LibreOffice-Konvertierung erfolgreich: ${slideNumber - 1} Slides`);
    return {
      success: true,
      slideCount: slideNumber - 1,
    };
  } catch (error) {
    logger.error('LibreOffice-Konvertierung fehlgeschlagen:', error);
    return {
      success: false,
      slideCount: 0,
      error: error instanceof Error ? error.message : 'Konvertierung fehlgeschlagen',
    };
  }
}

/**
 * Speichert eine PowerPoint-Datei und konvertiert sie automatisch zu Slides mit LibreOffice
 */
export async function processPowerPoint(
  filePath: string,
  originalName: string
): Promise<PresentationResult> {
  const presentationId = `pres_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const presFolder = path.join(PRESENTATIONS_PATH, presentationId);

  try {
    // Erstelle Ordner für diese Präsentation
    fs.mkdirSync(presFolder, { recursive: true });

    // Kopiere Originaldatei
    const ext = path.extname(originalName).toLowerCase();
    const destPath = path.join(presFolder, `presentation${ext}`);
    fs.copyFileSync(filePath, destPath);

    // Lösche temporäre Upload-Datei
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    logger.info(`PowerPoint gespeichert: ${presentationId}`);

    // Versuche automatische Konvertierung mit LibreOffice
    const conversionResult = await convertWithLibreOffice(destPath, presFolder);

    // Hole die generierten Slides
    const slides = getSlideImages(presentationId);

    return {
      success: true,
      slides,
      totalSlides: slides.length,
      presentationId,
      error: conversionResult.error,
    };
  } catch (error) {
    logger.error('Fehler bei PowerPoint-Verarbeitung:', error);
    return {
      success: false,
      slides: [],
      totalSlides: 0,
      presentationId: '',
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    };
  }
}

/**
 * Gibt den Pfad zur PowerPoint-Datei zurück
 */
export function getPresentationPath(presentationId: string): string | null {
  const presFolder = path.join(PRESENTATIONS_PATH, presentationId);

  if (!fs.existsSync(presFolder)) {
    return null;
  }

  // Suche nach der Präsentationsdatei
  const files = fs.readdirSync(presFolder);
  const presFile = files.find(
    (f) =>
      f.startsWith('presentation') &&
      (f.endsWith('.pptx') || f.endsWith('.ppt') || f.endsWith('.odp'))
  );

  return presFile ? path.join(presFolder, presFile) : null;
}

/**
 * Speichert ein generiertes Slide-Bild
 */
export async function saveSlideImage(
  presentationId: string,
  slideNumber: number,
  imageBuffer: Buffer
): Promise<string> {
  const presFolder = path.join(PRESENTATIONS_PATH, presentationId);

  if (!fs.existsSync(presFolder)) {
    fs.mkdirSync(presFolder, { recursive: true });
  }

  const imagePath = path.join(presFolder, `slide_${slideNumber.toString().padStart(3, '0')}.png`);
  fs.writeFileSync(imagePath, imageBuffer);

  return `/uploads/presentations/${presentationId}/slide_${slideNumber.toString().padStart(3, '0')}.png`;
}

/**
 * Holt alle Slide-Bilder einer Präsentation
 */
export function getSlideImages(presentationId: string): PresentationSlide[] {
  const presFolder = path.join(PRESENTATIONS_PATH, presentationId);

  if (!fs.existsSync(presFolder)) {
    return [];
  }

  const files = fs
    .readdirSync(presFolder)
    .filter((f) => f.startsWith('slide_') && f.endsWith('.png'))
    .sort();

  return files.map((file, index) => ({
    slideNumber: index + 1,
    imageUrl: `/uploads/presentations/${presentationId}/${file}`,
  }));
}

/**
 * Löscht eine Präsentation und alle zugehörigen Dateien
 */
export function deletePresentation(presentationId: string): boolean {
  const presFolder = path.join(PRESENTATIONS_PATH, presentationId);

  if (!fs.existsSync(presFolder)) {
    return false;
  }

  try {
    fs.rmSync(presFolder, { recursive: true });
    logger.info(`Präsentation gelöscht: ${presentationId}`);
    return true;
  } catch (error) {
    logger.error('Fehler beim Löschen der Präsentation:', error);
    return false;
  }
}

export const PRESENTATIONS_FOLDER = PRESENTATIONS_PATH;
