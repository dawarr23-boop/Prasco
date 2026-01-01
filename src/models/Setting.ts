import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface SettingAttributes {
  id?: number;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  category?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class Setting extends Model<SettingAttributes> implements SettingAttributes {
  public id!: number;
  public key!: string;
  public value!: string;
  public type!: 'string' | 'number' | 'boolean' | 'json';
  public category?: string;
  public description?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Helper-Methode zum Parsen des Wertes
  public getParsedValue(): any {
    switch (this.type) {
      case 'number':
        return parseFloat(this.value);
      case 'boolean':
        return this.value === 'true';
      case 'json':
        try {
          return JSON.parse(this.value);
        } catch {
          return null;
        }
      default:
        return this.value;
    }
  }
}

Setting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
      defaultValue: 'string',
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'settings',
    timestamps: true,
  }
);

export default Setting;
