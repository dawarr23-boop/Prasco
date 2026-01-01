#!/usr/bin/env node
/**
 * Script to test user permissions
 * Run: npm run build && node scripts/test-permissions.js
 */

require('dotenv').config();

async function main() {
  try {
    console.log('🔍 Testing user permissions...\n');
    
    const { sequelize } = require('../dist/config/database.js');
    const models = require('../dist/models/index.js');
    const { User, Permission, RolePermission } = models;
    
    await sequelize.authenticate();
    console.log('✅ Database connected\n');
    
    // Get admin user (check environment variable or use default)
    const adminEmail = process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@prasco.net';
    const admin = await User.findOne({ where: { email: adminEmail } });
    if (!admin) {
      console.log(`❌ Admin user not found: ${adminEmail}`);
      console.log('   Run seeder first: npm run db:seed');
      process.exit(1);
    }
    
    console.log(`User: ${admin.email} (${admin.role})\n`);
    
    // Test permissions
    const testPermissions = ['posts.read', 'posts.manage', 'users.read', 'categories.manage'];
    
    for (const perm of testPermissions) {
      console.log(`Testing permission: ${perm}`);
      const hasPermission = await admin.hasPermission(perm);
      console.log(`  Result: ${hasPermission ? '✅ GRANTED' : '❌ DENIED'}\n`);
    }
    
    // Check role_permissions for admin
    const rolePerms = await RolePermission.findAll({
      where: { role: admin.role },
      include: [{ model: Permission, as: 'permission' }],
      limit: 5
    });
    
    console.log(`Role-Permissions found for ${admin.role}: ${rolePerms.length}`);
    rolePerms.forEach((rp) => {
      console.log(`  - ${rp.permission?.name || 'N/A'}`);
    });
    
    // Direct SQL query
    console.log('\n🔍 Direct SQL Query:');
    const [results] = await sequelize.query(
      'SELECT role, COUNT(*) as count FROM role_permissions GROUP BY role'
    );
    console.log('Role counts in database:');
    results.forEach((row) => {
      console.log(`  - ${row.role}: ${row.count} permissions`);
    });
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
