#!/usr/bin/env node
/**
 * Initialize Database Tables
 * Creates all tables based on Sequelize models
 */

require('dotenv').config();

async function initDatabase() {
  try {
    console.log('🔄 Verbinde mit Datenbank...');
    
    const { sequelize } = require('../dist/config/database');
    await sequelize.authenticate();
    console.log('✅ Datenbank verbunden');
    
    console.log('📦 Lade Models...');
    require('../dist/models');
    
    console.log('🔨 Erstelle Tabellen...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Tabellen erstellt');
    
    console.log('\n🌱 Starte Seeding...');
    const { seedDatabase } = require('../dist/database/seeders');
    await seedDatabase();
    console.log('✅ Seeding abgeschlossen');
    
    await sequelize.close();
    console.log('\n✅ Datenbank-Initialisierung erfolgreich!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fehler:', error);
    process.exit(1);
  }
}

initDatabase();
