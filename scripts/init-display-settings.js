#!/usr/bin/env node
/**
 * Initialisiert Display-Settings in der Datenbank
 */

require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

// Datenbank-Verbindung
const sequelize = new Sequelize(
  process.env.DB_NAME || 'prasco',
  process.env.DB_USER || 'prasco_user',
  process.env.DB_PASSWORD || 'prasco123',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false
  }
);

// Setting Model (vereinfacht)
const Setting = sequelize.define('setting', {
  key: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
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
}, {
  tableName: 'settings',
  timestamps: true,
  underscored: true,
});

async function initSettings() {
  try {
    console.log('Verbinde mit Datenbank...');
    await sequelize.authenticate();
    console.log('✓ Datenbankverbindung hergestellt');

    // Sync models to create tables
    console.log('Erstelle Datenbank-Schema...');
    await sequelize.sync({ force: false });
    console.log('✓ Datenbank-Schema synchronisiert');

    // Teste Tabelle
    const tableExists = await sequelize.getQueryInterface().showAllTables();
    console.log(`✓ Gefundene Tabellen: ${tableExists.join(', ')}`);

    // Prüfe aktuelle Settings
    const current = await Setting.findAll();
    console.log(`✓ Aktuelle Settings in DB: ${current.length}`);

    // Erstelle oder aktualisiere Display-Settings
    const settings = [
      {
        key: 'display.refreshInterval',
        value: '5',
        type: 'number',
        category: 'display',
        description: 'Auto-Refresh Intervall in Minuten'
      },
      {
        key: 'display.defaultDuration',
        value: '10',
        type: 'number',
        category: 'display',
        description: 'Standard Anzeigedauer pro Post in Sekunden'
      }
    ];

    for (const setting of settings) {
      const [instance, created] = await Setting.upsert(setting);
      console.log(`${created ? '✓ Erstellt' : '✓ Aktualisiert'}: ${setting.key} = ${setting.value}`);
    }

    // Prüfe erneut
    const afterSettings = await Setting.findAll({ where: { category: 'display' } });
    console.log(`\n✓ Display-Settings in DB: ${afterSettings.length}`);
    afterSettings.forEach(s => {
      console.log(`  - ${s.key} = ${s.value} (${s.type})`);
    });

    console.log('\n✓ Display-Settings erfolgreich initialisiert!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Fehler:', error.message);
    console.error(error);
    process.exit(1);
  }
}

initSettings();
