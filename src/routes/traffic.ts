import { Router, Request, Response } from 'express';
import trafficService from '../services/trafficService';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/traffic/highways
 * Hole Verkehrslage für eine oder mehrere Autobahnen
 * Query: ?roads=A1,A2,A7
 */
router.get('/highways', async (req: Request, res: Response) => {
  try {
    const roadsParam = req.query.roads as string;
    
    if (!roadsParam) {
      return res.status(400).json({
        success: false,
        message: 'Autobahn-IDs erforderlich (z.B. ?roads=A1,A2,A7)',
      });
    }

    const roadIds = roadsParam.split(',').map(r => r.trim().toUpperCase());
    
    // Validierung: A + Zahl
    const validRoads = roadIds.filter(id => /^A\d+$/.test(id));
    
    if (validRoads.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Ungültige Autobahn-IDs (Format: A1, A2, A7, ...)',
      });
    }

    const statuses = await trafficService.getMultipleHighwayStatus(validRoads);

    return res.json({
      success: true,
      data: statuses,
      count: statuses.length,
    });
  } catch (error) {
    logger.error('Fehler beim Laden der Verkehrslage:', error);
    return res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Verkehrslage',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/traffic/highways/:roadId
 * Hole Verkehrslage für eine einzelne Autobahn
 */
router.get('/highways/:roadId', async (req: Request, res: Response) => {
  try {
    const roadId = req.params.roadId.toUpperCase();
    
    // Validierung
    if (!/^A\d+$/.test(roadId)) {
      return res.status(400).json({
        success: false,
        message: 'Ungültige Autobahn-ID (Format: A1)',
      });
    }

    const status = await trafficService.getHighwayStatus(roadId);

    return res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error(`Fehler beim Laden der Verkehrslage für ${req.params.roadId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Verkehrslage',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/traffic/warnings/:roadId
 * Hole nur Verkehrswarnungen für eine Autobahn
 */
router.get('/warnings/:roadId', async (req: Request, res: Response) => {
  try {
    const roadId = req.params.roadId.toUpperCase();
    
    if (!/^A\d+$/.test(roadId)) {
      return res.status(400).json({
        success: false,
        message: 'Ungültige Autobahn-ID',
      });
    }

    const warnings = await trafficService.getWarnings(roadId);

    return res.json({
      success: true,
      data: warnings,
      count: warnings.length,
      roadId,
    });
  } catch (error) {
    logger.error(`Fehler beim Laden der Warnungen für ${req.params.roadId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Verkehrswarnungen',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/traffic/roadworks/:roadId
 * Hole nur Baustellen für eine Autobahn
 */
router.get('/roadworks/:roadId', async (req: Request, res: Response) => {
  try {
    const roadId = req.params.roadId.toUpperCase();
    
    if (!/^A\d+$/.test(roadId)) {
      return res.status(400).json({
        success: false,
        message: 'Ungültige Autobahn-ID',
      });
    }

    const roadworks = await trafficService.getRoadworks(roadId);

    return res.json({
      success: true,
      data: roadworks,
      count: roadworks.length,
      roadId,
    });
  } catch (error) {
    logger.error(`Fehler beim Laden der Baustellen für ${req.params.roadId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Baustellen',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/traffic/roads
 * Liste verfügbare Autobahnen
 */
router.get('/roads', async (_req: Request, res: Response) => {
  try {
    const roads = await trafficService.getAvailableRoads();

    return res.json({
      success: true,
      data: roads,
      count: roads.length,
    });
  } catch (error) {
    logger.error('Fehler beim Laden verfügbarer Autobahnen:', error);
    return res.status(500).json({
      success: false,
      message: 'Fehler beim Laden verfügbarer Autobahnen',
      error: (error as Error).message,
    });
  }
});

/**
 * POST /api/traffic/cache/clear
 * Leere Traffic-Cache (Admin-Funktion)
 */
router.post('/cache/clear', async (_req: Request, res: Response) => {
  try {
    trafficService.clearCache();
    
    return res.json({
      success: true,
      message: 'Traffic-Cache geleert',
    });
  } catch (error) {
    logger.error('Fehler beim Leeren des Traffic-Cache:', error);
    return res.status(500).json({
      success: false,
      message: 'Fehler beim Leeren des Cache',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/traffic/cache/stats
 * Hole Cache-Statistiken
 */
router.get('/cache/stats', async (_req: Request, res: Response) => {
  try {
    const stats = trafficService.getCacheStats();
    
    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Fehler beim Abrufen der Cache-Stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen der Statistiken',
      error: (error as Error).message,
    });
  }
});

export default router;
