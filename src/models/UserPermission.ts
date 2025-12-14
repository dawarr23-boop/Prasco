import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface UserPermissionAttributes {
  id: number;
  userId: number;
  permissionId: number;
  granted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserPermissionCreationAttributes
  extends Optional<UserPermissionAttributes, 'id' | 'granted'> {}

class UserPermission
  extends Model<UserPermissionAttributes, UserPermissionCreationAttributes>
  implements UserPermissionAttributes
{
  public id!: number;
  public userId!: number;
  public permissionId!: number;
  public granted!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserPermission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
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
    granted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'true = grant permission, false = revoke permission (override role)',
    },
  },
  {
    sequelize,
    tableName: 'user_permissions',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'permission_id'],
        name: 'user_permission_unique',
      },
    ],
  }
);

export default UserPermission;
