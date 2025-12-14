import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserActive,
  resetUserPassword,
  changeOwnPassword,
  getAvailableRoles,
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { validate } from '../middleware/validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         email:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         role:
 *           type: string
 *           enum: [super_admin, admin, editor, viewer, display]
 *         organizationId:
 *           type: integer
 *         isActive:
 *           type: boolean
 *         lastLogin:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/users/roles:
 *   get:
 *     summary: Get available roles for current user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available roles
 */
router.get('/roles', requirePermission('users.read'), getAvailableRoles);

/**
 * @swagger
 * /api/users/change-password:
 *   patch:
 *     summary: Change own password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 description: New password (min 6 characters)
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Current password is incorrect
 */
router.patch(
  '/change-password',
  [
    body('currentPassword').notEmpty().withMessage('Aktuelles Passwort erforderlich'),
    body('newPassword').isLength({ min: 6 }).withMessage('Neues Passwort min. 6 Zeichen'),
    validate,
  ],
  changeOwnPassword
);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by email, firstName or lastName
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of users
 */
router.get(
  '/',
  requirePermission('users.read'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString(),
    query('role').optional().isIn(['super_admin', 'admin', 'editor', 'viewer', 'display']),
    query('isActive').optional().isBoolean(),
    validate,
  ],
  getAllUsers
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get(
  '/:id',
  requirePermission('users.read'),
  [param('id').isInt({ min: 1 }), validate],
  getUserById
);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *               organizationId:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: User created
 */
router.post(
  '/',
  requirePermission('users.create'),
  [
    body('email').isEmail().withMessage('Gültige E-Mail erforderlich'),
    body('password').isLength({ min: 6 }).withMessage('Passwort min. 6 Zeichen'),
    body('firstName').notEmpty().withMessage('Vorname erforderlich'),
    body('lastName').notEmpty().withMessage('Nachname erforderlich'),
    body('role').optional().isIn(['super_admin', 'admin', 'editor', 'viewer', 'display']),
    body('organizationId').optional().isInt({ min: 1 }),
    body('isActive').optional().isBoolean(),
    validate,
  ],
  createUser
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated
 */
router.put(
  '/:id',
  requirePermission('users.update'),
  [
    param('id').isInt({ min: 1 }),
    body('email').optional().isEmail().withMessage('Gültige E-Mail erforderlich'),
    body('password').optional().isLength({ min: 6 }).withMessage('Passwort min. 6 Zeichen'),
    body('firstName').optional().notEmpty(),
    body('lastName').optional().notEmpty(),
    body('role').optional().isIn(['super_admin', 'admin', 'editor', 'viewer', 'display']),
    body('organizationId').optional().isInt({ min: 1 }),
    body('isActive').optional().isBoolean(),
    validate,
  ],
  updateUser
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete(
  '/:id',
  requirePermission('users.delete'),
  [param('id').isInt({ min: 1 }), validate],
  deleteUser
);

/**
 * @swagger
 * /api/users/{id}/toggle-active:
 *   patch:
 *     summary: Toggle user active status
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Status toggled
 */
router.patch(
  '/:id/toggle-active',
  requirePermission('users.update'),
  [param('id').isInt({ min: 1 }), validate],
  toggleUserActive
);

/**
 * @swagger
 * /api/users/{id}/reset-password:
 *   patch:
 *     summary: Reset user password (admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset
 */
router.patch(
  '/:id/reset-password',
  requirePermission('users.update'),
  [
    param('id').isInt({ min: 1 }),
    body('newPassword').isLength({ min: 6 }).withMessage('Passwort min. 6 Zeichen'),
    validate,
  ],
  resetUserPassword
);

export default router;
