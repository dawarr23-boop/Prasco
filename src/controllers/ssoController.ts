/**
 * SSO Controller für Azure AD / Microsoft Entra ID und LDAP/Active Directory Authentication
 */

import { Request, Response } from 'express';
import {
  CryptoProvider,
  AuthorizationCodeRequest,
  AuthorizationUrlRequest,
} from '@azure/msal-node';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { loadSSOConfig, createMSALClient, validateSSOConfig } from '../config/sso';
import { createLDAPService } from '../services/ldapService';
import logger from '../utils/logger';

// PKCE Code Verifier Store (in production: use Redis)
const codeVerifierStore = new Map<string, { verifier: string; timestamp: number }>();

// Cleanup alte Verifiers (alle 5 Minuten)
setInterval(
  () => {
    const now = Date.now();
    for (const [state, data] of codeVerifierStore.entries()) {
      if (now - data.timestamp > 10 * 60 * 1000) {
        // 10 Minuten
        codeVerifierStore.delete(state);
      }
    }
  },
  5 * 60 * 1000
);

/**
 * Prüft SSO Status und Konfiguration
 */
export async function getSSOStatus(_req: Request, res: Response) {
  try {
    const config = loadSSOConfig();
    const validation = validateSSOConfig(config);

    res.json({
      success: true,
      data: {
        enabled: config.enabled,
        provider: config.provider,
        configured: validation.valid,
        autoCreateUsers: config.autoCreateUsers,
        allowedDomains: config.allowedDomains,
        errors: config.enabled ? validation.errors : [],
      },
    });
  } catch (error: unknown) {
    logger.error('SSO Status Fehler:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Fehler beim Abrufen des SSO-Status' },
    });
  }
}

/**
 * Initiiert den SSO Login Flow
 * Redirect zu Azure AD Login-Seite
 */
export async function initiateSSOLogin(_req: Request, res: Response): Promise<void> {
  try {
    const config = loadSSOConfig();

    if (!config.enabled || config.provider !== 'azure_ad' || !config.azureAD) {
      res.status(400).json({
        success: false,
        error: { message: 'SSO ist nicht aktiviert oder nicht konfiguriert' },
      });
      return;
    }

    const validation = validateSSOConfig(config);
    if (!validation.valid) {
      logger.error('SSO Konfigurationsfehler:', validation.errors);
      res.status(500).json({
        success: false,
        error: { message: 'SSO ist nicht korrekt konfiguriert' },
      });
      return;
    }

    const msalClient = createMSALClient(config.azureAD);
    const cryptoProvider = new CryptoProvider();

    // Generate PKCE codes
    const { verifier, challenge } = await cryptoProvider.generatePkceCodes();

    // Generate state for CSRF protection
    const state = cryptoProvider.createNewGuid();

    // Store verifier for callback
    codeVerifierStore.set(state, {
      verifier,
      timestamp: Date.now(),
    });

    const authUrlRequest: AuthorizationUrlRequest = {
      scopes: config.azureAD.scopes,
      redirectUri: config.azureAD.redirectUri,
      codeChallenge: challenge,
      codeChallengeMethod: 'S256',
      state,
      prompt: 'select_account', // Immer Kontowahl anzeigen
    };

    const authUrl = await msalClient.getAuthCodeUrl(authUrlRequest);

    logger.info(`SSO Login initiiert für State: ${state.substring(0, 8)}...`);

    // Redirect zur Azure AD Login-Seite
    res.redirect(authUrl);
  } catch (error: unknown) {
    logger.error('SSO Login Initiierung Fehler:', error);
    res.redirect('/admin?error=sso_init_failed');
  }
}

/**
 * Callback Handler für Azure AD
 * Verarbeitet die Antwort von Azure AD nach erfolgreichem Login
 */
