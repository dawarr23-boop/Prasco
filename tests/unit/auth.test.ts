import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../src/middleware/auth';
import { AppError } from '../../src/middleware/errorHandler';
import * as jwt from '../../src/utils/jwt';

// Mock jwt utils
jest.mock('../../src/utils/jwt');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      ip: '127.0.0.1',
      path: '/test',
      method: 'GET',
      socket: { remoteAddress: '127.0.0.1' } as any,
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should fail without authorization header', async () => {
      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Kein Token gefunden. Authentifizierung erforderlich.',
          statusCode: 401,
        })
      );
    });

    it('should fail with invalid authorization format', async () => {
      mockRequest.headers = { authorization: 'InvalidFormat token123' };

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
        })
      );
    });

    it('should pass with valid token', async () => {
      const mockPayload = {
        userId: 1,
        email: 'test@test.com',
        role: 'admin',
        organizationId: 1,
      };

      (jwt.verifyAccessToken as jest.Mock).mockReturnValue(mockPayload);
      mockRequest.headers = { authorization: 'Bearer validtoken123' };

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect((mockRequest as any).user).toEqual(mockPayload);
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should fail with expired token', async () => {
      (jwt.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token expired');
      });
      mockRequest.headers = { authorization: 'Bearer expiredtoken' };

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
        })
      );
    });
  });

  describe('authorize', () => {
    it('should fail without user', () => {
      const middleware = authorize('admin');

      expect(() => {
        middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      }).toThrow(AppError);
    });

    it('should fail with insufficient role', () => {
      (mockRequest as any).user = { role: 'viewer' };
      const middleware = authorize('admin', 'super_admin');

      expect(() => {
        middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      }).toThrow(AppError);
    });

    it('should pass with correct role', () => {
      (mockRequest as any).user = { role: 'admin' };
      const middleware = authorize('admin', 'super_admin');

      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });
  });
});
