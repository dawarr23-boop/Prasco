#!/usr/bin/env node
/**
 * Complete Database Seeding Script
 * Seeds: Permissions, Role-Permissions, Users, Categories
 * Run: node scripts/full-seed.js
 */

require('dotenv').config();

async function main() {
  let sequelize;

  try {
    console.log('🌱 Starting complete database seeding...\n');

    // Import database and models
    const db = require('../dist/config/database');
    sequelize = db.sequelize;
    const { seedDatabase } = require('../dist/database/seeders');

    // Test connection
    console.log('📡 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    // Sync database schema (without dropping tables)
    console.log('🔄 Syncing database schema...');
    await sequelize.sync({ alter: false });
    console.log('✅ Database schema synced\n');

    // Run full seeding
    console.log('🌱 Starting seeding process...\n');
    await seedDatabase();

    console.log('\n✅ Complete database seeding finished successfully!');
    console.log('\n👤 Default users created:');
    console.log('   - superadmin@prasco.net / superadmin123 (Super Admin)');
    console.log('   - admin@prasco.net / admin123 (Admin)');
    console.log('   - editor@prasco.net / editor123 (Editor)');
    console.log('\n🎯 You can now login at https://localhost:3000/admin\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }

    if (sequelize) {
      try {
        await sequelize.close();
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }

    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
  process.exit(1);
});

main();
