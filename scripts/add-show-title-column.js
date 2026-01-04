const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'prasco.db');
const db = new sqlite3.Database(dbPath);

console.log('Füge show_title Spalte zur posts Tabelle hinzu...');

db.run(`
  ALTER TABLE posts ADD COLUMN show_title INTEGER DEFAULT 0;
`, (err) => {
  if (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('✅ Spalte show_title existiert bereits');
    } else {
      console.error('❌ Fehler beim Hinzufügen der Spalte:', err.message);
    }
  } else {
    console.log('✅ Spalte show_title erfolgreich hinzugefügt');
  }
  
  db.close();
});
