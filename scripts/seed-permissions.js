#!/usr/bin/env node
/**
 * Script to manually seed permissions and role-permissions
 * Run: npm run build && node scripts/seed-permissions.js
 */

require('dotenv').config();

async function main() {
  try {
    console.log('🌱 Starting permission seeding...');
    
    // Import database connection from compiled TypeScript
    const { sequelize } = require('../dist/config/database.js');
    
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Check if seeders are compiled
    try {
      const seederPath = require.resolve('../dist/database/seeders/index.js');
      const { seedAll } = require(seederPath);
      await seedAll();
      console.log('✅ Permission seeding complete!');
    } catch (e) {
      console.error('❌ Seeders not found. Run: npm run db:seed');
      console.error('   or check if src/database/seeders/ exists');
      throw e;
    }
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Make sure to run: npm run build first');
    process.exit(1);
  }
}

main();
