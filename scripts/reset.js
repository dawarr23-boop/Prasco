#!/usr/bin/env node
/**
 * PRASCO Datenbank-Reset (PostgreSQL)
 *
 * ⚠  WARNUNG: Löscht ALLE Daten! Nur für Entwicklung / Staging verwenden.
 *
 * Verwendung:
 *   node scripts/reset.js           # Interaktiver Bestätigungs-Dialog
 *   node scripts/reset.js --yes     # Ohne Rückfrage (für CI/CD)
 *
 * Was passiert:
 *   1. Alle Sequelize-Tabellen werden gelöscht (force: true)
 *   2. schema_migrations Tabelle wird zurückgesetzt
 *   3. Migrationen werden neu eingespielt
 *   4. Seed-Daten werden eingespielt
 *
 * Voraussetzung: npm run build muss vorher ausgeführt worden sein.
 */

'use strict';

require('dotenv').config();

const readline = require('readline');

const SKIP_CONFIRM = process.argv.includes('--yes');
const DIALECT      = process.env.DB_DIALECT || 'postgres';

function header(title) {
  const line = '═'.repeat(42);
  console.log(`\n╔${line}╗`);
  console.log(`║  ${title.padEnd(40)}║`);
  console.log(`╚${line}╝\n`);
}

async function confirm() {
  if (SKIP_CONFIRM) return true;

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question('  Fortfahren? Alle Daten gehen verloren. (yes/no): ', answer => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'yes');
    });
  });
}

async function dropMigrationsTable(client) {
  // Drop tracking table so all migrations run fresh
  try {
    const { Client } = require('pg');
    const pgClient = new Client({
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME     || 'prasco',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });
    await pgClient.connect();
    await pgClient.query('DROP TABLE IF EXISTS schema_migrations');
    await pgClient.end();
    console.log('✅ schema_migrations zurückgesetzt');
  } catch (err) {
    console.warn('⚠  schema_migrations konnte nicht zurückgesetzt werden:', err.message);
  }
}

async function main() {
  header('PRASCO Datenbank-Reset');

  console.log('  ⚠  WARNUNG: Diese Aktion löscht ALLE Daten!\n');
  console.log(`  Datenbank : ${process.env.DB_NAME || 'prasco'}`);
  console.log(`  Host      : ${process.env.DB_HOST || 'localhost'}`);
  console.log(`  Dialekt   : ${DIALECT}\n`);

  const ok = await confirm();
  if (!ok) {
    console.log('\n  Abgebrochen – keine Änderungen vorgenommen.\n');
    process.exit(0);
  }

  console.log('');

  // Require compiled output
  let sequelize, seedDatabase;
  try {
    ({ sequelize } = require('../dist/config/database'));
    ({ seedDatabase } = require('../dist/database/seeders'));
  } catch (err) {
    console.error('❌ Compiled dist/ not found. Run "npm run build" first.\n');
    process.exit(1);
  }

  try {
    console.log('🔌 Verbinde mit Datenbank...');
    await sequelize.authenticate();
    console.log('✅ Verbunden\n');

    // Load all models (required before sync)
    require('../dist/models');

    console.log('🗑  Lösche alle Tabellen (force: true)...');
    await sequelize.sync({ force: true });
    console.log('✅ Tabellen gelöscht und neu erstellt\n');

    // Reset migration tracking so next migrate run replays everything
    if (DIALECT === 'postgres') {
      await dropMigrationsTable();
    }

    console.log('🌱 Starte Seeding...\n');
    await seedDatabase();

    console.log('\n✅ Reset erfolgreich abgeschlossen!');
    console.log('\n👤 Standard-Zugänge:');
    console.log('   superadmin@prasco.net  /  superadmin123  (Super-Admin)');
    console.log('   admin@prasco.net       /  admin123       (Admin)');
    console.log('   editor@prasco.net      /  editor123      (Editor)');
  } catch (err) {
    console.error('\n❌ Reset fehlgeschlagen:', err.message);
    throw err;
  } finally {
    await sequelize.close();
  }

  console.log('');
}

main().catch(() => process.exit(1));
