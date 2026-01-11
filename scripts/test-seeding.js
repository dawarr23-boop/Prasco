#!/usr/bin/env node
/**
 * Test Seeding Script
 * Führt Seeding aus mit detailliertem Logging
 */

require('dotenv').config();

async function testSeeding() {
  try {
    console.log('Starting seeding test...');
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_NAME:', process.env.DB_NAME);
    console.log('DB_HOST:', process.env.DB_HOST);
    
    const { seedDatabase } = require('../dist/database/seeders/index');
    
    console.log('Calling seedDatabase()...');
    await seedDatabase();
    console.log('✓ Seeding completed successfully');
    
    // Prüfe Ergebnis
    const { User } = require('../dist/models');
    const Setting = require('../dist/models/Setting').default;
    
    const userCount = await User.count();
    const settingCount = await Setting.count();
    
    console.log(`Users in DB: ${userCount}`);
    console.log(`Settings in DB: ${settingCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Seeding failed:', error);
    process.exit(1);
  }
}

testSeeding();
