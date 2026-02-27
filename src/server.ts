import express, { Application, Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import swaggerUi from 'swagger-ui-express';
import https from 'https';
import http from 'http';
import fs from 'fs';

// Load environment variables FIRST
dotenv.config();

// Import feature flags and log status
import FEATURES, { logFeatureStatus } from './config/features';

// Make features available globally
declare global {
  namespace Express {
    interface Application {
      features?: typeof FEATURES;
    }
  }
}

// Import models BEFORE connectDatabase to ensure they're registered
// REMOVED: import './models';  // Moved to startServer() to avoid deadlock
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { cacheControl, compressionHints } from './middleware/performance';
import { logger } from './utils/logger';
import { seedDatabase } from './database/seeders';

// Import Routes
import authRoutes from './routes/auth';
import ssoRoutes from './routes/sso';
import postRoutes from './routes/posts';
import categoryRoutes from './routes/categories';
import publicRoutes from './routes/public';
import mediaRoutes from './routes/media';
import userRoutes from './routes/users';
import settingsRoutes from './routes/settings';
import kioskRoutes from './routes/kiosk';
import youtubeRoutes from './routes/youtube';
import displayRoutes from './routes/displays';
import transitRoutes from './routes/transit';
import trafficRoutes from './routes/traffic';
import weatherRoutes from './routes/weather';
import aiRoutes from './routes/ai';
import deviceRoutes from './routes/devices';
import newsRoutes from './routes/news';

// Import Swagger Config
import { swaggerSpec } from './config/swagger';

const app: Application = express();
const PORT = process.env.PORT || 8443;
const SSL_ENABLED = process.env.SSL_ENABLED === 'true';
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || './ssl/server.key';
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || './ssl/server.crt';

// Determine if we should use HSTS (only with SSL)
const useHSTS = SSL_ENABLED;

// Security Middleware - Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://unpkg.com'],
        styleSrcElem: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://unpkg.com'],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
        connectSrc: ["'self'", 'https://api.rainviewer.com', 'https://www.tagesschau.de', 'https://www.spiegel.de', 'https://www.wa.de'],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://www.prasco.net',
          'https://*.ytimg.com',
          'https://*.vimeocdn.com',
          'https://*.basemaps.cartocdn.com',
          'https://tilecache.rainviewer.com',
          'https://*.tile.openstreetmap.org',
        ],
        mediaSrc: [
          "'self'",
          'https://www.youtube.com',
          'https://*.googlevideo.com',
          'https://player.vimeo.com',
          'https://*.vimeocdn.com',
          'blob:',
          'data:',
        ],
        frameSrc: [
          "'self'",
          'https://www.youtube.com',
          'https://www.youtube-nocookie.com',
          'https://player.vimeo.com',
          'https://embed.windy.com',
        ],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com', 'data:'],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        objectSrc: ["'none'"],
        scriptSrcAttr: ["'none'"],
        // Only upgrade insecure requests when SSL is enabled
        ...(SSL_ENABLED ? { upgradeInsecureRequests: [] } : {}),
      },
    },
    // Only enable HSTS when SSL is enabled
    hsts: useHSTS ? {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    } : false,
  })
);

// Rate Limiting - Global API Limiter
// Configurable via environment variables, defaults are suitable for single-admin usage
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5000', 10), // 5000 requests per window (erhöht von 1000)
  message: 'Zu viele Anfragen von dieser IP, bitte versuchen Sie es später erneut.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    logger.warn('Rate limit exceeded', { ip, path: req.path });
    res.status(429).json({
      success: false,
      error: {
        message: 'Zu viele Anfragen von dieser IP, bitte versuchen Sie es später erneut.'
      }
    });
  },
});

// Rate Limiter for Authentication - more lenient for development/small deployments
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes (verkürzt für bessere UX)
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '100', 10), // 100 login attempts per 5 min
  message: 'Zu viele Login-Versuche. Bitte warten Sie 5 Minuten.',
  skipSuccessfulRequests: true,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    logger.warn('Auth rate limit exceeded', { ip, path: req.path });
    res.status(429).json({
      success: false,
      error: {
        message: 'Zu viele Login-Versuche. Bitte warten Sie 5 Minuten.'
      }
    });
  },
});

// Upload Rate Limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX || '100', 10), // 100 uploads per hour
  message: 'Zu viele Upload-Versuche. Bitte versuchen Sie es in einer Stunde erneut.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    logger.warn('Upload rate limit exceeded', { ip, path: req.path, user: req.user?.email });
    res.status(429).json({
      success: false,
      error: {
        message: 'Zu viele Upload-Versuche. Bitte versuchen Sie es in einer Stunde erneut.'
      }
    });
  },
});

// Display Rate Limiter - Sehr großzügig für kontinuierliches Polling
const displayLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.DISPLAY_RATE_LIMIT_MAX || '10000', 10), // 10000 requests per 15 min
  message: 'Zu viele Display-Anfragen.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    logger.warn('Display rate limit exceeded', { ip, path: req.path });
    res.status(429).json({
      success: false,
      error: {
        message: 'Zu viele Display-Anfragen. Bitte kontaktieren Sie den Administrator.'
      }
    });
  },
});

// CORS Configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Performance Middlewares
app.use(cacheControl(86400)); // 1 Tag Cache für statische Ressourcen
app.use(compressionHints());

