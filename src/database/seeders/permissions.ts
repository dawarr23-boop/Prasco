import { Permission, RolePermission } from '../../models';
import { PERMISSIONS } from '../../types';
import { logger } from '../../utils/logger';

interface PermissionSeed {
  name: string;
  resource: string;
  action: string;
  description: string;
}

// Define all permissions
const permissions: PermissionSeed[] = [
  // Posts
  {
    name: PERMISSIONS.POSTS_CREATE,
    resource: 'posts',
    action: 'create',
    description: 'Create new posts',
  },
  { name: PERMISSIONS.POSTS_READ, resource: 'posts', action: 'read', description: 'View posts' },
  {
    name: PERMISSIONS.POSTS_UPDATE,
    resource: 'posts',
    action: 'update',
    description: 'Edit posts',
  },
  {
    name: PERMISSIONS.POSTS_DELETE,
    resource: 'posts',
    action: 'delete',
    description: 'Delete posts',
  },
  {
    name: PERMISSIONS.POSTS_MANAGE,
    resource: 'posts',
    action: 'manage',
    description: 'Full control over posts',
  },

  // Categories
  {
    name: PERMISSIONS.CATEGORIES_CREATE,
    resource: 'categories',
    action: 'create',
    description: 'Create categories',
  },
  {
    name: PERMISSIONS.CATEGORIES_READ,
    resource: 'categories',
    action: 'read',
    description: 'View categories',
  },
  {
    name: PERMISSIONS.CATEGORIES_UPDATE,
    resource: 'categories',
    action: 'update',
    description: 'Edit categories',
  },
  {
    name: PERMISSIONS.CATEGORIES_DELETE,
    resource: 'categories',
    action: 'delete',
    description: 'Delete categories',
  },
  {
    name: PERMISSIONS.CATEGORIES_MANAGE,
    resource: 'categories',
    action: 'manage',
    description: 'Full control over categories',
  },

  // Users
  {
    name: PERMISSIONS.USERS_CREATE,
    resource: 'users',
    action: 'create',
    description: 'Create new users',
  },
  {
    name: PERMISSIONS.USERS_READ,
    resource: 'users',
    action: 'read',
    description: 'View user information',
  },
  {
    name: PERMISSIONS.USERS_UPDATE,
    resource: 'users',
    action: 'update',
    description: 'Edit user information',
  },
  {
    name: PERMISSIONS.USERS_DELETE,
    resource: 'users',
    action: 'delete',
    description: 'Delete users',
  },
  {
    name: PERMISSIONS.USERS_MANAGE,
    resource: 'users',
    action: 'manage',
    description: 'Full user management',
  },

  // Organizations
  {
    name: PERMISSIONS.ORGANIZATIONS_CREATE,
    resource: 'organizations',
    action: 'create',
    description: 'Create organizations',
  },
  {
    name: PERMISSIONS.ORGANIZATIONS_READ,
    resource: 'organizations',
    action: 'read',
    description: 'View organizations',
  },
  {
    name: PERMISSIONS.ORGANIZATIONS_UPDATE,
    resource: 'organizations',
    action: 'update',
    description: 'Edit organizations',
  },
  {
    name: PERMISSIONS.ORGANIZATIONS_DELETE,
    resource: 'organizations',
    action: 'delete',
    description: 'Delete organizations',
  },
  {
    name: PERMISSIONS.ORGANIZATIONS_MANAGE,
    resource: 'organizations',
    action: 'manage',
    description: 'Full organization management',
  },

  // Media
  {
    name: PERMISSIONS.MEDIA_UPLOAD,
    resource: 'media',
    action: 'upload',
    description: 'Upload media files',
  },
  {
    name: PERMISSIONS.MEDIA_READ,
    resource: 'media',
    action: 'read',
    description: 'View media files',
  },
  {
    name: PERMISSIONS.MEDIA_DELETE,
    resource: 'media',
    action: 'delete',
    description: 'Delete media files',
  },
  {
    name: PERMISSIONS.MEDIA_MANAGE,
    resource: 'media',
    action: 'manage',
    description: 'Full media management',
  },

  // Displays
  {
    name: PERMISSIONS.DISPLAYS_CREATE,
    resource: 'displays',
    action: 'create',
    description: 'Register displays',
  },
  {
    name: PERMISSIONS.DISPLAYS_READ,
    resource: 'displays',
    action: 'read',
    description: 'View display information',
  },
  {
    name: PERMISSIONS.DISPLAYS_UPDATE,
    resource: 'displays',
    action: 'update',
    description: 'Edit display settings',
  },
  {
    name: PERMISSIONS.DISPLAYS_DELETE,
    resource: 'displays',
    action: 'delete',
    description: 'Remove displays',
  },
  {
    name: PERMISSIONS.DISPLAYS_MANAGE,
    resource: 'displays',
    action: 'manage',
    description: 'Full display management',
  },

  // Permissions & Roles
  {
    name: PERMISSIONS.PERMISSIONS_MANAGE,
    resource: 'permissions',
    action: 'manage',
    description: 'Manage permissions',
  },
  {
    name: PERMISSIONS.ROLES_MANAGE,
    resource: 'roles',
    action: 'manage',
    description: 'Manage roles and permissions',
  },

  // System
  {
    name: PERMISSIONS.SYSTEM_SETTINGS,
    resource: 'system',
    action: 'settings',
    description: 'Access system settings',
  },
  {
    name: PERMISSIONS.SYSTEM_LOGS,
    resource: 'system',
    action: 'logs',
    description: 'View system logs',
  },
];

