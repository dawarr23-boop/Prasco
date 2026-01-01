import { Sequelize, Options } from 'sequelize';
import { logger } from '../utils/logger';
import path from 'path';

const {
    DB_DIALECT,
    DB_STORAGE,
    DB_HOST,
    DB_PORT,
    DB_NAME,
    DB_USER,
    DB_PASSWORD,
    NODE_ENV,
} = process.env;

// Unterstützt SQLite und PostgreSQL
const dialect = (DB_DIALECT as 'sqlite' | 'postgres') || 'postgres';

const baseConfig: Options = {
    dialect,
    logging: NODE_ENV === 'development' ? (msg) => logger.debug(msg as string) : false,
    define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true,
    },
};

let sequelizeConfig: Options;

if (dialect === 'sqlite') {
    // SQLite Konfiguration (ideal für Raspberry Pi)
    const storagePath = DB_STORAGE || './data/prasco.db';
    sequelizeConfig = {
        ...baseConfig,
        storage: path.resolve(storagePath),
    };
    logger.info(`📁 SQLite Datenbank: ${storagePath}`);
} else {
    // PostgreSQL Konfiguration
    sequelizeConfig = {
        ...baseConfig,
        host: DB_HOST || 'localhost',
        port: parseInt(DB_PORT || '5432'),
        database: DB_NAME || 'bulletin_board',
        username: DB_USER || 'postgres',
        password: DB_PASSWORD || 'postgres',
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
    };
}

export const sequelize = new Sequelize(sequelizeConfig);

export const connectDatabase = async (): Promise<void> => {
    try {
        await sequelize.authenticate();
        const dbType = dialect === 'sqlite' ? 'SQLite' : 'PostgreSQL';
        logger.info(`✅ ${dbType} Verbindung erfolgreich`);

        // Sync models - OHNE alter, um Crashes zu vermeiden
        // Schema muss manuell via Seeding erstellt werden
        if (NODE_ENV === 'development' || dialect === 'sqlite') {
            await sequelize.sync();
            logger.info('✅ Datenbank-Schema synchronisiert');
        }
    } catch (error) {
        logger.error('❌ Fehler bei Datenbankverbindung:', error);
        throw error;
    }
};

export default sequelize;
