#!/usr/bin/env node
/**
 * Deployment Script für Raspberry Pi
 * Kopiert nur die notwendigen Dateien und startet den Service neu
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PI_HOST = process.env.PI_HOST || 'pi@192.168.2.47';
const PI_PATH = '/home/pi/prasco';

const filesToDeploy = [
  'dist/',
  'css/admin.css',
  'css/display.css',
  'js/admin.js',
  'js/display.js',
  'views/',
  'public/',
  'package.json',
  '.env.pi'
];

console.log('🚀 Starting deployment to Raspberry Pi...');
console.log(`   Target: ${PI_HOST}:${PI_PATH}`);

// 1. Copy .env.pi to .env on Pi
console.log('\n📋 Step 1: Preparing environment...');
exec(`scp .env.pi ${PI_HOST}:${PI_PATH}/.env`, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Error copying .env: ${error.message}`);
    return;
  }
  
  console.log('✅ Environment file copied');
  
  // 2. Copy application files
  console.log('\n📦 Step 2: Copying application files...');
  const copyCommands = filesToDeploy
    .filter(file => file !== '.env.pi')
    .map(file => `scp -r ${file} ${PI_HOST}:${PI_PATH}/`)
    .join(' && ');
  
  exec(copyCommands, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error copying files: ${error.message}`);
      return;
    }
    
    console.log('✅ Application files copied');
    
    // 3. Install dependencies (only production)
    console.log('\n📦 Step 3: Installing production dependencies...');
    exec(`ssh ${PI_HOST} "cd ${PI_PATH} && npm ci --production"`, (error, stdout, stderr) => {
      if (error) {
        console.warn(`⚠️  Warning during npm install: ${error.message}`);
        console.log('   Continuing anyway...');
      } else {
        console.log('✅ Dependencies installed');
      }
      
      // 4. Restart PM2 service
      console.log('\n🔄 Step 4: Restarting service...');
      exec(`ssh ${PI_HOST} "cd ${PI_PATH} && pm2 restart prasco"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Error restarting service: ${error.message}`);
          return;
        }
        
        console.log('✅ Service restarted');
        
        // 5. Show status
        console.log('\n📊 Deployment Status:');
        exec(`ssh ${PI_HOST} "pm2 status prasco"`, (error, stdout, stderr) => {
          if (stdout) console.log(stdout);
          console.log('\n✨ Deployment complete!\n');
          console.log('   View logs: npm run logs:pi');
          console.log('   Or: ssh ${PI_HOST} "pm2 logs prasco"');
        });
      });
    });
  });
});
