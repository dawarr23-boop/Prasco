import { Router, Request, Response } from 'express';
import logger from '../utils/logger';

const router = Router();

// In-Memory Cache
const weatherCache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 Minuten

// Wetter-Code → Beschreibung + Icon
const weatherCodes: Record<number, { description: string; icon: string }> = {
  0: { description: 'Klar', icon: '☀️' },
  1: { description: 'Überwiegend klar', icon: '🌤️' },
  2: { description: 'Teilweise bewölkt', icon: '⛅' },
  3: { description: 'Bewölkt', icon: '☁️' },
  45: { description: 'Nebel', icon: '🌫️' },
  48: { description: 'Reifnebel', icon: '🌫️' },
  51: { description: 'Leichter Nieselregen', icon: '🌦️' },
  53: { description: 'Mäßiger Nieselregen', icon: '🌦️' },
  55: { description: 'Starker Nieselregen', icon: '🌧️' },
  56: { description: 'Gefrierender Nieselregen', icon: '🌧️' },
  57: { description: 'Starker gefrierender Nieselregen', icon: '🌧️' },
  61: { description: 'Leichter Regen', icon: '🌧️' },
  63: { description: 'Mäßiger Regen', icon: '🌧️' },
  65: { description: 'Starker Regen', icon: '🌧️' },
  66: { description: 'Gefrierender Regen', icon: '❄️🌧️' },
  67: { description: 'Starker gefrierender Regen', icon: '❄️🌧️' },
  71: { description: 'Leichter Schneefall', icon: '🌨️' },
  73: { description: 'Mäßiger Schneefall', icon: '🌨️' },
  75: { description: 'Starker Schneefall', icon: '❄️' },
  77: { description: 'Schneekörner', icon: '❄️' },
  80: { description: 'Leichte Regenschauer', icon: '🌦️' },
  81: { description: 'Mäßige Regenschauer', icon: '🌧️' },
  82: { description: 'Starke Regenschauer', icon: '⛈️' },
  85: { description: 'Leichte Schneeschauer', icon: '🌨️' },
  86: { description: 'Starke Schneeschauer', icon: '❄️' },
  95: { description: 'Gewitter', icon: '⛈️' },
  96: { description: 'Gewitter mit leichtem Hagel', icon: '⛈️' },
  99: { description: 'Gewitter mit starkem Hagel', icon: '⛈️' },
};

function getWeatherInfo(code: number) {
  return weatherCodes[code] || { description: 'Unbekannt', icon: '❓' };
}

/**
 * GET /api/weather/current
 * Aktuelles Wetter + 7-Tage-Vorhersage
 * Query: ?lat=51.77&lon=7.89&name=Ahlen
 */
router.get('/current', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const name = (req.query.name as string) || 'Standort';

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        success: false,
        message: 'Latitude und Longitude erforderlich (z.B. ?lat=51.77&lon=7.89)',
      });
    }

    // Cache prüfen
    const cacheKey = `weather_${lat}_${lon}`;
    const cached = weatherCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json({ success: true, data: cached.data, cached: true });
    }

    // Open-Meteo API (kostenlos, kein API-Key nötig)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset&timezone=Europe%2FBerlin&forecast_days=7`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo API Fehler: ${response.status}`);
    }

    const apiData: any = await response.json();

    // Aktuelles Wetter aufbereiten
    const currentWeather = apiData.current;
    const weatherInfo = getWeatherInfo(currentWeather.weather_code);

    const result = {
      location: name,
      current: {
        temperature: Math.round(currentWeather.temperature_2m * 10) / 10,
        feelsLike: Math.round(currentWeather.apparent_temperature * 10) / 10,
        humidity: currentWeather.relative_humidity_2m,
        windSpeed: Math.round(currentWeather.wind_speed_10m),
        windDirection: currentWeather.wind_direction_10m,
        pressure: Math.round(currentWeather.pressure_msl),
        uvIndex: currentWeather.uv_index,
        weatherCode: currentWeather.weather_code,
        description: weatherInfo.description,
        icon: weatherInfo.icon,
      },
      forecast: apiData.daily.time.map((date: string, i: number) => {
        const dayInfo = getWeatherInfo(apiData.daily.weather_code[i]);
        return {
          date,
          weekday: new Date(date).toLocaleDateString('de-DE', { weekday: 'short' }),
          tempMax: Math.round(apiData.daily.temperature_2m_max[i]),
          tempMin: Math.round(apiData.daily.temperature_2m_min[i]),
          precipitation: apiData.daily.precipitation_sum[i],
          precipProbability: apiData.daily.precipitation_probability_max[i],
          windMax: Math.round(apiData.daily.wind_speed_10m_max[i]),
          weatherCode: apiData.daily.weather_code[i],
          description: dayInfo.description,
          icon: dayInfo.icon,
          sunrise: apiData.daily.sunrise[i],
          sunset: apiData.daily.sunset[i],
        };
      }),
    };

    // Cache speichern
    weatherCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Fehler beim Laden der Wetterdaten:', error);
    return res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Wetterdaten',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/weather/cache/stats
 */
router.get('/cache/stats', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: { entries: weatherCache.size },
  });
});

/**
 * POST /api/weather/cache/clear
 */
router.post('/cache/clear', (_req: Request, res: Response) => {
  weatherCache.clear();
  res.json({ success: true, message: 'Wetter-Cache geleert' });
});

/**
 * GET /api/weather/geocode
 * Ortssuche für Koordinaten
 * Query: ?q=Ahlen
 */
router.get('/geocode', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query || query.length < 2) {
      return res.status(400).json({ success: false, message: 'Suchbegriff erforderlich (min. 2 Zeichen)' });
    }

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=de&format=json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Geocoding API Fehler: ${response.status}`);

    const data: any = await response.json();
    const results = (data.results || []).map((r: any) => ({
      name: r.name,
      country: r.country,
      admin1: r.admin1, // Bundesland
      latitude: r.latitude,
      longitude: r.longitude,
    }));

    return res.json({ success: true, data: results });
  } catch (error) {
    logger.error('Geocoding Fehler:', error);
    return res.status(500).json({ success: false, message: (error as Error).message });
  }
});

export default router;
