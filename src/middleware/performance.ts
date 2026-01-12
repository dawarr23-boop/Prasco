import { Request, Response, NextFunction } from 'express';

/**
 * Caching-Middleware für statische Ressourcen
 * Optimiert für Raspberry Pi 3
 */
export const cacheControl = (maxAge: number = 86400) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Nur GET-Requests cachen
    if (req.method === 'GET') {
      // Öffentliche Ressourcen
      if (req.path.startsWith('/uploads/') || 
          req.path.startsWith('/js/') || 
          req.path.startsWith('/css/') ||
          req.path.startsWith('/images/')) {
        res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
        res.setHeader('Expires', new Date(Date.now() + maxAge * 1000).toUTCString());
      }
      // API-Responses: kurzes Caching
      else if (req.path.startsWith('/api/public/')) {
        res.setHeader('Cache-Control', 'public, max-age=60'); // 1 Minute
      }
      // Admin-API: Kein Caching
      else if (req.path.startsWith('/api/')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
    next();
  };
};

/**
 * ETag-Middleware für effizientes Caching
 */
export const etagMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Aktiviere ETag für GET-Requests
    if (req.method === 'GET') {
      res.setHeader('ETag', 'W/"' + Date.now() + '"');
    }
    next();
  };
};

/**
 * Response-Compression-Hints für Browser
 */
export const compressionHints = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Akzeptiere gzip/brotli Compression
    if (req.path.match(/\.(js|css|html|json|xml|txt)$/)) {
      res.setHeader('Vary', 'Accept-Encoding');
    }
    next();
  };
};
