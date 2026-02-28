#!/usr/bin/env node
/**
 * PRASCO Database Seeder
 *
 * Füllt die Datenbank mit Stammdaten:
 *   - Permissions & Role-Permissions
 *   - Organisation PRASCO
 *   - Benutzer (Super-Admin, Admin, Editor)
 *   - Standard-Kategorien
 *   - System-Einstellungen
 *
 * Verwendung:
 *   node scripts/seed.js           # Nur wenn DB leer ist (idempotent via findOrCreate)
 *   node scripts/seed.js --force   # Immer ausführen, auch wenn Daten vorhanden sind
 *
 * Voraussetzung: npm run build muss vorher ausgeführt worden sein.
 */

'use strict';

require('dotenv').config();

const FORCE = process.argv.includes('--force');

function header(title) {
  const line = '═'.repeat(42);
  console.log(`\n╔${line}╗`);
  console.log(`║  ${title.padEnd(40)}║`);
  console.log(`╚${line}╝\n`);
}

async function main() {
  header('PRASCO Database Seeder');

  // Require compiled TypeScript output
  let sequelize, User, seedDatabase;
  try {
    ({ sequelize } = require('../dist/config/database'));
    ({ User }      = require('../dist/models'));
    ({ seedDatabase } = require('../dist/database/seeders'));
  } catch (err) {
    console.error('❌ Compiled dist/ not found. Run "npm run build" first.\n');
    console.error('   Fehler:', err.message);
    process.exit(1);
  }

  try {
    console.log('🔌 Verbinde mit Datenbank...');
    await sequelize.authenticate();
    console.log(`✅ Verbunden (${process.env.DB_DIALECT || 'postgres'})\n`);

    // Sync schema (safe – never drops tables)
    console.log('🗄  Synchronisiere Schema...');
    await sequelize.sync({ force: false, alter: false });
    console.log('✅ Schema bereit\n');

    // Check if seeding is needed
    const userCount = await User.count();
    if (userCount > 0 && !FORCE) {
      console.log(`ℹ  Datenbank enthält bereits ${userCount} Benutzer.`);
      console.log('   Seeding übersprungen. Verwende --force zum Erzwingen.\n');
      console.log('✅ Nichts zu tun.');
    } else {
      if (FORCE && userCount > 0) {
        console.log(`⚠  Erzwungenes Seeding (--force) – ${userCount} Benutzer vorhanden.\n`);
      }
      console.log('🌱 Starte Seeding...\n');
      await seedDatabase();
      console.log('\n✅ Seeding erfolgreich abgeschlossen!');
      console.log('\n👤 Standard-Zugänge:');
      console.log('   superadmin@prasco.net  /  superadmin123  (Super-Admin)');
      console.log('   admin@prasco.net       /  admin123       (Admin)');
      console.log('   editor@prasco.net      /  editor123      (Editor)');
    }
  } catch (err) {
    console.error('\n❌ Seeding fehlgeschlagen:', err.message);
    throw err;
  } finally {
    await sequelize.close();
  }

  console.log('');
}

main().catch(() => process.exit(1));
