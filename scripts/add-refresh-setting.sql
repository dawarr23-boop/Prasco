-- Füge Auto-Refresh Einstellung hinzu
INSERT INTO settings (key, value, type, category, description, created_at, updated_at) 
VALUES ('display.refreshInterval', '5', 'number', 'display', 'Auto-Refresh Intervall in Minuten', NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Füge Standard-Display-Duration hinzu falls nicht vorhanden
INSERT INTO settings (key, value, type, category, description, created_at, updated_at) 
VALUES ('display.defaultDuration', '10', 'number', 'display', 'Standard Anzeigedauer in Sekunden', NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
