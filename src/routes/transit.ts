import { Router, Request, Response } from 'express';
import transitService from '../services/transitService';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/transit/stations/search
 * Suche Stationen nach Name
 * Query: ?q=Hauptbahnhof&limit=5
 */
router.get('/stations/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 5;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Suchbegriff muss mindestens 2 Zeichen lang sein',
      });
    }

    const stations = await transitService.searchStations(query, limit);

    return res.json({
      success: true,
      data: stations,
      count: stations.length,
    });
  } catch (error) {
    logger.error('Fehler bei Stationssuche:', error);
    return res.status(500).json({
      success: false,
      message: 'Fehler bei der Stationssuche',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/transit/stations/nearby
 * Suche Stationen in der Nähe (GPS)
 * Query: ?lat=48.1351&lon=11.5820&radius=1000&limit=5
 */
router.get('/stations/nearby', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const radius = parseInt(req.query.radius as string) || 1000;
    const limit = parseInt(req.query.limit as string) || 5;

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        success: false,
        message: 'Gültige GPS-Koordinaten erforderlich (lat, lon)',
      });
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({
        success: false,
        message: 'Ungültige GPS-Koordinaten',
      });
    }

    const stations = await transitService.getNearbyStations(lat, lon, radius, limit);

    return res.json({
      success: true,
      data: stations,
      count: stations.length,
      location: { lat, lon, radius },
    });
  } catch (error) {
    logger.error('Fehler bei Nearby-Suche:', error);
    return res.status(500).json({
      success: false,
      message: 'Fehler bei der Nearby-Suche',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/transit/departures/:stationId
 * Hole Abfahrten für eine Station
 * Query: ?limit=10&duration=60
 */
router.get('/departures/:stationId', async (req: Request, res: Response) => {
  try {
    const { stationId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    const duration = parseInt(req.query.duration as string) || 60;

    if (!stationId) {
      return res.status(400).json({
        success: false,
        message: 'Stations-ID erforderlich',
      });
    }

    const departures = await transitService.getDepartures(stationId, limit, duration);

    return res.json({
      success: true,
      data: departures,
      count: departures.length,
      stationId,
      params: { limit, duration },
    });
  } catch (error) {
    logger.error(`Fehler beim Laden der Abfahrten für Station ${req.params.stationId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Abfahrten',
      error: (error as Error).message,
    });
  }
});

/**
 * POST /api/transit/cache/clear
 * Leere Transit-Cache (Admin-Funktion)
 */
router.post('/cache/clear', async (_req: Request, res: Response) => {
  try {
    transitService.clearCache();
    
    return res.json({
      success: true,
      message: 'Transit-Cache geleert',
    });
  } catch (error) {
    logger.error('Fehler beim Leeren des Transit-Cache:', error);
    return res.status(500).json({
      success: false,
      message: 'Fehler beim Leeren des Cache',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/transit/cache/stats
 * Hole Cache-Statistiken
 */
router.get('/cache/stats', async (_req: Request, res: Response) => {
  try {
    const stats = transitService.getCacheStats();
    
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