export async function handleSSOCallback(req: Request, res: Response) {
  try {
    const { code, state, error, error_description } = req.query;

    // Handle Azure AD errors
    if (error) {
      logger.error('Azure AD Fehler:', { error, error_description });
      return res.redirect(
        `/admin?error=sso_denied&message=${encodeURIComponent(String(error_description || error))}`
      );
    }

    if (!code || !state) {
      return res.redirect('/admin?error=sso_invalid_response');
    }

    const config = loadSSOConfig();
    if (!config.azureAD) {
      return res.redirect('/admin?error=sso_not_configured');
    }

    // Retrieve stored verifier
    const storedData = codeVerifierStore.get(String(state));
    if (!storedData) {
      logger.warn('SSO State nicht gefunden oder abgelaufen');
      return res.redirect('/admin?error=sso_state_expired');
    }
    codeVerifierStore.delete(String(state));

    const msalClient = createMSALClient(config.azureAD);

    // Exchange code for tokens
    const tokenRequest: AuthorizationCodeRequest = {
      code: String(code),
      scopes: config.azureAD.scopes,
      redirectUri: config.azureAD.redirectUri,
      codeVerifier: storedData.verifier,
    };

    const response = await msalClient.acquireTokenByCode(tokenRequest);

    if (!response || !response.account) {
      logger.error('SSO Token Response ungültig');
      return res.redirect('/admin?error=sso_token_failed');
    }

    // Extrahiere Benutzerinformationen
    const { account, idTokenClaims } = response;
    const email = account.username?.toLowerCase() || (idTokenClaims as any)?.email?.toLowerCase();
    const firstName = (idTokenClaims as any)?.given_name || account.name?.split(' ')[0] || 'SSO';
    const lastName =
      (idTokenClaims as any)?.family_name || account.name?.split(' ').slice(1).join(' ') || 'User';
    const azureAdId = account.homeAccountId || account.localAccountId;

    if (!email) {
      logger.error('SSO: Keine E-Mail in Token gefunden');
      return res.redirect('/admin?error=sso_no_email');
    }

    // Prüfe erlaubte Domains
    if (config.allowedDomains.length > 0) {
      const emailDomain = email.split('@')[1];
      if (!config.allowedDomains.includes(emailDomain)) {
        logger.warn(`SSO: Domain nicht erlaubt: ${emailDomain}`);
        return res.redirect('/admin?error=sso_domain_not_allowed');
      }
    }

    // Finde oder erstelle Benutzer
    let user = await User.findOne({ where: { email } });

    if (!user) {
      // Versuche über Azure AD ID zu finden
      user = await User.findOne({ where: { azureAdId } });
    }

    if (!user) {
      if (!config.autoCreateUsers) {
        logger.warn(`SSO: Benutzer existiert nicht und Auto-Create ist deaktiviert: ${email}`);
        return res.redirect('/admin?error=sso_user_not_found');
      }

      // Erstelle neuen Benutzer
      // Finde Standard-Organisation (erste aktive)
      const { Organization } = await import('../models');
      const defaultOrg = await Organization.findOne({ where: { isActive: true } });

      if (!defaultOrg) {
        logger.error('SSO: Keine aktive Organisation für neuen Benutzer gefunden');
        return res.redirect('/admin?error=sso_no_organization');
      }

      // Validiere und konvertiere die Rolle
      const validRoles = ['super_admin', 'admin', 'editor', 'viewer', 'display'] as const;
      type ValidRole = (typeof validRoles)[number];
      const defaultRole: ValidRole = validRoles.includes(config.defaultRole as ValidRole)
        ? (config.defaultRole as ValidRole)
        : 'editor';

      user = await User.create({
        email,
        firstName,
        lastName,
        password: `SSO_${Date.now()}_${Math.random().toString(36)}`, // Zufälliges Passwort (wird nicht verwendet)
        role: defaultRole,
        organizationId: defaultOrg.id,
        isActive: true,
        ssoProvider: 'azure_ad',
        azureAdId,
      });

      logger.info(`SSO: Neuer Benutzer erstellt: ${email} mit Rolle ${defaultRole}`);
    } else {
      // Aktualisiere Azure AD ID falls noch nicht gesetzt
      if (!user.azureAdId) {
        await user.update({
          azureAdId,
          ssoProvider: 'azure_ad',
          // Optional: Namen aktualisieren
          firstName: firstName || user.firstName,
          lastName: lastName || user.lastName,
        });
        logger.info(`SSO: Azure AD ID für bestehenden Benutzer aktualisiert: ${email}`);
      }
    }

    // Prüfe ob Benutzer aktiv ist
    if (!user.isActive) {
      logger.warn(`SSO: Benutzer ist deaktiviert: ${email}`);
      return res.redirect('/admin?error=sso_user_inactive');
    }

    // Aktualisiere letzten Login
    await user.update({ lastLogin: new Date() });

    // Erstelle JWT Token
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1h';
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        ssoProvider: 'azure_ad',
      },
      jwtSecret,
      { expiresIn: jwtExpiresIn } as jwt.SignOptions
    );

    // Refresh Token
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    const refreshToken = jwt.sign({ id: user.id, type: 'refresh' }, refreshSecret, {
      expiresIn: refreshExpiresIn,
    } as jwt.SignOptions);

    logger.info(`SSO Login erfolgreich: ${email} (Rolle: ${user.role})`);

    // Redirect mit Token zum Frontend
    // Das Frontend speichert den Token und leitet zum Dashboard weiter
    res.redirect(`/admin/sso-callback.html?token=${accessToken}&refreshToken=${refreshToken}`);
  } catch (error: unknown) {
    logger.error('SSO Callback Fehler:', error);
    res.redirect('/admin?error=sso_callback_failed');
  }
}

