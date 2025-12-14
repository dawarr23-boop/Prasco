#!/usr/bin/env node
/**
 * Script to manually seed permissions and role-permissions
 * Run: node scripts/seed-permissions.js
 */

require('dotenv').config();

async function main() {
  try {
    console.log('🌱 Starting permission seeding...');
    
    // Import after dotenv is loaded
    const { sequelize } = require('../dist/models');
    const { seedPermissions } = require('../dist/database/seeders/permissions');
    
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    await seedPermissions();
    
    console.log('✅ Permission seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
