-- Migration 006: Meeting-Benachrichtigungen (Dienstagsmeeting)
-- Fügt SMTP-Konfiguration und Meeting-Empfänger zur settings-Tabelle hinzu.

INSERT INTO settings (key, value, type, category, description, created_at, updated_at)
VALUES
  ('smtp.host',     '',      'string',  'smtp', 'SMTP-Server Hostname',                    NOW(), NOW()),
  ('smtp.port',     '587',   'number',  'smtp', 'SMTP-Port (Standard: 587)',               NOW(), NOW()),
  ('smtp.secure',   'false', 'boolean', 'smtp', 'TLS/SSL verwenden (Port 465)',            NOW(), NOW()),
  ('smtp.user',     '',      'string',  'smtp', 'SMTP-Benutzername / E-Mail-Adresse',      NOW(), NOW()),
  ('smtp.pass',     '',      'string',  'smtp', 'SMTP-Passwort',                           NOW(), NOW()),
  ('smtp.from',     '',      'string',  'smtp', 'Absender-Adresse (From)',                 NOW(), NOW()),
  ('meeting.recipients', '', 'string',  'meeting', 'Kommagetrennte E-Mail-Empfänger für Meeting-Benachrichtigungen', NOW(), NOW()),
  ('meeting.category.name', 'Dienstagsmeeting', 'string', 'meeting', 'Name der Meeting-Kategorie (Groß-/Kleinschreibung beachten)', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;
