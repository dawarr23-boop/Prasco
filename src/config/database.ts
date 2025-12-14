import { Sequelize } from 'sequelize';
import { logger } from '../utils/logger';

const {
    DB_HOST,
    DB_PORT,
    DB_NAME,
    DB_USER,
    DB_PASSWORD,
    NODE_ENV,
} = process.env;

export const sequelize = new Sequelize({
    dialect: 'postgres',
    host: DB_HOST || 'localhost',
    port: parseInt(DB_PORT || '5432'),
    database: DB_NAME || 'bulletin_board',
    username: DB_USER || 'postgres',
    password: DB_PASSWORD || 'postgres',
    logging: NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true,
    },
});

export const connectDatabase = async (): Promise<void> => {
    try {
        await sequelize.authenticate();
        logger.info('✅ PostgreSQL Verbindung erfolgreich');

        // Sync models in development
        if (NODE_ENV === 'development') {
            await sequelize.sync({ alter: true });
            logger.info('✅ Datenbank-Schema synchronisiert');
        }
    } catch (error) {
        logger.error('❌ Fehler bei Datenbankverbindung:', error);
        throw error;
    }
};

export default sequelize;
