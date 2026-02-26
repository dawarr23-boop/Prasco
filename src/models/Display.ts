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
  createdAt?: Date;
  updatedAt?: Date;
}

interface DisplayCreationAttributes
  extends Optional<
    DisplayAttributes,
    'id' | 'description' | 'isActive' | 'showTransitData' | 'showTrafficData' | 'createdAt' | 'updatedAt'
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
    ],
  }
);

export default Display;
