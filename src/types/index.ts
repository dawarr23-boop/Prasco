export interface UserRole {
  id: number;
  name: string;
  permissions: string[];
}

export type UserRoleType = 'super_admin' | 'admin' | 'editor' | 'viewer' | 'display';

// ── Post domain types ────────────────────────────────────────────────────────

/** All allowed content-type values – single source of truth used by the model,
 *  route validators, and controller logic. */
export const POST_CONTENT_TYPES = [
  'text',
  'image',
  'video',
  'html',
  'presentation',
  'pdf',
  'composite',
] as const;

export type PostContentType = (typeof POST_CONTENT_TYPES)[number];

export const POST_DISPLAY_MODES = ['all', 'specific'] as const;
export type PostDisplayMode = (typeof POST_DISPLAY_MODES)[number];

export const POST_BG_THEMES = ['light', 'dark'] as const;
export type PostBgTheme = (typeof POST_BG_THEMES)[number];

export interface JWTPayload {
  id: number;
  userId?: number; // Alias für id (backwards compatibility)
  email: string;
  role: UserRoleType;
  organizationId?: number;
}

export interface PermissionCheck {
  resource: string;
  action: string;
}

export const PERMISSIONS = {
  // Posts
  POSTS_CREATE: 'posts.create',
  POSTS_READ: 'posts.read',
  POSTS_UPDATE: 'posts.update',
  POSTS_DELETE: 'posts.delete',
  POSTS_MANAGE: 'posts.manage', // All post operations

  // Categories
  CATEGORIES_CREATE: 'categories.create',
  CATEGORIES_READ: 'categories.read',
  CATEGORIES_UPDATE: 'categories.update',
  CATEGORIES_DELETE: 'categories.delete',
  CATEGORIES_MANAGE: 'categories.manage', // All category operations

  // Users
  USERS_CREATE: 'users.create',
  USERS_READ: 'users.read',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_MANAGE: 'users.manage', // All user operations

  // Organizations
  ORGANIZATIONS_CREATE: 'organizations.create',
  ORGANIZATIONS_READ: 'organizations.read',
  ORGANIZATIONS_UPDATE: 'organizations.update',
  ORGANIZATIONS_DELETE: 'organizations.delete',
  ORGANIZATIONS_MANAGE: 'organizations.manage',

  // Media
  MEDIA_UPLOAD: 'media.upload',
  MEDIA_READ: 'media.read',
  MEDIA_DELETE: 'media.delete',
  MEDIA_MANAGE: 'media.manage',

  // Displays
  DISPLAYS_CREATE: 'displays.create',
  DISPLAYS_READ: 'displays.read',
  DISPLAYS_UPDATE: 'displays.update',
  DISPLAYS_DELETE: 'displays.delete',
  DISPLAYS_MANAGE: 'displays.manage',

  // Permissions (Admin-only)
  PERMISSIONS_MANAGE: 'permissions.manage',
  ROLES_MANAGE: 'roles.manage',

  // Settings
  SETTINGS_READ: 'settings.read',
  SETTINGS_WRITE: 'settings.write',

  // System (Super Admin only)
  SYSTEM_SETTINGS: 'system.settings',
  SYSTEM_LOGS: 'system.logs',
} as const;

// Extend Express Request type globally
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
