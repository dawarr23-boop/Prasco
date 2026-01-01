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

// Import models BEFORE connectDatabase to ensure they're registered
import './models';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';
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

// Import Swagger Config
import { swaggerSpec } from './config/swagger';

const app: Application = express();
const PORT = process.env.PORT || 3000;
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
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        styleSrcElem: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: [
          "'self'",
          'data:',
          'https://www.prasco.net',
          'https://*.ytimg.com',
          'https://*.vimeocdn.com',
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
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10), // 1000 requests per window
  message: 'Zu viele Anfragen von dieser IP, bitte versuchen Sie es später erneut.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, _res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    logger.warn('Rate limit exceeded', { ip, path: req.path });
    next(new Error('Zu viele Anfragen von dieser IP, bitte versuchen Sie es später erneut.'));
  },
});

// Rate Limiter for Authentication - more lenient for development/small deployments
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '30', 10), // 30 login attempts per 15 min
  message: 'Zu viele Login-Versuche. Bitte versuchen Sie es in 15 Minuten erneut.',
  skipSuccessfulRequests: true,
  handler: (req, _res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    logger.warn('Auth rate limit exceeded', { ip, path: req.path });
    next(new Error('Zu viele Login-Versuche. Bitte versuchen Sie es in 15 Minuten erneut.'));
  },
});

// Upload Rate Limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX || '100', 10), // 100 uploads per hour
  message: 'Zu viele Upload-Versuche. Bitte versuchen Sie es in einer Stunde erneut.',
  handler: (req, _res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    logger.warn('Upload rate limit exceeded', { ip, path: req.path, user: req.user?.email });
    next(new Error('Zu viele Upload-Versuche. Bitte versuchen Sie es in einer Stunde erneut.'));
  },
});

// CORS Configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsing & compression
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input Sanitization - Protect against NoSQL injection
app.use(mongoSanitize());

// Logging
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Static Files
app.use(express.static(path.join(__dirname, '../public')));
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));
app.use('/views', express.static(path.join(__dirname, '../views')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// PowerPoint Präsentationen statisch ausliefern
app.use('/uploads/presentations', express.static(path.join(__dirname, '../uploads/presentations')));

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
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Prasco API Dokumentation',
  })
);

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes with Rate Limiting
app.use('/api/', apiLimiter); // Global API rate limit
app.use('/api/auth', authLimiter, authRoutes); // Strict limit for auth
app.use('/api/auth/sso', ssoRoutes); // SSO Routes (Azure AD)
app.use('/api/posts', postRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/public', publicRoutes); // No rate limit for public display
app.use('/api/media/upload', uploadLimiter); // Strict limit for uploads
app.use('/api/media', mediaRoutes);

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
    // Connect to database
    await connectDatabase();
    logger.info('✅ Datenbankverbindung hergestellt');

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

startServer();

export default app;
