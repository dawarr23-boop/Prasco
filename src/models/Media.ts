import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface MediaAttributes {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  uploadedBy: number;
  organizationId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MediaCreationAttributes
  extends Optional<
    MediaAttributes,
    'id' | 'thumbnailUrl' | 'organizationId' | 'createdAt' | 'updatedAt'
  > {}

class Media extends Model<MediaAttributes, MediaCreationAttributes> implements MediaAttributes {
  public id!: number;
  public filename!: string;
  public originalName!: string;
  public mimeType!: string;
  public size!: number;
  public url!: string;
  public thumbnailUrl?: string;
  public width?: number;
  public height?: number;
  public uploadedBy!: number;
  public organizationId?: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Media.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    originalName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    thumbnailUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
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
    tableName: 'media',
    timestamps: true,
  }
);

export default Media;
