import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { User } from '../models';
import { securityLogger } from '../utils/logger';

/**
 * Middleware to check if authenticated user has required permission
 * Usage: requirePermission('posts.create')
 * Usage: requirePermission(['posts.create', 'posts.update']) // User needs ANY of these
 */
export const requirePermission = (permissions: string | string[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        throw new AppError('Authentifizierung erforderlich', 401);
      }

      // Get full user object with permissions
      const user = await User.findByPk(req.user.id);
      if (!user) {
        throw new AppError('Benutzer nicht gefunden', 404);
      }

      // Convert single permission to array
      const permissionArray = Array.isArray(permissions) ? permissions : [permissions];

      // Check if user has any of the required permissions
      const hasPermission = await user.hasAnyPermission(permissionArray);

      if (!hasPermission) {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        console.log(`[DEBUG] Permission denied for user ${user.email} (${user.role}) - Required: ${permissionArray.join(', ')}`);
        securityLogger.logPermissionDenied(
          user.id,
          user.email,
          permissionArray.join(', '),
          req.path,
          ip
        );
        throw new AppError('Keine Berechtigung für diese Aktion', 403);
      }

      console.log(`[DEBUG] Permission granted for user ${user.email} (${user.role}) - Permission: ${permissionArray.join(', ')}`);

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has ALL required permissions
 * Usage: requireAllPermissions(['posts.create', 'categories.manage'])
 */
export const requireAllPermissions = (permissions: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentifizierung erforderlich', 401);
      }

      const user = await User.findByPk(req.user.id);
      if (!user) {
        throw new AppError('Benutzer nicht gefunden', 404);
      }

      const hasAllPermissions = await user.hasAllPermissions(permissions);

      if (!hasAllPermissions) {
        throw new AppError('Nicht alle erforderlichen Berechtigungen vorhanden', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user is super admin
 */
export const requireSuperAdmin = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentifizierung erforderlich', 401);
    }

    if (req.user.role !== 'super_admin') {
      throw new AppError('Nur Super-Administratoren haben Zugriff', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check permission for specific resource and action
 * Usage: requireResourcePermission('posts', 'create')
 */
export const requireResourcePermission = (resource: string, action: string) => {
  const permissionName = `${resource}.${action}`;
  return requirePermission(permissionName);
};
