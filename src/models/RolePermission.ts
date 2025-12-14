import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface RolePermissionAttributes {
  id: number;
  role: 'super_admin' | 'admin' | 'editor' | 'viewer' | 'display';
  permissionId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface RolePermissionCreationAttributes extends Optional<RolePermissionAttributes, 'id'> {}

class RolePermission
  extends Model<RolePermissionAttributes, RolePermissionCreationAttributes>
  implements RolePermissionAttributes
{
  public id!: number;
  public role!: 'super_admin' | 'admin' | 'editor' | 'viewer' | 'display';
  public permissionId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RolePermission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    role: {
      type: DataTypes.ENUM('super_admin', 'admin', 'editor', 'viewer', 'display'),
      allowNull: false,
    },
    permissionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'permissions',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  },
  {
    sequelize,
    tableName: 'role_permissions',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['role', 'permission_id'],
        name: 'role_permission_unique',
      },
    ],
  }
);

export default RolePermission;
