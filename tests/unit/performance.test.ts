import { Request, Response, NextFunction } from 'express';
import { cacheControl, etagMiddleware, compressionHints } from '../../src/middleware/performance';

describe('Performance Middleware', () => {
  // Use any to avoid TS read-only constraint on Request.path
  let mockRequest: Record<string, any>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      path: '/',
    };
    mockResponse = {
      setHeader: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  // ----------------------------------------------------------------
  // cacheControl
  // ----------------------------------------------------------------
  describe('cacheControl', () => {
    describe('static assets — /uploads/, /js/, /css/, /images/', () => {
      const staticPaths = [
        '/uploads/photo.jpg',
        '/uploads/originals/file.pdf',
        '/js/admin.js',
        '/js/display.js',
        '/css/style.css',
        '/css/admin.css',
        '/images/logo.png',
      ];

      staticPaths.forEach((p) => {
        it(`should set public Cache-Control for ${p}`, () => {
          mockRequest.path = p;
          cacheControl()(mockRequest as Request, mockResponse as Response, nextFunction);
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'Cache-Control',
            expect.stringContaining('public')
          );
          expect(nextFunction).toHaveBeenCalled();
        });
      });

      it('should use the default maxAge of 86400 seconds', () => {
        mockRequest.path = '/uploads/test.jpg';
        cacheControl()(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(mockResponse.setHeader).toHaveBeenCalledWith(
          'Cache-Control',
          'public, max-age=86400'
        );
      });

      it('should respect a custom maxAge', () => {
        mockRequest.path = '/uploads/test.jpg';
        cacheControl(3600)(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(mockResponse.setHeader).toHaveBeenCalledWith(
          'Cache-Control',
          'public, max-age=3600'
        );
      });

      it('should also set Expires header for static assets', () => {
        mockRequest.path = '/js/app.js';
        cacheControl()(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(mockResponse.setHeader).toHaveBeenCalledWith('Expires', expect.any(String));
      });
    });

    describe('public API routes — /api/public/', () => {
      it('should set Cache-Control: public, max-age=60', () => {
        mockRequest.path = '/api/public/posts';
        cacheControl()(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(mockResponse.setHeader).toHaveBeenCalledWith(
          'Cache-Control',
          'public, max-age=60'
        );
      });

      it('should handle nested public API paths', () => {
        mockRequest.path = '/api/public/posts/1/slides';
        cacheControl()(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(mockResponse.setHeader).toHaveBeenCalledWith(
          'Cache-Control',
          'public, max-age=60'
        );
      });
    });

    describe('private API routes — /api/ (non-public)', () => {
      const apiPaths = ['/api/posts', '/api/users', '/api/settings/system'];

      apiPaths.forEach((p) => {
        it(`should set no-cache for ${p}`, () => {
          mockRequest.path = p;
          cacheControl()(mockRequest as Request, mockResponse as Response, nextFunction);
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'Cache-Control',
            'no-cache, no-store, must-revalidate'
          );
        });
      });

      it('should also set Pragma: no-cache for private API routes', () => {
        mockRequest.path = '/api/posts';
        cacheControl()(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(mockResponse.setHeader).toHaveBeenCalledWith('Pragma', 'no-cache');
      });

      it('should also set Expires: 0 for private API routes', () => {
        mockRequest.path = '/api/posts';
        cacheControl()(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(mockResponse.setHeader).toHaveBeenCalledWith('Expires', '0');
      });
    });

    describe('non-GET methods', () => {
      const nonGetMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

      nonGetMethods.forEach((method) => {
        it(`should NOT set any cache headers for ${method}`, () => {
          mockRequest.method = method;
          mockRequest.path = '/uploads/test.jpg';
          cacheControl()(mockRequest as Request, mockResponse as Response, nextFunction);
          expect(mockResponse.setHeader).not.toHaveBeenCalled();
        });
      });

      it('should still call next() for non-GET requests', () => {
        mockRequest.method = 'POST';
        mockRequest.path = '/uploads/file.jpg';
        cacheControl()(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalled();
      });
    });
  });

  // ----------------------------------------------------------------
  // etagMiddleware
  // ----------------------------------------------------------------
  describe('etagMiddleware', () => {
    it('should set an ETag header for GET requests', () => {
      mockRequest.method = 'GET';
      etagMiddleware()(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'ETag',
        expect.stringMatching(/^W\/"/)
      );
    });

    it('ETag should be a weak validator (starts with W/")', () => {
      mockRequest.method = 'GET';
      etagMiddleware()(mockRequest as Request, mockResponse as Response, nextFunction);

      const call = (mockResponse.setHeader as jest.Mock).mock.calls.find(
        (c) => c[0] === 'ETag'
      );
      expect(call![1]).toMatch(/^W\//);
    });

    it('should call next() after setting ETag', () => {
      mockRequest.method = 'GET';
      etagMiddleware()(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should NOT set ETag for POST requests', () => {
      mockRequest.method = 'POST';
      etagMiddleware()(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(mockResponse.setHeader).not.toHaveBeenCalled();
    });

    it('should NOT set ETag for PUT requests', () => {
      mockRequest.method = 'PUT';
      etagMiddleware()(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(mockResponse.setHeader).not.toHaveBeenCalled();
    });

    it('should NOT set ETag for DELETE requests', () => {
      mockRequest.method = 'DELETE';
      etagMiddleware()(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(mockResponse.setHeader).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------------
  // compressionHints
  // ----------------------------------------------------------------
  describe('compressionHints', () => {
    const compressiblePaths = [
      '/js/admin.js',
      '/css/style.css',
      '/index.html',
      '/views/page.html',
      '/data/config.json',
      '/feed.xml',
      '/readme.txt',
    ];

    compressiblePaths.forEach((p) => {
      it(`should set Vary: Accept-Encoding for ${p}`, () => {
        mockRequest.path = p;
        compressionHints()(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(mockResponse.setHeader).toHaveBeenCalledWith('Vary', 'Accept-Encoding');
      });
    });

    it('should NOT set Vary for /api/ JSON endpoints (no extension match)', () => {
      mockRequest.path = '/api/posts';
      compressionHints()(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(mockResponse.setHeader).not.toHaveBeenCalled();
    });

    it('should NOT set Vary for paths without a known extension', () => {
      mockRequest.path = '/dashboard';
      compressionHints()(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(mockResponse.setHeader).not.toHaveBeenCalled();
    });

    it('should always call next()', () => {
      mockRequest.path = '/js/app.js';
      compressionHints()(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should call next() even for paths without compression hints', () => {
      mockRequest.path = '/api/users';
      compressionHints()(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });
  });
});
