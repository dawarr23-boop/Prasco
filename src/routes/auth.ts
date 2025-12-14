import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validator';
import { authenticate } from '../middleware/auth';
import * as authController from '../controllers/authController';

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Neuen Benutzer registrieren
 *     description: Erstellt einen neuen Benutzer-Account mit der Standardrolle 'viewer'
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
 *                 format: email
 *                 example: user@prasco.net
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: securePassword123
 *               firstName:
 *                 type: string
 *                 example: Max
 *               lastName:
 *                 type: string
 *                 example: Mustermann
 *               organizationId:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *     responses:
 *       201:
 *         description: Registrierung erfolgreich
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Registrierung erfolgreich
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     refreshToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/RateLimitExceeded'
 *     security: []
 */
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Gültige E-Mail erforderlich'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Passwort muss mindestens 6 Zeichen lang sein'),
    body('firstName').notEmpty().withMessage('Vorname erforderlich'),
    body('lastName').notEmpty().withMessage('Nachname erforderlich'),
    validate,
  ],
  authController.register
);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Benutzer einloggen
 *     description: |
 *       Authentifiziert einen Benutzer und gibt Access- und Refresh-Token zurück.
 *       Rate Limit: 5 Versuche pro 15 Minuten.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@prasco.net
 *               password:
 *                 type: string
 *                 format: password
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login erfolgreich
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login erfolgreich
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                       description: JWT Access Token (1 Stunde gültig)
 *                     refreshToken:
 *                       type: string
 *                       description: JWT Refresh Token (7 Tage gültig)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Account deaktiviert
 *       429:
 *         $ref: '#/components/responses/RateLimitExceeded'
 *     security: []
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Gültige E-Mail erforderlich'),
    body('password').notEmpty().withMessage('Passwort erforderlich'),
    validate,
  ],
  authController.login
);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Access Token erneuern
 *     description: Generiert einen neuen Access Token mit einem gültigen Refresh Token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token erfolgreich erneuert
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Token erfolgreich erneuert
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *     security: []
 */
router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('Refresh-Token erforderlich'), validate],
  authController.refresh
);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Benutzer ausloggen
 *     description: Beendet die Benutzersitzung (clientseitiges Token-Löschen)
 *     responses:
 *       200:
 *         description: Erfolgreich ausgeloggt
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *     security: []
 */
router.post('/logout', authController.logout);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Aktuellen Benutzer abrufen
 *     description: Gibt die Daten des aktuell eingeloggten Benutzers zurück
 *     responses:
 *       200:
 *         description: Benutzerdaten erfolgreich abgerufen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', authenticate, authController.me);

export default router;
