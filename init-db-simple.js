#!/usr/bin/env node
/**
 * Initialize Database - Simple Version
 */

require('dotenv').config({ path: '.env.production' });

async function init() {
  try {
    console.log('🔄 Verbinde mit Datenbank...');
    
    const { sequelize } = require('./dist/config/database');
    await sequelize.authenticate();
    console.log('✅ Datenbank verbunden');
    
    console.log('📦 Lade Models...');
    const models = require('./dist/models');
    console.log('Models geladen:', Object.keys(models.default));
    
    console.log('🔨 Erstelle Tabellen (sync mit alter=true)...');
    await sequelize.sync({ alter: true });
    console.log('✅ Tabellen erstellt');
    
    console.log('\n🌱 Starte Seeding...');
    try {
      const seeders = require('./dist/database/seeders');
      if (seeders && seeders.seedDatabase) {
        await seeders.seedDatabase();
        console.log('✅ Seeding abgeschlossen');
      } else {
        console.log('⚠️  Seeder nicht gefunden, überspringe Seeding');
      }
    } catch (seedError) {
      console.log('⚠️  Seeding-Fehler (wird übersprungen):', seedError.message);
    }
    
    await sequelize.close();
    console.log('\n✅ Datenbank-Initialisierung erfolgreich!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fehler:', error);
    process.exit(1);
  }
}

init();
