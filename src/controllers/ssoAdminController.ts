/**
 * SSO Admin Controller - Verwaltung der SSO-Konfiguration
 * Nur für Super-Admins zugänglich
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { loadSSOConfig, validateSSOConfig } from '../config/sso';
import { createLDAPService } from '../services/ldapService';
import logger from '../utils/logger';
import fs from 'fs';
import path from 'path';

// Interface für Azure AD OpenID Configuration
interface AzureADOpenIDConfig {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
}

/**
 * Hole aktuelle SSO-Konfiguration (nur Super-Admin)
 */
export async function getSSOConfiguration(req: AuthRequest, res: Response): Promise<void> {
  try {
    // Nur Super-Admin darf SSO konfigurieren
    if (req.user?.role !== 'super_admin') {
      res.status(403).json({
        success: false,
        error: { message: 'Nur Super-Admins können die SSO-Konfiguration einsehen' },
      });
      return;
    }

    const config = loadSSOConfig();
    const validation = validateSSOConfig(config);

    // Sensible Daten maskieren
    const safeConfig = {
      enabled: config.enabled,
      provider: config.provider,
      autoCreateUsers: config.autoCreateUsers,
      defaultRole: config.defaultRole,
      allowedDomains: config.allowedDomains,
      azureAD: config.azureAD
        ? {
            tenantId: config.azureAD.tenantId ? maskSecret(config.azureAD.tenantId) : '',
            clientId: config.azureAD.clientId ? maskSecret(config.azureAD.clientId) : '',
            clientSecret: config.azureAD.clientSecret ? '••••••••' : '',
            redirectUri: config.azureAD.redirectUri,
            postLogoutRedirectUri: config.azureAD.postLogoutRedirectUri,
            scopes: config.azureAD.scopes,
          }
        : null,
      validation: {
        valid: validation.valid,
        errors: validation.errors,
      },
    };

    res.json({
      success: true,
      data: safeConfig,
    });
  } catch (error: unknown) {
    logger.error('SSO Konfiguration abrufen Fehler:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Fehler beim Abrufen der SSO-Konfiguration' },
    });
  }
}

/**
 * Aktualisiere SSO-Konfiguration (nur Super-Admin)
 * Schreibt in die .env Datei
 */
