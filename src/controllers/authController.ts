import { Request, Response } from 'express';
import { User } from '../models';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { logger, securityLogger } from '../utils/logger';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, organizationId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('E-Mail bereits registriert', 400);
    }

    // Create user
    const user = await User.create({
      email,
      password, // Will be hashed by beforeCreate hook
      firstName,
      lastName,
      role: 'viewer', // Default role
      organizationId: organizationId || null,
      isActive: true,
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    });

    logger.info(`User registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Registrierung erfolgreich',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.organizationId,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('Registration error:', error);
    throw new AppError('Fehler bei der Registrierung', 500);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      securityLogger.logFailedLogin(email, ip);
      throw new AppError('Ungültige E-Mail oder Passwort', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      securityLogger.logSuspiciousActivity('Login attempt on deactivated account', ip, { email });
      throw new AppError('Account deaktiviert. Bitte kontaktieren Sie den Administrator.', 403);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      securityLogger.logFailedLogin(email, ip);
      throw new AppError('Ungültige E-Mail oder Passwort', 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    });

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    logger.info(`User logged in: ${email}`);
    securityLogger.logSuccessfulLogin(user.id, email, ip);

    res.status(200).json({
      success: true,
      message: 'Login erfolgreich',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.organizationId,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('Login error:', error);
    throw new AppError('Fehler beim Login', 500);
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh-Token fehlt', 400);
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      throw new AppError('Ungültiger Token oder User nicht gefunden', 401);
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    });

    const newRefreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    });

    res.status(200).json({
      success: true,
      message: 'Token erfolgreich erneuert',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('Token refresh error:', error);
    throw new AppError('Ungültiger oder abgelaufener Refresh-Token', 401);
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = async (_req: Request, res: Response): Promise<void> => {
  // In JWT-based auth, logout is handled client-side by removing tokens
  // Optional: Add token to blacklist in Redis for extra security

  res.status(200).json({
    success: true,
    message: 'Logout erfolgreich',
  });
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as { user?: { userId: number } };
    const user = authReq.user; // From auth middleware

    if (!user) {
      throw new AppError('Nicht authentifiziert', 401);
    }

    const dbUser = await User.findByPk(user.userId, {
      attributes: { exclude: ['password'] },
    });

    if (!dbUser) {
      throw new AppError('User nicht gefunden', 404);
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          role: dbUser.role,
          organizationId: dbUser.organizationId,
          isActive: dbUser.isActive,
          lastLogin: dbUser.lastLogin,
        },
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('Get profile error:', error);
    throw new AppError('Fehler beim Abrufen des Profils', 500);
  }
};

export default {
  register,
  login,
  refresh,
  logout,
  me,
};
