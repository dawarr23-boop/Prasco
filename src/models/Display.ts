import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface DisplayAttributes {
  id: number;
  name: string;
  identifier: string;
  description?: string;
  isActive: boolean;
  showTransitData: boolean;
  showTrafficData: boolean;
  organizationId?: number;
  // Device Authorization
  serialNumber?: string;
  macAddress?: string;
  deviceToken?: string;
  authorizationStatus: 'pending' | 'authorized' | 'rejected' | 'revoked';
  deviceModel?: string;
  deviceOsVersion?: string;
  appVersion?: string;
  lastSeenAt?: Date;
  registeredAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DisplayCreationAttributes
  extends Optional<
    DisplayAttributes,
    'id' | 'description' | 'isActive' | 'showTransitData' | 'showTrafficData' | 'authorizationStatus' | 'serialNumber' | 'macAddress' | 'deviceToken' | 'deviceModel' | 'deviceOsVersion' | 'appVersion' | 'lastSeenAt' | 'registeredAt' | 'createdAt' | 'updatedAt'
  > {}

class Display
  extends Model<DisplayAttributes, DisplayCreationAttributes>
  implements DisplayAttributes
{
  public id!: number;
  public name!: string;
  public identifier!: string;
  public description?: string;
  public isActive!: boolean;
  public showTransitData!: boolean;
  public showTrafficData!: boolean;
  public organizationId?: number;
  // Device Authorization
  public serialNumber?: string;
  public macAddress?: string;
  public deviceToken?: string;
  public authorizationStatus!: 'pending' | 'authorized' | 'rejected' | 'revoked';
  public deviceModel?: string;
  public deviceOsVersion?: string;
  public appVersion?: string;
  public lastSeenAt?: Date;
  public registeredAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly posts?: any[];
}

Display.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    identifier: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        is: /^[a-zA-Z0-9-_]+$/,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    showTransitData: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'show_transit_data',
    },
    showTrafficData: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'show_traffic_data',
    },
    organizationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'id',
      },
    },
    // Device Authorization Fields
    serialNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      field: 'serial_number',
    },
    macAddress: {
      type: DataTypes.STRING(17),
      allowNull: true,
      field: 'mac_address',
    },
    deviceToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      field: 'device_token',
    },
    authorizationStatus: {
      type: DataTypes.ENUM('pending', 'authorized', 'rejected', 'revoked'),
      allowNull: false,
      defaultValue: 'authorized',
      field: 'authorization_status',
    },
    deviceModel: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'device_model',
    },
    deviceOsVersion: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'device_os_version',
    },
    appVersion: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'app_version',
    },
    lastSeenAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_seen_at',
    },
    registeredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'registered_at',
    },
  },
  {
    sequelize,
    tableName: 'displays',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['identifier'],
      },
      {
        unique: true,
        fields: ['serial_number'],
      },
      {
        unique: true,
        fields: ['device_token'],
      },
      {
        fields: ['authorization_status'],
      },
    ],
  }
);

export default Display;
