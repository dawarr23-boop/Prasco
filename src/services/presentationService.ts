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
 * Prüft ob ImageMagick installiert ist und gibt den Befehl zurück
 */
async function checkImageMagick(): Promise<string | null> {
  const possiblePaths = [
    // Windows - ImageMagick 7+
    'C:\\Program Files\\ImageMagick-7.1.2-Q16-HDRI\\magick.exe',
    'C:\\Program Files\\ImageMagick\\magick.exe',
    'C:\\Program Files (x86)\\ImageMagick\\magick.exe',
    // Linux/Mac
    '/usr/bin/magick',
    '/usr/local/bin/magick',
    '/usr/bin/convert',
    '/usr/local/bin/convert',
  ];

  // Versuche zuerst den Befehl direkt
  try {
    await execAsync('magick --version');
    return 'magick';
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
    let pdfPath: string;
    const inputExt = path.extname(inputPath).toLowerCase();

    // Prüfe ob die Eingabe bereits ein PDF ist
    if (inputExt === '.pdf') {
      logger.info('Eingabe ist bereits ein PDF, überspringe Konvertierung');
      pdfPath = inputPath;
    } else {
      // Erst zu PDF konvertieren (für PowerPoint, ODP, etc.)
      // Nutze temporäres User-Profil um Konflikte zu vermeiden
      const tempProfile = path.join(outputDir, '.libreoffice-temp');
      const pdfCmd = `${soffice} --headless --invisible --nologo --nofirststartwizard -env:UserInstallation=file://${tempProfile} --convert-to pdf --outdir "${outputDir}" "${inputPath}"`;
      logger.info(`Konvertiere zu PDF: ${pdfCmd}`);
      
      try {
        await execAsync(pdfCmd, { timeout: 120000 });
      } catch (error) {
        // Cleanup temp profile bei Fehler
        if (fs.existsSync(tempProfile)) {
          fs.rmSync(tempProfile, { recursive: true, force: true });
        }
        throw error;
      }
      
      // Cleanup temp profile nach erfolgreicher Konvertierung
      if (fs.existsSync(tempProfile)) {
        fs.rmSync(tempProfile, { recursive: true, force: true });
      }

      // Finde die PDF-Datei
      const files = fs.readdirSync(outputDir);
      const pdfFile = files.find((f) => f.endsWith('.pdf'));

      if (!pdfFile) {
        throw new Error('PDF-Konvertierung fehlgeschlagen');
      }

      pdfPath = path.join(outputDir, pdfFile);
    }

    // PDF zu PNG konvertieren (mehrere Seiten)
    // Versuche verschiedene Methoden für mehrseitige PDF-Konvertierung
    
    let conversionSuccess = false;
    
    // Methode 1: pdftoppm (am besten für Linux/Raspberry Pi)
    try {
      const outputPrefix = path.join(outputDir, 'slide');
      const pdftoppmCmd = `pdftoppm -png "${pdfPath}" "${outputPrefix}"`;
      logger.info('Versuche pdftoppm...');
      await execAsync(pdftoppmCmd, { timeout: 120000 });
      conversionSuccess = true;
      logger.info('PDF erfolgreich mit pdftoppm konvertiert');
    } catch (pdftoppmError) {
      logger.info('pdftoppm nicht verfügbar, versuche ImageMagick...');
      
      // Methode 2: ImageMagick convert (benötigt Ghostscript)
      const magickCmd = await checkImageMagick();
      if (magickCmd) {
        try {
          const outputPattern = path.join(outputDir, 'slide-%03d.png');
          const magickConvertCmd = `${magickCmd} -density 150 "${pdfPath}" "${outputPattern}"`;
          logger.info('Versuche ImageMagick...');
          await execAsync(magickConvertCmd, { timeout: 120000 });
          conversionSuccess = true;
          logger.info('PDF erfolgreich mit ImageMagick konvertiert');
        } catch (magickError) {
          logger.warn('ImageMagick-Konvertierung fehlgeschlagen (Ghostscript fehlt?)');
        }
      }
      
      // Methode 3: LibreOffice (konvertiert nur erste Seite)
      if (!conversionSuccess) {
        logger.warn('Verwende LibreOffice PNG-Konvertierung (nur erste Seite)');
        const pngCmd = `${soffice} --headless --convert-to png --outdir "${outputDir}" "${pdfPath}"`;
        try {
          await execAsync(pngCmd, { timeout: 120000 });
        } catch (loError) {
          logger.error('LibreOffice PNG-Konvertierung fehlgeschlagen:', loError);
        }
      }
    }

    // Zähle die generierten PNG-Dateien
    let pngFiles = fs.readdirSync(outputDir).filter((f) => f.endsWith('.png'));

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
      if (oldPath !== newPath && !pngFile.startsWith('slide_')) {
        fs.renameSync(oldPath, newPath);
      }
      slideNumber++;
    }

    // Lösche die temporäre PDF (nur wenn sie konvertiert wurde, nicht wenn es die Originaldatei ist)
    if (inputExt !== '.pdf' && fs.existsSync(pdfPath) && pdfPath !== inputPath) {
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
