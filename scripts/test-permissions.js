#!/usr/bin/env node
/**
 * Script to test user permissions
 * Run: node scripts/test-permissions.js
 */

require('dotenv').config();

async function main() {
  try {
    console.log('🔍 Testing user permissions...\n');
    
    const { sequelize } = require('../dist/config/database');
    const { User, Permission, RolePermission } = require('../dist/models');
    
    await sequelize.authenticate();
    console.log('✅ Database connected\n');
    
    // Get admin user
    const admin = await User.findOne({ where: { email: 'admin@prasco.net' } });
    if (!admin) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }
    
    console.log(`User: ${admin.email} (${admin.role})\n`);
    
    // Test posts.read permission
    console.log('Testing permission: posts.read');
    const hasPostsRead = await admin.hasPermission('posts.read');
    console.log(`  Result: ${hasPostsRead ? '✅ GRANTED' : '❌ DENIED'}\n`);
    
    // Test posts.manage permission
    console.log('Testing permission: posts.manage');
    const hasPostsManage = await admin.hasPermission('posts.manage');
    console.log(`  Result: ${hasPostsManage ? '✅ GRANTED' : '❌ DENIED'}\n`);
    
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
