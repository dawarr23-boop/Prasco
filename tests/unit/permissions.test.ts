import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../src/middleware/errorHandler';

// Mock models
jest.mock('../../src/models', () => ({
  User: {
    findByPk: jest.fn(),
  },
}));

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  securityLogger: {
    logPermissionDenied: jest.fn(),
    logFailedLogin: jest.fn(),
    logSuccessfulLogin: jest.fn(),
    logRateLimitHit: jest.fn(),
    logSuspiciousActivity: jest.fn(),
  },
}));

import {
  requirePermission,
  requireAllPermissions,
  requireSuperAdmin,
  requireResourcePermission,
} from '../../src/middleware/permissions';
import { User } from '../../src/models';
import { securityLogger } from '../../src/utils/logger';

describe('Permissions Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  const makeUser = (overrides = {}) => ({
    id: 1,
    email: 'user@test.com',
    role: 'admin',
    hasAnyPermission: jest.fn().mockResolvedValue(true),
    hasAllPermissions: jest.fn().mockResolvedValue(true),
    ...overrides,
  });

  beforeEach(() => {
    mockRequest = {
      ip: '127.0.0.1',
      path: '/api/posts',
      method: 'POST',
      socket: { remoteAddress: '127.0.0.1' } as any,
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  // ----------------------------------------------------------------
  // requirePermission
  // ----------------------------------------------------------------
  describe('requirePermission', () => {
    it('should call next(AppError 401) when no user is attached to request', async () => {
      const middleware = requirePermission('posts.create');
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });

    it('should call next(AppError 404) when user id does not exist in DB', async () => {
      (mockRequest as any).user = { id: 99, email: 'ghost@test.com', role: 'admin' };
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const middleware = requirePermission('posts.create');
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 })
      );
    });

    it('should call next(AppError 403) when user lacks the required permission', async () => {
      (mockRequest as any).user = { id: 1, email: 'viewer@test.com', role: 'viewer' };
      (User.findByPk as jest.Mock).mockResolvedValue(
        makeUser({ role: 'viewer', hasAnyPermission: jest.fn().mockResolvedValue(false) })
      );

      const middleware = requirePermission('posts.create');
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403 })
      );
    });

    it('should call next() without error when user has the permission', async () => {
      (mockRequest as any).user = { id: 1, email: 'admin@test.com', role: 'admin' };
      (User.findByPk as jest.Mock).mockResolvedValue(makeUser());

      const middleware = requirePermission('posts.create');
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(/* no args */);
    });

    it('should pass a single permission as an array to hasAnyPermission', async () => {
      (mockRequest as any).user = { id: 1, email: 'admin@test.com', role: 'admin' };
      const mockUser = makeUser();
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const middleware = requirePermission('posts.create');
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockUser.hasAnyPermission).toHaveBeenCalledWith(['posts.create']);
    });

    it('should accept an array of permissions (ANY match)', async () => {
      (mockRequest as any).user = { id: 1, email: 'admin@test.com', role: 'admin' };
      const mockUser = makeUser();
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const middleware = requirePermission(['posts.create', 'posts.update']);
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockUser.hasAnyPermission).toHaveBeenCalledWith(['posts.create', 'posts.update']);
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should log a security event when permission is denied', async () => {
      (mockRequest as any).user = { id: 1, email: 'viewer@test.com', role: 'viewer' };
      (User.findByPk as jest.Mock).mockResolvedValue(
        makeUser({ role: 'viewer', hasAnyPermission: jest.fn().mockResolvedValue(false) })
      );

      const middleware = requirePermission('posts.delete');
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(securityLogger.logPermissionDenied).toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------------
  // requireAllPermissions
  // ----------------------------------------------------------------
  describe('requireAllPermissions', () => {
    it('should call next(AppError 401) when no user is attached', async () => {
      const middleware = requireAllPermissions(['posts.create', 'categories.manage']);
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });

    it('should call next(AppError 404) when user not found in DB', async () => {
      (mockRequest as any).user = { id: 99, email: 'ghost@test.com', role: 'admin' };
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const middleware = requireAllPermissions(['posts.create']);
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 })
      );
    });

    it('should call next(AppError 403) when user is missing at least one permission', async () => {
      (mockRequest as any).user = { id: 1, email: 'editor@test.com', role: 'editor' };
      (User.findByPk as jest.Mock).mockResolvedValue(
        makeUser({ hasAllPermissions: jest.fn().mockResolvedValue(false) })
      );

      const middleware = requireAllPermissions(['posts.create', 'categories.manage']);
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403 })
      );
    });

    it('should call next() when user has ALL required permissions', async () => {
      (mockRequest as any).user = { id: 1, email: 'admin@test.com', role: 'admin' };
      (User.findByPk as jest.Mock).mockResolvedValue(makeUser());

      const middleware = requireAllPermissions(['posts.create', 'categories.manage']);
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should call hasAllPermissions with the full permission list', async () => {
      (mockRequest as any).user = { id: 1, email: 'admin@test.com', role: 'admin' };
      const mockUser = makeUser();
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const perms = ['posts.create', 'users.manage', 'settings.edit'];
      const middleware = requireAllPermissions(perms);
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockUser.hasAllPermissions).toHaveBeenCalledWith(perms);
    });
  });

  // ----------------------------------------------------------------
  // requireSuperAdmin
  // ----------------------------------------------------------------
  describe('requireSuperAdmin', () => {
    it('should call next(AppError 401) when no user is attached', async () => {
      await requireSuperAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });

    it('should call next(AppError 403) for role "admin"', async () => {
      (mockRequest as any).user = { id: 1, role: 'admin' };

      await requireSuperAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403 })
      );
    });

    it('should call next(AppError 403) for role "editor"', async () => {
      (mockRequest as any).user = { id: 2, role: 'editor' };

      await requireSuperAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403 })
      );
    });

    it('should call next(AppError 403) for role "viewer"', async () => {
      (mockRequest as any).user = { id: 3, role: 'viewer' };

      await requireSuperAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403 })
      );
    });

    it('should call next() without error for role "super_admin"', async () => {
      (mockRequest as any).user = { id: 1, role: 'super_admin' };

      await requireSuperAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
    });
  });

  // ----------------------------------------------------------------
  // requireResourcePermission
  // ----------------------------------------------------------------
  describe('requireResourcePermission', () => {
    it('should compose the permission as "resource.action"', async () => {
      (mockRequest as any).user = { id: 1, email: 'admin@test.com', role: 'admin' };
      const mockUser = makeUser();
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const middleware = requireResourcePermission('posts', 'delete');
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockUser.hasAnyPermission).toHaveBeenCalledWith(['posts.delete']);
    });

    it('should compose different resource/action combinations correctly', async () => {
      (mockRequest as any).user = { id: 1, email: 'admin@test.com', role: 'admin' };
      const mockUser = makeUser();
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const middleware = requireResourcePermission('users', 'manage');
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockUser.hasAnyPermission).toHaveBeenCalledWith(['users.manage']);
    });

    it('should deny access (403) when composed permission is missing', async () => {
      (mockRequest as any).user = { id: 1, email: 'viewer@test.com', role: 'viewer' };
      (User.findByPk as jest.Mock).mockResolvedValue(
        makeUser({ hasAnyPermission: jest.fn().mockResolvedValue(false) })
      );

      const middleware = requireResourcePermission('settings', 'edit');
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403 })
      );
    });
  });

  // ----------------------------------------------------------------
  // AppError contracts
  // ----------------------------------------------------------------
  describe('AppError thrown by permissions', () => {
    it('AppError should carry isOperational=true', async () => {
      (mockRequest as any).user = { id: 1, role: 'admin' };
      (User.findByPk as jest.Mock).mockResolvedValue(
        makeUser({ hasAnyPermission: jest.fn().mockResolvedValue(false) })
      );

      const middleware = requirePermission('posts.create');
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      const err = (nextFunction as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.isOperational).toBe(true);
    });
  });
});
