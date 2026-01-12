import { Request, Response, NextFunction } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

const execAsync = promisify(exec);

// Constants
const EXEC_TIMEOUT = 10000; // 10 seconds
const PROCESS_KILL_WAIT = 1500; // 1.5 seconds
const DISPLAY = process.env.DISPLAY || ':0';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * Helper: Kill Chromium processes safely
 */
async function killChromium(): Promise<void> {
  try {
    await execAsync('pkill -f chromium', { timeout: EXEC_TIMEOUT });
    logger.info('Chromium processes killed');
  } catch (error: any) {
    // Exit code 1 means no process found - this is OK
    if (error.code === 1) {
      logger.debug('No Chromium process to kill');
    } else {
      logger.warn('Error killing Chromium:', error.message);
    }
  }
}

/**
 * Helper: Check if Chromium is available
 */
async function checkChromiumAvailable(): Promise<boolean> {
  try {
    await execAsync('which chromium', { timeout: EXEC_TIMEOUT });
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper: Start Chromium in kiosk mode
 */
async function startChromium(url: string): Promise<void> {
  const isAvailable = await checkChromiumAvailable();
  if (!isAvailable) {
    throw new AppError('Chromium ist nicht installiert oder nicht verfügbar', 500);
  }

  // Validate URL to prevent command injection
  const allowedUrls = [
    `${BASE_URL}/public/display.html`,
    `${BASE_URL}/public/display.html?mode=presentation`,
  ];

  if (!allowedUrls.includes(url)) {
    throw new AppError('Ungültige URL', 400);
  }

  // Optimierte Chromium-Parameter für Raspberry Pi Video-Performance:
  // - Aktiviere Hardware-Video-Decode
  // - Deaktiviere GPU-Rasterisierung (besser für Pi)
  // - Aktiviere Zero-Copy für Video
  const command = `DISPLAY=${DISPLAY} chromium --kiosk --noerrdialogs --disable-infobars --no-first-run --enable-features=OverlayScrollbar --start-maximized --disable-smooth-scrolling --disable-composited-antialiasing --disable-animations --enable-accelerated-video-decode --disable-gpu-rasterization --enable-zero-copy --ignore-gpu-blacklist "${url}" > /dev/null 2>&1 &`;

  try {
    await execAsync(command, { timeout: EXEC_TIMEOUT });
  } catch (error: any) {
    logger.error('Failed to start Chromium:', error);
    throw new AppError('Fehler beim Starten von Chromium', 500);
  }
}

/**
 * Start Kiosk Mode in Presentation Mode
 * POST /api/kiosk/presentation
 */
export const startPresentationMode = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    logger.info('Starting presentation mode...');
    
    await killChromium();
    await new Promise(resolve => setTimeout(resolve, PROCESS_KILL_WAIT));
    
    const url = `${BASE_URL}/public/display.html?mode=presentation`;
    await startChromium(url);
    
    res.json({
      success: true,
      message: 'Präsentationsmodus gestartet',
    });

    logger.info('Presentation mode started successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Start Kiosk Mode in Normal Mode
 * POST /api/kiosk/display
 */
export const startDisplayMode = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    logger.info('Starting display mode...');
    
    await killChromium();
    await new Promise(resolve => setTimeout(resolve, PROCESS_KILL_WAIT));
    
    const url = `${BASE_URL}/public/display.html`;
    await startChromium(url);
    
    res.json({
      success: true,
      message: 'Display-Modus gestartet',
    });

    logger.info('Display mode started successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Stop Kiosk Mode
 * POST /api/kiosk/stop
 */
export const stopKioskMode = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    logger.info('Stopping kiosk mode...');
    
    await killChromium();
    
    res.json({
      success: true,
      message: 'Kiosk-Modus gestoppt',
    });

    logger.info('Kiosk mode stopped successfully');
  } catch (error) {
    next(error);
  }
};
