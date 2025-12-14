import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

// SSO Provider Types
export type SSOProviderType = 'azure_ad' | 'ldap' | 'adfs' | 'local' | null;

interface UserAttributes {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'admin' | 'editor' | 'viewer' | 'display';
  organizationId?: number;
  isActive: boolean;
  lastLogin?: Date;
  // SSO Fields
  ssoProvider?: SSOProviderType;
  azureAdId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    'id' | 'isActive' | 'lastLogin' | 'ssoProvider' | 'azureAdId' | 'createdAt' | 'updatedAt'
  > {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public role!: 'super_admin' | 'admin' | 'editor' | 'viewer' | 'display';
  public organizationId?: number;
  public isActive!: boolean;
  public lastLogin?: Date;
  // SSO Fields
  public ssoProvider?: SSOProviderType;
  public azureAdId?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Helper method to check password
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  // Helper method to get full name
  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Check if user has a specific permission
  public async hasPermission(permissionName: string): Promise<boolean> {
    // Import dynamically to avoid circular dependency
    const { Permission, RolePermission, UserPermission } = await import('./index');

    // Build list of permissions to check (including .manage wildcard)
    const permissionsToCheck = [permissionName];
    
    // If permission is like "posts.read", also check for "posts.manage"
    const parts = permissionName.split('.');
    if (parts.length === 2 && parts[1] !== 'manage') {
      permissionsToCheck.push(`${parts[0]}.manage`);
    }

    // 1. Check for direct user permission (grant or revoke)
    for (const perm of permissionsToCheck) {
      const userPermission = await UserPermission.findOne({
        include: [
          {
            model: Permission,
            as: 'permission',
            where: { name: perm },
          },
        ],
        where: { userId: this.id },
      });

      // If user has explicit permission setting, use it
      if (userPermission) {
        return userPermission.granted;
      }
    }

    // 2. Check role-based permissions (including manage wildcard)
    for (const perm of permissionsToCheck) {
      const rolePermission = await RolePermission.findOne({
        include: [
          {
            model: Permission,
            as: 'permission',
            where: { name: perm },
          },
        ],
        where: { role: this.role },
      });

      if (rolePermission) {
        return true;
      }
    }

    return false;
  }

  // Check if user has any of the given permissions
  public async hasAnyPermission(permissionNames: string[]): Promise<boolean> {
    for (const permission of permissionNames) {
      if (await this.hasPermission(permission)) {
        return true;
      }
    }
    return false;
  }

  // Check if user has all of the given permissions
  public async hasAllPermissions(permissionNames: string[]): Promise<boolean> {
    for (const permission of permissionNames) {
      if (!(await this.hasPermission(permission))) {
        return false;
      }
    }
    return true;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('super_admin', 'admin', 'editor', 'viewer', 'display'),
      allowNull: false,
      defaultValue: 'viewer',
    },
    organizationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'id',
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // SSO Fields
    ssoProvider: {
      type: DataTypes.ENUM('azure_ad', 'adfs', 'local'),
      allowNull: true,
      defaultValue: null,
      field: 'sso_provider',
    },
    azureAdId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      field: 'azure_ad_id',
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

export default User;