/**
 * LDAP/Active Directory Login
 * Authentifiziert Benutzer gegen Windows Server Active Directory
 */
export async function handleLDAPLogin(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: { message: 'Benutzername und Passwort erforderlich' },
      });
      return;
    }

    const config = loadSSOConfig();

    if (!config.enabled || config.provider !== 'ldap' || !config.ldap) {
      res.status(400).json({
        success: false,
        error: { message: 'LDAP-Authentifizierung ist nicht aktiviert' },
      });
      return;
    }

    const ldapService = createLDAPService(config.ldap);
    const authResult = await ldapService.authenticate(username, password);

    if (!authResult.success || !authResult.user) {
      logger.warn(`LDAP login failed for user: ${username}`);
      res.status(401).json({
        success: false,
        error: { message: authResult.error || 'Authentifizierung fehlgeschlagen' },
      });
      return;
    }

    const ldapUser = authResult.user;

    // Domain-Prüfung
    if (config.allowedDomains.length > 0) {
      const emailDomain = ldapUser.email.split('@')[1]?.toLowerCase();
      if (emailDomain && !config.allowedDomains.includes(emailDomain)) {
        logger.warn(`LDAP login blocked - domain not allowed: ${emailDomain}`);
        res.status(403).json({
          success: false,
          error: { message: 'Diese Domain ist nicht für SSO-Login zugelassen' },
        });
        return;
      }
    }

    // Bestimme Rolle basierend auf AD-Gruppen
    const ldapRole = ldapService.determineRole(ldapUser.groups);
    const validRoles = ['super_admin', 'admin', 'editor', 'viewer', 'display'] as const;
    type ValidRole = (typeof validRoles)[number];
    const userRole: ValidRole = (
      validRoles.includes(ldapRole as ValidRole) ? ldapRole : config.defaultRole
    ) as ValidRole;

    // Benutzer in DB suchen oder erstellen
    let user = await User.findOne({
      where: { email: ldapUser.email.toLowerCase() },
    });

    if (!user) {
      if (!config.autoCreateUsers) {
        res.status(403).json({
          success: false,
          error: { message: 'Benutzer nicht registriert und Auto-Erstellung deaktiviert' },
        });
        return;
      }

      // Neuen Benutzer erstellen
      user = await User.create({
        email: ldapUser.email.toLowerCase(),
        firstName: ldapUser.firstName || username,
        lastName: ldapUser.lastName || '',
        password: 'SSO_LDAP_USER_' + Date.now(), // Placeholder - kein echtes Passwort nötig
        role: userRole,
        ssoProvider: 'ldap',
        azureAdId: ldapUser.dn, // Speichere den DN als Referenz
        isActive: true,
      });

      logger.info(`LDAP: Created new user ${user.email} with role ${user.role}`);
    } else {
      // Benutzer aktualisieren
      await user.update({
        firstName: ldapUser.firstName || user.firstName,
        lastName: ldapUser.lastName || user.lastName,
        ssoProvider: 'ldap',
        azureAdId: ldapUser.dn,
        lastLogin: new Date(),
      });

      logger.info(`LDAP: Updated existing user ${user.email}`);
    }

    // JWT generieren
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        ssoProvider: 'ldap',
      },
      jwtSecret,
      { expiresIn: '1d' }
    );

    const refreshToken = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '7d' });

    logger.info(`LDAP login successful: ${user.email}`);

    res.json({
      success: true,
      data: {
        token: accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          ssoProvider: 'ldap',
        },
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('LDAP Login Fehler:', err);
    res.status(500).json({
      success: false,
      error: { message: 'LDAP-Authentifizierung fehlgeschlagen: ' + err.message },
    });
  }
}

/**
 * SSO Logout
 * Leitet zu Azure AD Logout weiter
 */
export async function handleSSOLogout(_req: Request, res: Response) {
  try {
    const config = loadSSOConfig();

    if (!config.enabled || config.provider !== 'azure_ad' || !config.azureAD) {
      // Normaler Logout wenn SSO nicht aktiv
      return res.redirect('/admin');
    }

    const logoutUri = `https://login.microsoftonline.com/${config.azureAD.tenantId}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(config.azureAD.postLogoutRedirectUri)}`;

    res.redirect(logoutUri);
  } catch (error: unknown) {
    logger.error('SSO Logout Fehler:', error);
    res.redirect('/admin');
  }
}
