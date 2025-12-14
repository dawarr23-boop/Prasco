/**
 * SSO Configuration für Azure AD / Microsoft Entra ID und LDAP/Active Directory
 *
 * Unterstützt:
 * - Azure AD (Microsoft Entra ID) - Empfohlen für Cloud-Umgebungen
 * - LDAP / Active Directory - Für Windows Server 2016/2019/2022 On-Premise
 * - On-Premise Active Directory mit AD FS (geplant)
 */

import { ConfidentialClientApplication, Configuration } from '@azure/msal-node';

// SSO Provider Types
export type SSOProvider = 'azure_ad' | 'ldap' | 'adfs' | 'none';

// Azure AD / Entra ID Konfiguration
export interface AzureADConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  postLogoutRedirectUri: string;
  scopes: string[];
}

// LDAP / Active Directory Konfiguration
export interface LDAPConfig {
  url: string; // ldap://dc.firma.local oder ldaps://dc.firma.local:636
  baseDN: string; // DC=firma,DC=local
  bindDN: string; // CN=ServiceAccount,CN=Users,DC=firma,DC=local
  bindPassword: string;
  userSearchBase: string; // CN=Users,DC=firma,DC=local
  userSearchFilter: string; // (sAMAccountName={{username}}) oder (userPrincipalName={{username}})
  usernameAttribute: string; // sAMAccountName
  emailAttribute: string; // mail oder userPrincipalName
  firstNameAttribute: string; // givenName
  lastNameAttribute: string; // sn
  groupSearchBase?: string; // OU=Groups,DC=firma,DC=local
  groupSearchFilter?: string; // (member={{dn}})
  adminGroup?: string; // CN=PRASCO-Admins,OU=Groups,DC=firma,DC=local
  editorGroup?: string; // CN=PRASCO-Editors,OU=Groups,DC=firma,DC=local
  tlsOptions?: {
    rejectUnauthorized: boolean; // false für selbstsignierte Zertifikate
  };
}

// SSO Konfiguration
export interface SSOConfig {
  enabled: boolean;
  provider: SSOProvider;
  autoCreateUsers: boolean;
  defaultRole: string;
  allowedDomains: string[];
  azureAD?: AzureADConfig;
  ldap?: LDAPConfig;
}

// Lade Konfiguration aus Umgebungsvariablen
export function loadSSOConfig(): SSOConfig {
  const provider = (process.env.SSO_PROVIDER || 'none') as SSOProvider;

  return {
    enabled: process.env.SSO_ENABLED === 'true',
    provider,
    autoCreateUsers: process.env.SSO_AUTO_CREATE_USERS !== 'false', // Default: true
    defaultRole: process.env.SSO_DEFAULT_ROLE || 'editor',
    allowedDomains: process.env.SSO_ALLOWED_DOMAINS
      ? process.env.SSO_ALLOWED_DOMAINS.split(',').map((d) => d.trim().toLowerCase())
      : [],
    azureAD:
      provider === 'azure_ad'
        ? {
            tenantId: process.env.AZURE_AD_TENANT_ID || '',
            clientId: process.env.AZURE_AD_CLIENT_ID || '',
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
            redirectUri:
              process.env.AZURE_AD_REDIRECT_URI || 'http://localhost:3000/api/auth/sso/callback',
            postLogoutRedirectUri:
              process.env.AZURE_AD_POST_LOGOUT_URI || 'http://localhost:3000/admin',
            scopes: ['openid', 'profile', 'email', 'User.Read'],
          }
        : undefined,
    ldap:
      provider === 'ldap'
        ? {
            url: process.env.LDAP_URL || 'ldap://localhost:389',
            baseDN: process.env.LDAP_BASE_DN || '',
            bindDN: process.env.LDAP_BIND_DN || '',
            bindPassword: process.env.LDAP_BIND_PASSWORD || '',
            userSearchBase: process.env.LDAP_USER_SEARCH_BASE || '',
            userSearchFilter:
              process.env.LDAP_USER_SEARCH_FILTER || '(sAMAccountName={{username}})',
            usernameAttribute: process.env.LDAP_USERNAME_ATTRIBUTE || 'sAMAccountName',
            emailAttribute: process.env.LDAP_EMAIL_ATTRIBUTE || 'mail',
            firstNameAttribute: process.env.LDAP_FIRSTNAME_ATTRIBUTE || 'givenName',
            lastNameAttribute: process.env.LDAP_LASTNAME_ATTRIBUTE || 'sn',
            groupSearchBase: process.env.LDAP_GROUP_SEARCH_BASE || '',
            groupSearchFilter: process.env.LDAP_GROUP_SEARCH_FILTER || '(member={{dn}})',
            adminGroup: process.env.LDAP_ADMIN_GROUP || '',
            editorGroup: process.env.LDAP_EDITOR_GROUP || '',
            tlsOptions: {
              rejectUnauthorized: process.env.LDAP_TLS_REJECT_UNAUTHORIZED !== 'false',
            },
          }
        : undefined,
  };
}

