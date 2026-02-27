import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { MAC_ADDRESS_REGEX } from '../utils/validation';

export type DeviceStatus = 'pending' | 'approved' | 'rejected';

interface DeviceRegistrationAttributes {
  id: number;
  serialNumber: string;
  macAddress: string;
  deviceName?: string;
  status: DeviceStatus;
  displayId?: number;
  organizationId?: number;
  notes?: string;
  lastSeen?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DeviceRegistrationCreationAttributes
  extends Optional<
    DeviceRegistrationAttributes,
    'id' | 'deviceName' | 'status' | 'displayId' | 'organizationId' | 'notes' | 'lastSeen' | 'createdAt' | 'updatedAt'
  > {}

class DeviceRegistration
  extends Model<DeviceRegistrationAttributes, DeviceRegistrationCreationAttributes>
  implements DeviceRegistrationAttributes
{
  public id!: number;
  public serialNumber!: string;
  public macAddress!: string;
  public deviceName?: string;
  public status!: DeviceStatus;
  public displayId?: number;
  public organizationId?: number;
  public notes?: string;
  public lastSeen?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

DeviceRegistration.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    serialNumber: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'serial_number',
    },
    macAddress: {
      type: DataTypes.STRING(17),
      allowNull: false,
      field: 'mac_address',
      validate: {
        is: MAC_ADDRESS_REGEX,
      },
    },
    deviceName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'device_name',
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    displayId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'display_id',
      references: {
        model: 'displays',
        key: 'id',
      },
    },
    organizationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'organization_id',
      references: {
        model: 'organizations',
        key: 'id',
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lastSeen: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_seen',
    },
  },
  {
    sequelize,
    tableName: 'device_registrations',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['serial_number'] },
      { fields: ['mac_address'] },
      { fields: ['status'] },
      { fields: ['display_id'] },
      { fields: ['organization_id'] },
    ],
  }
);

export default DeviceRegistration;