// Body parsing & compression
app.use(compression({
  level: 6, // Balance zwischen Kompression und CPU (RPi3 optimiert)
  threshold: 1024, // Nur Dateien >1KB komprimieren
  filter: (req, res) => {
    // Komprimiere keine Bilder/Videos (bereits komprimiert)
    if (req.path.match(/\.(jpg|jpeg|png|gif|mp4|webm)$/i)) {
      return false;
    }
    return compression.filter(req, res);
  },
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input Sanitization - Protect against NoSQL injection
// Erlauben von Punkten in Keys für Settings-API
app.use(mongoSanitize({
  allowDots: true
}));

// Logging
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Static Files mit Caching
const staticOptions = {
  maxAge: '1d', // 1 Tag Browser-Cache
  etag: true,
  lastModified: true,
  setHeaders: (res: Response, path: string) => {
    // Aggressive Caching für unveränderliche Assets
    if (path.match(/\.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // Video-Dateien: Cache + Accept-Ranges für schnelles Streaming
    if (path.match(/\.(mp4|webm|ogg|mov)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Accept-Ranges', 'bytes');
    }
  },
};

app.use(express.static(path.join(__dirname, '../public'), staticOptions));
app.use('/css', express.static(path.join(__dirname, '../css'), staticOptions));
app.use('/js', express.static(path.join(__dirname, '../js'), staticOptions));
app.use('/views', express.static(path.join(__dirname, '../views'), staticOptions));
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), staticOptions));
// PowerPoint Präsentationen statisch ausliefern
app.use('/uploads/presentations', express.static(path.join(__dirname, '../uploads/presentations'), staticOptions));

// Make features available on app
app.features = FEATURES;

// Frontend Routes
app.get('/', (_req: Request, res: Response) => {
  res.redirect('/public/display.html');
});

app.get('/public/display.html', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../views/public/display.html'));
});

app.get('/admin', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../views/admin/login.html'));
});

app.get('/admin/dashboard', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../views/admin/dashboard.html'));
});

// Swagger API Documentation
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Prasco API Dokumentation',
  })
);

// Legacy redirect for old API docs URL
app.get('/api-docs', (_req: Request, res: Response) => {
  res.redirect(301, '/api/docs');
});

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes with Rate Limiting
// WICHTIG: Display-Routes ZUERST registrieren (vor globalem apiLimiter)
app.use('/api/public', displayLimiter, publicRoutes); // Großzügiger Limiter für Displays
app.use('/api/', apiLimiter); // Global API rate limit für alle anderen /api/* Routes
app.use('/api/auth', authLimiter, authRoutes); // Strict limit for auth
app.use('/api/auth/sso', ssoRoutes); // SSO Routes (Azure AD)
app.use('/api/posts', postRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/media/upload', uploadLimiter); // Strict limit for uploads
app.use('/api/media', mediaRoutes);
app.use('/api/kiosk', kioskRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/displays', displayRoutes);
app.use('/api/transit', transitRoutes);
app.use('/api/traffic', trafficRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/devices', displayLimiter, deviceRoutes);

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Die angeforderte Ressource wurde nicht gefunden',
  });
});

// Error Handler
app.use(errorHandler);

// Initialize Database & Start Server
const startServer = async () => {
  try {
    // Log feature configuration on startup
    logFeatureStatus();
    
    // Connect to database
    await connectDatabase();
    logger.info('✅ Datenbankverbindung hergestellt');
    
    // Import models AFTER database connection
    await import('./models');

    // Seed database (always seed if users table is empty)
    try {
      const { User } = await import('./models');
      const userCount = await User.count();
      if (userCount === 0) {
        logger.info('🌱 Datenbank ist leer - starte Seeding...');
        await seedDatabase();
      } else if (process.env.NODE_ENV === 'development') {
        await seedDatabase();
      }
    } catch (seedError) {
      logger.warn('⚠️  Database-Seeding übersprungen:', seedError);
    }

    // Start server - use a promise to ensure the server stays running
    return new Promise<void>((resolve, reject) => {
      let server: http.Server | https.Server;
      const protocol = SSL_ENABLED ? 'https' : 'http';

      if (SSL_ENABLED) {
        // HTTPS Server
        try {
          const sslOptions = {
            key: fs.readFileSync(path.resolve(SSL_KEY_PATH)),
            cert: fs.readFileSync(path.resolve(SSL_CERT_PATH)),
          };
          server = https.createServer(sslOptions, app);
          logger.info('🔐 SSL aktiviert');
        } catch (error) {
          logger.error('❌ SSL-Zertifikate nicht gefunden. Bitte führen Sie ./scripts/generate-ssl-cert.sh aus');
          logger.info('⚠️  Starte im HTTP-Modus als Fallback...');
          server = http.createServer(app);
        }
      } else {
        // HTTP Server
        server = http.createServer(app);
      }

      server.listen(PORT, () => {
        logger.info(`🚀 Server läuft auf ${protocol}://localhost:${PORT}`);
        logger.info(`📺 Display: ${protocol}://localhost:${PORT}`);
        logger.info(`⚙️  Admin: ${protocol}://localhost:${PORT}/admin`);
        logger.info(`📚 API: ${protocol}://localhost:${PORT}/api`);
        if (!SSL_ENABLED) {
          logger.info('💡 Tipp: Für HTTPS setze SSL_ENABLED=true in .env');
        }
        resolve();
      });

      server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          logger.error(
            `❌ Port ${PORT} ist bereits belegt. Bitte beenden Sie den anderen Prozess.`
          );
        } else {
          logger.error('❌ Server-Fehler:', error);
        }
        reject(error);
      });
    });
  } catch (error) {
    logger.error('❌ Fehler beim Starten des Servers:', error);
    process.exit(1);
  }
};

// Graceful Shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal empfangen: Fahre Server herunter');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal empfangen: Fahre Server herunter');
  process.exit(0);
});

startServer().catch((error) => {
  logger.error('❌ Fatal error during server start:', error);
  process.exit(1);
});

export default app;
