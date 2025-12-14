/**
 * LDAP / Active Directory Authentication Service
 * Unterstützt Windows Server 2016/2019/2022 Active Directory
 */

import { Client, SearchOptions } from 'ldapts';
import { LDAPConfig } from '../config/sso';

export interface LDAPUser {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  dn: string;
  groups: string[];
}

export interface LDAPAuthResult {
  success: boolean;
  user?: LDAPUser;
  error?: string;
}

/**
 * LDAP Service für Active Directory Authentifizierung
 */
export class LDAPService {
  private config: LDAPConfig;

  constructor(config: LDAPConfig) {
    this.config = config;
  }

  /**
   * Authentifiziere Benutzer gegen Active Directory
   */
  async authenticate(username: string, password: string): Promise<LDAPAuthResult> {
    const client = new Client({
      url: this.config.url,
      tlsOptions: this.config.tlsOptions,
    });

    try {
      // 1. Bind mit Service-Account um Benutzer zu suchen
      await client.bind(this.config.bindDN, this.config.bindPassword);

      // 2. Benutzer suchen
      const searchFilter = this.config.userSearchFilter.replace(
        '{{username}}',
        this.escapeFilter(username)
      );

      const searchOptions: SearchOptions = {
        scope: 'sub',
        filter: searchFilter,
        attributes: [
          this.config.usernameAttribute,
          this.config.emailAttribute,
          this.config.firstNameAttribute,
          this.config.lastNameAttribute,
          'distinguishedName',
          'memberOf',
        ],
      };

      const { searchEntries } = await client.search(this.config.userSearchBase, searchOptions);

      if (searchEntries.length === 0) {
        await client.unbind();
        return { success: false, error: 'Benutzer nicht gefunden' };
      }

      const userEntry = searchEntries[0];
      const userDN = userEntry.dn;

      // 3. Unbind Service-Account
      await client.unbind();

      // 4. Bind mit Benutzer-Credentials zur Validierung
      const userClient = new Client({
        url: this.config.url,
        tlsOptions: this.config.tlsOptions,
      });

      try {
        await userClient.bind(userDN, password);
        await userClient.unbind();
      } catch {
        return { success: false, error: 'Ungültiges Passwort' };
      }

      // 5. Gruppen extrahieren
      const groups = this.extractGroups(userEntry.memberOf as string[] | string | undefined);

      // 6. Benutzerinformationen zurückgeben
      const user: LDAPUser = {
        username: this.getAttributeValue(userEntry, this.config.usernameAttribute) || username,
        email:
          this.getAttributeValue(userEntry, this.config.emailAttribute) ||
          `${username}@${this.extractDomain()}`,
        firstName: this.getAttributeValue(userEntry, this.config.firstNameAttribute) || '',
        lastName: this.getAttributeValue(userEntry, this.config.lastNameAttribute) || '',
        dn: userDN,
        groups,
      };

      return { success: true, user };
    } catch (error) {
      console.error('[LDAP] Authentication error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'LDAP-Verbindungsfehler',
      };
    }
  }

  /**
   * Teste LDAP-Verbindung
   */
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    details?: Record<string, unknown>;
  }> {
    const client = new Client({
      url: this.config.url,
      tlsOptions: this.config.tlsOptions,
      connectTimeout: 5000,
    });

    try {
      // Versuche Bind mit Service-Account
      await client.bind(this.config.bindDN, this.config.bindPassword);

      // Teste Suche
      const searchOptions: SearchOptions = {
        scope: 'base',
        filter: '(objectClass=*)',
        attributes: ['namingContexts', 'defaultNamingContext', 'rootDomainNamingContext'],
      };

      const { searchEntries } = await client.search('', searchOptions);

      await client.unbind();

      return {
        success: true,
        message: 'LDAP-Verbindung erfolgreich',
        details: {
          server: this.config.url,
          baseDN: this.config.baseDN,
          bindDN: this.config.bindDN,
          serverInfo: searchEntries[0] || {},
        },
      };
    } catch (error) {
      console.error('[LDAP] Connection test failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Verbindung fehlgeschlagen',
      };
    }
  }

  /**
   * Bestimme Benutzerrolle basierend auf AD-Gruppen
   */
  determineRole(groups: string[]): string {
    // Prüfe Admin-Gruppe
    if (this.config.adminGroup) {
      const adminGroupCN = this.extractCN(this.config.adminGroup);
      if (groups.some((g) => this.extractCN(g).toLowerCase() === adminGroupCN.toLowerCase())) {
        return 'admin';
      }
    }

    // Prüfe Editor-Gruppe
    if (this.config.editorGroup) {
      const editorGroupCN = this.extractCN(this.config.editorGroup);
      if (groups.some((g) => this.extractCN(g).toLowerCase() === editorGroupCN.toLowerCase())) {
        return 'editor';
      }
    }

    // Standard-Rolle
    return 'viewer';
  }

  /**
   * Escape LDAP filter special characters
   */
  private escapeFilter(input: string): string {
    return input
      .replace(/\\/g, '\\5c')
      .replace(/\*/g, '\\2a')
      .replace(/\(/g, '\\28')
      .replace(/\)/g, '\\29')
      .replace(/\0/g, '\\00');
  }

  /**
   * Extrahiere Gruppen aus memberOf Attribut
   */
  private extractGroups(memberOf: string[] | string | undefined): string[] {
    if (!memberOf) return [];
    if (typeof memberOf === 'string') return [memberOf];
    return memberOf;
  }

  /**
   * Extrahiere CN aus DN
   */
  private extractCN(dn: string): string {
    const match = dn.match(/^CN=([^,]+)/i);
    return match ? match[1] : dn;
  }

  /**
   * Extrahiere Domain aus baseDN
   */
  private extractDomain(): string {
    const dcParts = this.config.baseDN.match(/DC=([^,]+)/gi);
    if (!dcParts) return 'local';
    return dcParts.map((dc) => dc.replace(/DC=/i, '')).join('.');
  }

  /**
   * Hole Attributwert aus LDAP Entry
   */
  private getAttributeValue(entry: Record<string, unknown>, attribute: string): string {
    const value = entry[attribute];
    if (!value) return '';
    if (Array.isArray(value)) return String(value[0]);
    return String(value);
  }
}

/**
 * Factory-Funktion für LDAP Service
 */
export function createLDAPService(config: LDAPConfig): LDAPService {
  return new LDAPService(config);
}
