/**
 * SSO Routes für Azure AD / Microsoft Entra ID und LDAP/Active Directory
 */

import { Router } from 'express';
import {
  getSSOStatus,
  initiateSSOLogin,
  handleSSOCallback,
  handleSSOLogout,
  handleLDAPLogin,
} from '../controllers/ssoController';
import {
  getSSOConfiguration,
  updateSSOConfiguration,
  testSSOConfiguration,
} from '../controllers/ssoAdminController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /auth/sso/status:
 *   get:
 *     summary: SSO Status und Konfiguration abrufen
 *     tags: [SSO]
 *     responses:
 *       200:
 *         description: SSO Status
 */
router.get('/status', getSSOStatus);

/**
 * @swagger
 * /auth/sso/login:
 *   get:
 *     summary: SSO Login initiieren (Azure AD)
 *     tags: [SSO]
 *     description: Leitet zu Azure AD Login-Seite weiter
 *     responses:
 *       302:
 *         description: Redirect zu Azure AD
 */
router.get('/login', initiateSSOLogin);

/**
 * @swagger
 * /auth/sso/ldap/login:
 *   post:
 *     summary: LDAP/Active Directory Login
 *     tags: [SSO]
 *     description: Authentifiziert Benutzer gegen Windows Server Active Directory (2016/2019/2022)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Active Directory Benutzername (sAMAccountName oder userPrincipalName)
 *               password:
 *                 type: string
 *                 description: Benutzer-Passwort
 *     responses:
 *       200:
 *         description: Login erfolgreich
 *       401:
 *         description: Authentifizierung fehlgeschlagen
 */
router.post('/ldap/login', handleLDAPLogin);

/**
 * @swagger
 * /auth/sso/callback:
 *   get:
 *     summary: SSO Callback Handler
 *     tags: [SSO]
 *     description: Verarbeitet die Antwort von Azure AD
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization Code von Azure AD
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State Parameter für CSRF-Schutz
 *     responses:
 *       302:
 *         description: Redirect zum Admin Dashboard mit Token
 */
router.get('/callback', handleSSOCallback);

/**
 * @swagger
 * /auth/sso/logout:
 *   get:
 *     summary: SSO Logout
 *     tags: [SSO]
 *     description: Meldet Benutzer bei Azure AD ab
 *     responses:
 *       302:
 *         description: Redirect zu Azure AD Logout
 */
router.get('/logout', handleSSOLogout);

// ============================================
// Admin-Routen (nur Super-Admin)
// ============================================

/**
 * @swagger
 * /auth/sso/config:
 *   get:
 *     summary: SSO-Konfiguration abrufen (nur Super-Admin)
 *     tags: [SSO Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SSO-Konfiguration
 *       403:
 *         description: Keine Berechtigung
 */
router.get('/config', authenticate, getSSOConfiguration);

/**
 * @swagger
 * /auth/sso/config:
 *   put:
 *     summary: SSO-Konfiguration aktualisieren (nur Super-Admin)
 *     tags: [SSO Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *               provider:
 *                 type: string
 *                 enum: [azure_ad, adfs, none]
 *               autoCreateUsers:
 *                 type: boolean
 *               defaultRole:
 *                 type: string
 *               allowedDomains:
 *                 type: array
 *                 items:
 *                   type: string
 *               azureAD:
 *                 type: object
 *     responses:
 *       200:
 *         description: Konfiguration aktualisiert
 *       403:
 *         description: Keine Berechtigung
 */
router.put('/config', authenticate, updateSSOConfiguration);

/**
 * @swagger
 * /auth/sso/test:
 *   post:
 *     summary: SSO-Konfiguration testen (nur Super-Admin)
 *     tags: [SSO Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Test-Ergebnis
 *       403:
 *         description: Keine Berechtigung
 */
router.post('/test', authenticate, testSSOConfiguration);

export default router;
