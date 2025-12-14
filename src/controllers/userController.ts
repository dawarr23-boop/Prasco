import { Request, Response, NextFunction } from 'express';
import { User, Organization } from '../models';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';

/**
 * Get all users
 * GET /api/users
 */
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = '1', limit = '20', search, role, isActive } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};

    // Filter by organization for non-super_admins
    if (req.user!.role !== 'super_admin' && req.user!.organizationId) {
      where.organizationId = req.user!.organizationId;
    }

    // Hide super_admin users and specific hidden accounts from non-super_admins
    const hiddenEmails = ['cpoeser@prasco.de'];
    if (req.user!.role !== 'super_admin') {
      where.role = { [Op.ne]: 'super_admin' };
      // Also hide specific accounts (unless it's the user themselves)
      if (!hiddenEmails.includes(req.user!.email)) {
        where.email = { [Op.notIn]: hiddenEmails };
      }
    }

    // Search filter
    if (search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Role filter (but never allow non-super_admins to see super_admins)
    if (role) {
      if (req.user!.role !== 'super_admin' && role === 'super_admin') {
        // Non-super_admins cannot filter for super_admins
        where.role = { [Op.ne]: 'super_admin' };
      } else if (req.user!.role !== 'super_admin') {
        // Combine role filter with super_admin exclusion
        where.role = { [Op.and]: [{ [Op.eq]: role }, { [Op.ne]: 'super_admin' }] };
      } else {
        where.role = role;
      }
    }

    // Active filter
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    res.json({
      success: true,
      data: users,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single user by ID
 * GET /api/users/:id
 */
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    if (!user) {
      throw new AppError('Benutzer nicht gefunden', 404);
    }

    // Hide super_admin and specific hidden accounts from non-super_admins
    const hiddenEmails = ['cpoeser@prasco.de'];
    if (req.user!.role !== 'super_admin') {
      if (user.role === 'super_admin') {
        throw new AppError('Benutzer nicht gefunden', 404);
      }
      // Hide specific accounts (unless it's the user themselves)
      if (hiddenEmails.includes(user.email) && req.user!.email !== user.email) {
        throw new AppError('Benutzer nicht gefunden', 404);
      }
    }

    // Check organization access
    if (
      req.user!.role !== 'super_admin' &&
      req.user!.organizationId &&
      user.organizationId !== req.user!.organizationId
    ) {
      throw new AppError('Keine Berechtigung für diesen Benutzer', 403);
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new user
 * POST /api/users
 */
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, firstName, lastName, role, organizationId, isActive } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('E-Mail-Adresse bereits vergeben', 400);
    }

    // Determine organization
    let finalOrgId = organizationId;
    if (req.user!.role !== 'super_admin') {
      // Non-super_admins can only create users in their own organization
      finalOrgId = req.user!.organizationId;
    }

    // Role restrictions
    const allowedRoles = getAllowedRolesForUser(req.user!.role);
    if (!allowedRoles.includes(role)) {
      throw new AppError(`Keine Berechtigung, Rolle "${role}" zu vergeben`, 403);
    }

    const user = await User.create({
      email,
      password, // Will be hashed by beforeCreate hook
      firstName,
      lastName,
      role: role || 'viewer',
      organizationId: finalOrgId,
      isActive: isActive !== false,
    });

    logger.info(`User created: ${email} by ${req.user!.email}`);

    // Return user without password
    const userResponse = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Benutzer erfolgreich erstellt',
      data: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 * PUT /api/users/:id
 */
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, password, firstName, lastName, role, organizationId, isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('Benutzer nicht gefunden', 404);
    }

    // Hide super_admin and hidden accounts from non-super_admins
    const hiddenEmails = ['cpoeser@prasco.de'];
    if (req.user!.role !== 'super_admin') {
      if (user.role === 'super_admin') {
        throw new AppError('Benutzer nicht gefunden', 404);
      }
      if (hiddenEmails.includes(user.email) && req.user!.email !== user.email) {
        throw new AppError('Benutzer nicht gefunden', 404);
      }
    }

    // Check organization access
    if (
      req.user!.role !== 'super_admin' &&
      req.user!.organizationId &&
      user.organizationId !== req.user!.organizationId
    ) {
      throw new AppError('Keine Berechtigung für diesen Benutzer', 403);
    }

    // Prevent self-demotion for admins
    if (user.id === req.user!.id && role && role !== user.role) {
      throw new AppError('Sie können Ihre eigene Rolle nicht ändern', 400);
    }

    // Prevent deactivating yourself
    if (user.id === req.user!.id && isActive === false) {
      throw new AppError('Sie können sich nicht selbst deaktivieren', 400);
    }

    // Check email uniqueness if changed
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw new AppError('E-Mail-Adresse bereits vergeben', 400);
      }
    }

    // Role restrictions
    if (role && role !== user.role) {
      const allowedRoles = getAllowedRolesForUser(req.user!.role);
      if (!allowedRoles.includes(role)) {
        throw new AppError(`Keine Berechtigung, Rolle "${role}" zu vergeben`, 403);
      }
    }

    // Update fields
    if (email) user.email = email;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    // Only super_admin can change organization
    if (req.user!.role === 'super_admin' && organizationId !== undefined) {
      user.organizationId = organizationId;
    }

    // Update password if provided
    if (password) {
      user.password = password; // Will be hashed by beforeUpdate hook
    }

    await user.save();

    logger.info(`User updated: ${user.email} by ${req.user!.email}`);

    // Return updated user without password
    const userResponse = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    res.json({
      success: true,
      message: 'Benutzer erfolgreich aktualisiert',
      data: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 * DELETE /api/users/:id
 */
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('Benutzer nicht gefunden', 404);
    }

    // Hide super_admin and hidden accounts from non-super_admins (return 404 to hide existence)
    const hiddenEmails = ['cpoeser@prasco.de'];
    if (req.user!.role !== 'super_admin') {
      if (user.role === 'super_admin') {
        throw new AppError('Benutzer nicht gefunden', 404);
      }
      if (hiddenEmails.includes(user.email) && req.user!.email !== user.email) {
        throw new AppError('Benutzer nicht gefunden', 404);
      }
    }

    // Prevent self-deletion
    if (user.id === req.user!.id) {
      throw new AppError('Sie können sich nicht selbst löschen', 400);
    }

    // Check organization access
    if (
      req.user!.role !== 'super_admin' &&
      req.user!.organizationId &&
      user.organizationId !== req.user!.organizationId
    ) {
      throw new AppError('Keine Berechtigung für diesen Benutzer', 403);
    }

    const email = user.email;
    await user.destroy();

    logger.info(`User deleted: ${email} by ${req.user!.email}`);

    res.json({
      success: true,
      message: 'Benutzer erfolgreich gelöscht',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle user active status
 * PATCH /api/users/:id/toggle-active
 */
export const toggleUserActive = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('Benutzer nicht gefunden', 404);
    }

    // Hide super_admin and hidden accounts from non-super_admins
    const hiddenEmails = ['cpoeser@prasco.de'];
    if (req.user!.role !== 'super_admin') {
      if (user.role === 'super_admin') {
        throw new AppError('Benutzer nicht gefunden', 404);
      }
      if (hiddenEmails.includes(user.email) && req.user!.email !== user.email) {
        throw new AppError('Benutzer nicht gefunden', 404);
      }
    }

    // Prevent self-deactivation
    if (user.id === req.user!.id) {
      throw new AppError('Sie können sich nicht selbst deaktivieren', 400);
    }

    // Check organization access
    if (
      req.user!.role !== 'super_admin' &&
      req.user!.organizationId &&
      user.organizationId !== req.user!.organizationId
    ) {
      throw new AppError('Keine Berechtigung für diesen Benutzer', 403);
    }

    user.isActive = !user.isActive;
    await user.save();

    logger.info(
      `User ${user.isActive ? 'activated' : 'deactivated'}: ${user.email} by ${req.user!.email}`
    );

    res.json({
      success: true,
      message: user.isActive ? 'Benutzer aktiviert' : 'Benutzer deaktiviert',
      data: { isActive: user.isActive },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset user password (admin function)
 * PATCH /api/users/:id/reset-password
 *
 * Berechtigungen:
 * - Super Admin: kann alle Passwörter zurücksetzen
 * - Admin: kann nur Passwörter von Editors, Viewers und Displays zurücksetzen
 * - Editor: kann nur eigenes Passwort ändern (über /change-password)
 */
export const resetUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      throw new AppError('Passwort muss mindestens 6 Zeichen haben', 400);
    }

    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('Benutzer nicht gefunden', 404);
    }

    // Hide super_admin and hidden accounts from non-super_admins
    const hiddenEmails = ['cpoeser@prasco.de'];
    if (req.user!.role !== 'super_admin') {
      if (user.role === 'super_admin') {
        throw new AppError('Benutzer nicht gefunden', 404);
      }
      if (hiddenEmails.includes(user.email) && req.user!.email !== user.email) {
        throw new AppError('Benutzer nicht gefunden', 404);
      }
    }

    // Check organization access
    if (
      req.user!.role !== 'super_admin' &&
      req.user!.organizationId &&
      user.organizationId !== req.user!.organizationId
    ) {
      throw new AppError('Keine Berechtigung für diesen Benutzer', 403);
    }

    // Prüfe rollenbasierte Berechtigung für Passwort-Reset
    if (
      !canResetPasswordFor(
        { role: req.user!.role, id: req.user!.id },
        { role: user.role, id: user.id }
      )
    ) {
      throw new AppError('Keine Berechtigung, das Passwort dieses Benutzers zurückzusetzen', 403);
    }

    user.password = newPassword; // Will be hashed by beforeUpdate hook
    await user.save();

    logger.info(`Password reset for user: ${user.email} by ${req.user!.email}`);

    res.json({
      success: true,
      message: 'Passwort erfolgreich zurückgesetzt',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change own password
 * PATCH /api/users/change-password
 *
 * Alle Benutzer können ihr eigenes Passwort ändern
 */
export const changeOwnPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword) {
      throw new AppError('Aktuelles Passwort erforderlich', 400);
    }

    if (!newPassword || newPassword.length < 6) {
      throw new AppError('Neues Passwort muss mindestens 6 Zeichen haben', 400);
    }

    const user = await User.findByPk(req.user!.id);
    if (!user) {
      throw new AppError('Benutzer nicht gefunden', 404);
    }

    // Prüfe aktuelles Passwort
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AppError('Aktuelles Passwort ist falsch', 401);
    }

    user.password = newPassword; // Will be hashed by beforeUpdate hook
    await user.save();

    logger.info(`Password changed by user: ${user.email}`);

    res.json({
      success: true,
      message: 'Passwort erfolgreich geändert',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available roles for dropdown
 * GET /api/users/roles
 */
export const getAvailableRoles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const roles = getAllowedRolesForUser(req.user!.role);

    const roleLabels: Record<string, string> = {
      super_admin: 'Super Admin',
      admin: 'Administrator',
      editor: 'Editor',
      viewer: 'Betrachter',
      display: 'Display',
    };

    const rolesWithLabels = roles.map((role) => ({
      value: role,
      label: roleLabels[role] || role,
    }));

    res.json({
      success: true,
      data: rolesWithLabels,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper: Get allowed roles based on current user's role
 * Super Admin: kann alle Rollen erstellen
 * Admin: kann nur Editors, Viewers und Displays erstellen (keine Admins)
 * Editor: kann keine Benutzer erstellen
 */
function getAllowedRolesForUser(currentRole: string): string[] {
  switch (currentRole) {
    case 'super_admin':
      return ['super_admin', 'admin', 'editor', 'viewer', 'display'];
    case 'admin':
      // Admin kann KEINE Admins oder Super-Admins erstellen
      return ['editor', 'viewer', 'display'];
    default:
      return [];
  }
}

/**
 * Helper: Check if user can reset password for target user
 * Super Admin: kann alle Passwörter zurücksetzen
 * Admin: kann nur Passwörter von Editors, Viewers und Displays zurücksetzen + eigenes
 * Editor: kann nur eigenes Passwort ändern
 */
function canResetPasswordFor(
  currentUser: { role: string; id: number },
  targetUser: { role: string; id: number }
): boolean {
  // Eigenes Passwort kann jeder ändern
  if (currentUser.id === targetUser.id) {
    return true;
  }

  switch (currentUser.role) {
    case 'super_admin':
      return true; // Kann alle Passwörter zurücksetzen
    case 'admin':
      // Admin kann nur untergeordnete Rollen zurücksetzen
      return ['editor', 'viewer', 'display'].includes(targetUser.role);
    default:
      return false; // Editors können nur ihr eigenes Passwort ändern
  }
}