export async function updateSSOConfiguration(req: AuthRequest, res: Response): Promise<void> {
  try {
    // Nur Super-Admin darf SSO konfigurieren
    if (req.user?.role !== 'super_admin') {
      res.status(403).json({
        success: false,
        error: { message: 'Nur Super-Admins können die SSO-Konfiguration ändern' },
      });
      return;
    }

    const { enabled, provider, autoCreateUsers, defaultRole, allowedDomains, azureAD } = req.body;

    // Validiere die Eingaben
    if (typeof enabled !== 'boolean') {
      res.status(400).json({
        success: false,
        error: { message: 'enabled muss ein Boolean sein' },
      });
      return;
    }

    const validProviders = ['azure_ad', 'adfs', 'none'];
    if (provider && !validProviders.includes(provider)) {
      res.status(400).json({
        success: false,
        error: { message: 'Ungültiger SSO Provider' },
      });
      return;
    }

    const validRoles = ['super_admin', 'admin', 'editor', 'viewer', 'display'];
    if (defaultRole && !validRoles.includes(defaultRole)) {
      res.status(400).json({
        success: false,
        error: { message: 'Ungültige Standard-Rolle' },
      });
      return;
    }

    // Lese aktuelle .env Datei
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = '';

    try {
      envContent = fs.readFileSync(envPath, 'utf8');
    } catch {
      // .env existiert nicht - erstelle leere
      envContent = '';
    }

    // Aktualisiere oder füge SSO-Variablen hinzu
    const updates: Record<string, string> = {
      SSO_ENABLED: String(enabled),
      SSO_PROVIDER: provider || 'azure_ad',
      SSO_AUTO_CREATE_USERS: String(autoCreateUsers !== false),
      SSO_DEFAULT_ROLE: defaultRole || 'editor',
      SSO_ALLOWED_DOMAINS: Array.isArray(allowedDomains)
        ? allowedDomains.join(',')
        : allowedDomains || '',
    };

    // Azure AD spezifische Konfiguration
    if (azureAD) {
      if (azureAD.tenantId && !azureAD.tenantId.includes('•')) {
        updates.AZURE_AD_TENANT_ID = azureAD.tenantId;
      }
      if (azureAD.clientId && !azureAD.clientId.includes('•')) {
        updates.AZURE_AD_CLIENT_ID = azureAD.clientId;
      }
      if (azureAD.clientSecret && azureAD.clientSecret !== '••••••••') {
        updates.AZURE_AD_CLIENT_SECRET = azureAD.clientSecret;
      }
      if (azureAD.redirectUri) {
        updates.AZURE_AD_REDIRECT_URI = azureAD.redirectUri;
      }
      if (azureAD.postLogoutRedirectUri) {
        updates.AZURE_AD_POST_LOGOUT_URI = azureAD.postLogoutRedirectUri;
      }
    }

    // Aktualisiere .env Inhalt
    for (const [key, value] of Object.entries(updates)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    }

    // Schreibe .env Datei
    fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');

    // Aktualisiere process.env
    for (const [key, value] of Object.entries(updates)) {
      process.env[key] = value;
    }

    logger.info(`SSO-Konfiguration aktualisiert von ${req.user.email}`);

    // Lade neue Konfiguration und validiere
    const newConfig = loadSSOConfig();
    const validation = validateSSOConfig(newConfig);

    res.json({
      success: true,
      message: 'SSO-Konfiguration erfolgreich aktualisiert',
      data: {
        enabled: newConfig.enabled,
        provider: newConfig.provider,
        validation: {
          valid: validation.valid,
          errors: validation.errors,
        },
        requiresRestart: true, // Hinweis dass Neustart empfohlen
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    logger.error('SSO Konfiguration aktualisieren Fehler:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Fehler beim Aktualisieren der SSO-Konfiguration: ' + errorMessage },
    });
  }
}

/**
 * Teste SSO-Konfiguration (prüft ob Azure AD erreichbar ist)
 */
export async function testSSOConfiguration(req: AuthRequest, res: Response): Promise<void> {
  try {
    // Nur Super-Admin darf SSO testen
    if (req.user?.role !== 'super_admin') {
      res.status(403).json({
        success: false,
        error: { message: 'Nur Super-Admins können die SSO-Konfiguration testen' },
      });
      return;
    }

    const config = loadSSOConfig();
    const validation = validateSSOConfig(config);

    if (!validation.valid) {
      res.json({
        success: true,
        data: {
          status: 'invalid_config',
          message: 'SSO-Konfiguration ist unvollständig',
          errors: validation.errors,
        },
      });
      return;
    }

    if (!config.enabled) {
      res.json({
        success: true,
        data: {
          status: 'disabled',
          message: 'SSO ist deaktiviert',
        },
      });
      return;
    }

    // Teste Azure AD Erreichbarkeit
    if (config.provider === 'azure_ad' && config.azureAD) {
      try {
        const testUrl = `https://login.microsoftonline.com/${config.azureAD.tenantId}/.well-known/openid-configuration`;
        const response = await fetch(testUrl);

        if (response.ok) {
          const data = (await response.json()) as AzureADOpenIDConfig;
          res.json({
            success: true,
            data: {
              status: 'ok',
              message: 'Azure AD ist erreichbar und konfiguriert',
              details: {
                issuer: data.issuer,
                authorizationEndpoint: data.authorization_endpoint ? 'OK' : 'Fehlt',
                tokenEndpoint: data.token_endpoint ? 'OK' : 'Fehlt',
              },
            },
          });
          return;
        } else {
          res.json({
            success: true,
            data: {
              status: 'error',
              message: 'Azure AD Tenant nicht erreichbar oder ungültig',
              httpStatus: response.status,
            },
          });
          return;
        }
      } catch (fetchError: unknown) {
        const errorMessage =
          fetchError instanceof Error ? fetchError.message : 'Unbekannter Fehler';
        res.json({
          success: true,
          data: {
            status: 'error',
            message: 'Verbindung zu Azure AD fehlgeschlagen',
            error: errorMessage,
          },
        });
        return;
      }
    }

    // Teste LDAP/Active Directory Erreichbarkeit
    if (config.provider === 'ldap' && config.ldap) {
      try {
        const ldapService = createLDAPService(config.ldap);
        const testResult = await ldapService.testConnection();

        if (testResult.success) {
          res.json({
            success: true,
            data: {
              status: 'ok',
              message: 'LDAP/Active Directory ist erreichbar',
              details: {
                server: config.ldap.url,
                baseDN: config.ldap.baseDN,
                bindStatus: 'OK',
              },
            },
          });
          return;
        } else {
          res.json({
            success: true,
            data: {
              status: 'error',
              message: testResult.message,
            },
          });
          return;
        }
      } catch (ldapError: unknown) {
        const errorMessage = ldapError instanceof Error ? ldapError.message : 'Unbekannter Fehler';
        res.json({
          success: true,
          data: {
            status: 'error',
            message: 'LDAP-Verbindung fehlgeschlagen: ' + errorMessage,
          },
        });
        return;
      }
    }

    res.json({
      success: true,
      data: {
        status: 'unknown',
        message: 'Kein Test für diesen Provider verfügbar',
      },
    });
  } catch (error: unknown) {
    logger.error('SSO Test Fehler:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Fehler beim Testen der SSO-Konfiguration' },
    });
  }
}

/**
 * Hilfsfunktion: Maskiere sensible Daten
 */
function maskSecret(value: string, visibleChars = 4): string {
  if (!value || value.length <= visibleChars * 2) {
    return '••••••••';
  }
  return (
    value.substring(0, visibleChars) + '••••••••' + value.substring(value.length - visibleChars)
  );
}
