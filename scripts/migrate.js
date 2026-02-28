#!/usr/bin/env node
/**
 * PRASCO Database Migration Runner
 *
 * Läuft alle ausstehenden SQL-Migrationsdateien aus migrations/ in sortierter
 * Reihenfolge und protokolliert sie in der Tabelle schema_migrations.
 *
 * Verwendung:
 *   node scripts/migrate.js          # Führt ausstehende Migrationen aus
 *   node scripts/migrate.js --status # Zeigt Migrations-Status
 *   node scripts/migrate.js --dry-run # Zeigt ausstehende Migrationen ohne Ausführen
 *
 * Hinweis: Für SQLite (DB_DIALECT=sqlite) werden Migrationen übersprungen,
 *          da sequelize.sync() das Schema automatisch verwaltet.
 */

'use strict';

require('dotenv').config();

const fs   = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');
const DIALECT        = process.env.DB_DIALECT || 'postgres';
const DRY_RUN        = process.argv.includes('--dry-run');
const STATUS_ONLY    = process.argv.includes('--status');

// ── Helpers ────────────────────────────────────────────────────────────────

function header(title) {
  const line = '═'.repeat(42);
  console.log(`\n╔${line}╗`);
  console.log(`║  ${title.padEnd(40)}║`);
  console.log(`╚${line}╝\n`);
}

function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Migrations-Verzeichnis nicht gefunden: ${MIGRATIONS_DIR}`);
  }
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();
}

// ── PostgreSQL ──────────────────────────────────────────────────────────────

async function runPostgres() {
  const { Client } = require('pg');

  const client = new Client({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME     || 'prasco',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  await client.connect();
  console.log(`✅ Verbunden mit PostgreSQL (${process.env.DB_HOST || 'localhost'}/${process.env.DB_NAME || 'prasco'})`);

  try {
    // Ensure tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version    VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const files   = getMigrationFiles();
    const applied = await client
      .query('SELECT version, applied_at FROM schema_migrations ORDER BY version')
      .then(r => new Map(r.rows.map(row => [row.version, row.applied_at])));

    if (STATUS_ONLY) {
      printStatus(files, applied);
      return;
    }

    const pending = files.filter(f => !applied.has(f));

    if (pending.length === 0) {
      console.log('✅ Alle Migrationen sind aktuell – nichts zu tun.\n');
      console.log(`   Insgesamt angewendet: ${applied.size}`);
      return;
    }

    console.log(`📦 ${pending.length} ausstehende Migration(en) gefunden:\n`);

    if (DRY_RUN) {
      pending.forEach(f => console.log(`   [DRY-RUN] ${f}`));
      console.log('\n⚠  Dry-run-Modus – keine Änderungen vorgenommen.');
      return;
    }

    let successCount = 0;
    for (const file of pending) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      console.log(`  → Ausführen: ${file}`);
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [file]
        );
        console.log(`  ✅ Angewendet: ${file}`);
        successCount++;
      } catch (err) {
        console.error(`\n❌ Migration fehlgeschlagen: ${file}`);
        console.error(`   Fehler: ${err.message}`);
        throw err;
      }
    }

    console.log(`\n✅ ${successCount} Migration(en) erfolgreich ausgeführt.`);
    console.log(`   Insgesamt angewendet: ${applied.size + successCount}`);

  } finally {
    await client.end();
  }
}

// ── SQLite ──────────────────────────────────────────────────────────────────

async function runSqlite() {
  console.log('ℹ  SQLite-Modus erkannt.');
  console.log('   Für SQLite wird das Schema automatisch via sequelize.sync() verwaltet.');
  console.log('   Manuelle SQL-Migrationen werden übersprungen.\n');

  const files   = getMigrationFiles();
  const pending = files; // All informational
  console.log(`   Vorhandene Migrations-Dateien (informell): ${files.length}`);
  files.forEach(f => console.log(`   - ${f}`));
  console.log('\n✅ SQLite: Keine SQL-Migrationen auszuführen.');
}

// ── Status Output ────────────────────────────────────────────────────────────

function printStatus(files, applied) {
  console.log('┌─────────────────────────────────────────────────┬─────────────────────────────┐');
  console.log('│ Migration                                         │ Status                      │');
  console.log('├─────────────────────────────────────────────────┼─────────────────────────────┤');
  for (const f of files) {
    const name  = f.padEnd(49);
    const date  = applied.get(f);
    const status = date
      ? `✅ ${date.toISOString().slice(0, 10)}`
      : '⏳ ausstehend';
    console.log(`│ ${name}│ ${status.padEnd(27)}│`);
  }
  console.log('└─────────────────────────────────────────────────┴─────────────────────────────┘');
  const pending = files.filter(f => !applied.has(f)).length;
  console.log(`\n  Angewendet: ${applied.size}  |  Ausstehend: ${pending}`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  header('PRASCO Migration Runner');

  if (DIALECT === 'sqlite') {
    await runSqlite();
  } else {
    await runPostgres();
  }

  console.log('');
}

main().catch(err => {
  console.error('\n❌ Migration fehlgeschlagen:', err.message);
  process.exit(1);
});
