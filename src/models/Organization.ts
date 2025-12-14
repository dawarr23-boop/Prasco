import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface OrganizationAttributes {
    id: number;
    name: string;
    slug: string;
    logoUrl?: string;
    primaryColor?: string;
    isActive: boolean;
    maxUsers?: number;
    maxDisplays?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

interface OrganizationCreationAttributes extends Optional<OrganizationAttributes, 'id' | 'logoUrl' | 'primaryColor' | 'isActive' | 'maxUsers' | 'maxDisplays' | 'createdAt' | 'updatedAt'> { }

class Organization extends Model<OrganizationAttributes, OrganizationCreationAttributes> implements OrganizationAttributes {
    public id!: number;
    public name!: string;
    public slug!: string;
    public logoUrl?: string;
    public primaryColor?: string;
    public isActive!: boolean;
    public maxUsers?: number;
    public maxDisplays?: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Organization.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        slug: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        logoUrl: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        primaryColor: {
            type: DataTypes.STRING(7),
            allowNull: true,
            defaultValue: '#c41e3a',
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        maxUsers: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        maxDisplays: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'organizations',
        timestamps: true,
    }
);

export default Organization;
