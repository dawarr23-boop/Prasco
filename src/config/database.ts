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
        database: DB_NAME || 'prasco',  // Changed from 'bulletin_board' to match actual DB
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

/**
 * Initialisiert die Datenbank-Tabellen falls sie noch nicht existieren
 * Erstellt Tabellen nur wenn sie fehlen (sichere Methode für production)
 */
export const initializeDatabaseSchema = async (): Promise<void> => {
    try {
        // Versuche sync() - wenn Tabellen existieren, wird nichts geändert (force: false)
        // Bei Berechtigungsfehlern bedeutet das meist dass Tabellen bereits existieren
        await sequelize.sync({ force: false, alter: false });
        logger.info('✅ Datenbank-Schema bereit');
    } catch (error: any) {
        // Wenn der Fehler "permission denied" ist, existieren die Tabellen bereits
        if (error?.original?.code === '42501') {
            logger.info('✅ Datenbank-Schema bereits vorhanden');
        } else {
            logger.error('❌ Fehler bei Schema-Initialisierung:', error);
            throw error;
        }
    }
};

export const connectDatabase = async (): Promise<void> => {
    try {
        await sequelize.authenticate();
        const dbType = dialect === 'sqlite' ? 'SQLite' : 'PostgreSQL';
        logger.info(`✅ ${dbType} Verbindung erfolgreich`);
        
        // Initialisiere Schema (in allen Umgebungen)
        await initializeDatabaseSchema();
    } catch (error) {
        logger.error('❌ Fehler bei Datenbankverbindung:', error);
        throw error;
    }
};

export default sequelize;