// Define role-permission mappings
const rolePermissions: { [key: string]: string[] } = {
  super_admin: [
    // Super Admin has ALL permissions
    ...permissions.map((p) => p.name),
  ],
  admin: [
    // Admin: kann Editors erstellen, aber keine Admins oder Super-Admins
    PERMISSIONS.POSTS_MANAGE,
    PERMISSIONS.CATEGORIES_MANAGE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_UPDATE, // Kann sich selbst und Editors updaten
    PERMISSIONS.USERS_CREATE, // Kann nur Editors erstellen (Controller prüft)
    PERMISSIONS.ORGANIZATIONS_READ,
    PERMISSIONS.ORGANIZATIONS_UPDATE,
    PERMISSIONS.MEDIA_UPLOAD,
    PERMISSIONS.MEDIA_READ,
    PERMISSIONS.MEDIA_DELETE,
    PERMISSIONS.MEDIA_MANAGE,
    PERMISSIONS.DISPLAYS_MANAGE,
  ],
  editor: [
    // Editor can manage content
    PERMISSIONS.POSTS_CREATE,
    PERMISSIONS.POSTS_READ,
    PERMISSIONS.POSTS_UPDATE,
    PERMISSIONS.POSTS_DELETE,
    PERMISSIONS.CATEGORIES_CREATE,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.CATEGORIES_UPDATE,
    PERMISSIONS.MEDIA_UPLOAD,
    PERMISSIONS.MEDIA_READ,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.DISPLAYS_READ,
  ],
  viewer: [
    // Viewer can only read
    PERMISSIONS.POSTS_READ,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.MEDIA_READ,
    PERMISSIONS.DISPLAYS_READ,
  ],
  display: [
    // Display can only read public content
    PERMISSIONS.POSTS_READ,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.MEDIA_READ,
  ],
};

export const seedPermissions = async (): Promise<void> => {
  try {
    logger.info('🔐 Seeding Permissions...');

    // Create all permissions
    for (const perm of permissions) {
      await Permission.findOrCreate({
        where: { name: perm.name },
        defaults: perm,
      });
    }

    logger.info(`✅ ${permissions.length} Permissions erstellt`);

    // Assign permissions to roles
    for (const [role, permNames] of Object.entries(rolePermissions)) {
      for (const permName of permNames) {
        const permission = await Permission.findOne({ where: { name: permName } });
        if (permission) {
          await RolePermission.findOrCreate({
            where: {
              role: role as 'super_admin' | 'admin' | 'editor' | 'viewer' | 'display',
              permissionId: permission.id,
            },
            defaults: {
              role: role as 'super_admin' | 'admin' | 'editor' | 'viewer' | 'display',
              permissionId: permission.id,
            },
          });
        }
      }
      logger.info(`✅ Role-Permissions für "${role}" erstellt`);
    }

    logger.info('🎉 Permission-Seeding abgeschlossen!');
  } catch (error) {
    logger.error('❌ Permission-Seeding Fehler:', error);
    throw error;
  }
};