// MSAL Client Konfiguration
export function createMSALClient(config: AzureADConfig): ConfidentialClientApplication {
  const msalConfig: Configuration = {
    auth: {
      clientId: config.clientId,
      authority: `https://login.microsoftonline.com/${config.tenantId}`,
      clientSecret: config.clientSecret,
    },
    system: {
      loggerOptions: {
        loggerCallback: (_level, message, containsPii) => {
          if (!containsPii) {
            console.log(`[MSAL] ${message}`);
          }
        },
        piiLoggingEnabled: false,
        logLevel: 3, // Info
      },
    },
  };

  return new ConfidentialClientApplication(msalConfig);
}

// Azure AD Endpoints
export function getAzureADEndpoints(tenantId: string) {
  const base = `https://login.microsoftonline.com/${tenantId}`;
  return {
    authorization: `${base}/oauth2/v2.0/authorize`,
    token: `${base}/oauth2/v2.0/token`,
    logout: `${base}/oauth2/v2.0/logout`,
    userInfo: 'https://graph.microsoft.com/v1.0/me',
  };
}

// Validiere SSO Konfiguration
export function validateSSOConfig(config: SSOConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.enabled) {
    return { valid: true, errors: [] };
  }

  if (config.provider === 'azure_ad') {
    if (!config.azureAD?.tenantId) {
      errors.push('AZURE_AD_TENANT_ID ist erforderlich');
    }
    if (!config.azureAD?.clientId) {
      errors.push('AZURE_AD_CLIENT_ID ist erforderlich');
    }
    if (!config.azureAD?.clientSecret) {
      errors.push('AZURE_AD_CLIENT_SECRET ist erforderlich');
    }
    if (!config.azureAD?.redirectUri) {
      errors.push('AZURE_AD_REDIRECT_URI ist erforderlich');
    }
  }

  if (config.provider === 'ldap') {
    if (!config.ldap?.url) {
      errors.push('LDAP_URL ist erforderlich (z.B. ldap://dc.firma.local:389)');
    }
    if (!config.ldap?.baseDN) {
      errors.push('LDAP_BASE_DN ist erforderlich (z.B. DC=firma,DC=local)');
    }
    if (!config.ldap?.bindDN) {
      errors.push('LDAP_BIND_DN ist erforderlich (Service-Account DN)');
    }
    if (!config.ldap?.bindPassword) {
      errors.push('LDAP_BIND_PASSWORD ist erforderlich');
    }
    if (!config.ldap?.userSearchBase) {
      errors.push('LDAP_USER_SEARCH_BASE ist erforderlich (z.B. CN=Users,DC=firma,DC=local)');
    }
  }

  return { valid: errors.length === 0, errors };
}

// Export singleton config
export const ssoConfig = loadSSOConfig();
