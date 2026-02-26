-- Migration: Add Transit und Traffic Widget Support
-- Datum: 2026-02-18
-- Beschreibung: Tabellen für Live-Verkehrsdaten (ÖPNV & Autobahn)

-- ============================================
-- 1. Widget Settings Tabelle (allgemein)
-- ============================================
CREATE TABLE IF NOT EXISTS widget_settings (
  id SERIAL PRIMARY KEY,
  display_id INTEGER REFERENCES displays(id) ON DELETE CASCADE,
  widget_type VARCHAR(50) NOT NULL CHECK (widget_type IN ('transit', 'traffic', 'weather', 'calendar', 'news')),
  position INTEGER DEFAULT 0, -- Sortier-Reihenfolge
  refresh_interval INTEGER DEFAULT 60, -- Sekunden
  config JSONB DEFAULT '{}', -- Widget-spezifische Konfiguration
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE (display_id, widget_type, position)
);

CREATE INDEX idx_widget_settings_display ON widget_settings(display_id);
CREATE INDEX idx_widget_settings_type ON widget_settings(widget_type);
CREATE INDEX idx_widget_settings_active ON widget_settings(is_active);

-- ============================================
-- 2. Transit Konfigurationen
-- ============================================
CREATE TABLE IF NOT EXISTS transit_configurations (
  id SERIAL PRIMARY KEY,
  display_id INTEGER REFERENCES displays(id) ON DELETE CASCADE,
  station_id VARCHAR(100) NOT NULL, -- HAFAS Station ID
  station_name VARCHAR(255) NOT NULL,
  max_departures INTEGER DEFAULT 5 CHECK (max_departures > 0 AND max_departures <= 20),
  duration_minutes INTEGER DEFAULT 60 CHECK (duration_minutes > 0),
  lines_filter JSONB DEFAULT '[]', -- Array von Linien-Namen/IDs (leer = alle)
  modes_filter JSONB DEFAULT '[]', -- Array von Modi (train, bus, tram, subway, etc.)
  is_active BOOLEAN DEFAULT true,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transit_config_display ON transit_configurations(display_id);
CREATE INDEX idx_transit_config_station ON transit_configurations(station_id);
CREATE INDEX idx_transit_config_active ON transit_configurations(is_active);

-- ============================================
-- 3. Traffic Konfigurationen
-- ============================================
CREATE TABLE IF NOT EXISTS traffic_configurations (
  id SERIAL PRIMARY KEY,
  display_id INTEGER REFERENCES displays(id) ON DELETE CASCADE,
  highway_ids JSONB NOT NULL DEFAULT '[]', -- Array von Autobahn-IDs (z.B. ["A1", "A2", "A7"])
  region VARCHAR(100), -- Optional: Region-Filter
  show_roadworks BOOLEAN DEFAULT true,
  show_warnings BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_traffic_config_display ON traffic_configurations(display_id);
CREATE INDEX idx_traffic_config_active ON traffic_configurations(is_active);

-- ============================================
-- 4. System Settings für Transit/Traffic
-- ============================================
INSERT INTO settings (key, value, type, category, description)
VALUES 
  ('transit.enabled', 'true', 'boolean', 'widgets', 'ÖPNV-Widget aktiviert')
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value, type, category, description)
VALUES 
  ('transit.defaultStationId', '', 'string', 'widgets', 'Standard HAFAS Station ID für ÖPNV')
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value, type, category, description)
VALUES 
  ('transit.defaultStationName', '', 'string', 'widgets', 'Standard Station Name')
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value, type, category, description)
VALUES 
  ('transit.refreshInterval', '30', 'number', 'widgets', 'ÖPNV Refresh-Interval (Sekunden)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value, type, category, description)
VALUES 
  ('transit.cacheEnabled', 'true', 'boolean', 'widgets', 'ÖPNV Cache aktiviert')
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value, type, category, description)
VALUES 
  ('traffic.enabled', 'true', 'boolean', 'widgets', 'Verkehrslage-Widget aktiviert')
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value, type, category, description)
VALUES 
  ('traffic.defaultHighways', '["A1", "A2", "A3", "A7"]', 'json', 'widgets', 'Standard Autobahnen für Verkehrslage')
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value, type, category, description)
VALUES 
  ('traffic.refreshInterval', '300', 'number', 'widgets', 'Verkehrslage Refresh-Interval (Sekunden)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value, type, category, description)
VALUES 
  ('traffic.cacheEnabled', 'true', 'boolean', 'widgets', 'Verkehrslage Cache aktiviert')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 5. Update Trigger für updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für widget_settings
DROP TRIGGER IF EXISTS update_widget_settings_updated_at ON widget_settings;
CREATE TRIGGER update_widget_settings_updated_at
    BEFORE UPDATE ON widget_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger für transit_configurations
DROP TRIGGER IF EXISTS update_transit_config_updated_at ON transit_configurations;
CREATE TRIGGER update_transit_config_updated_at
    BEFORE UPDATE ON transit_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger für traffic_configurations
DROP TRIGGER IF EXISTS update_traffic_config_updated_at ON traffic_configurations;
CREATE TRIGGER update_traffic_config_updated_at
    BEFORE UPDATE ON traffic_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. Beispiel-Konfigurationen (Optional)
-- ============================================
-- Beispiel Transit-Konfiguration für München Hauptbahnhof
-- INSERT INTO transit_configurations (display_id, station_id, station_name, max_departures, mode_filter) 
-- VALUES (1, '8000261', 'München Hauptbahnhof', 10, '["train", "subway"]');

-- Beispiel Traffic-Konfiguration
-- INSERT INTO traffic_configurations (display_id, highway_ids)
-- VALUES (1, '["A1", "A8", "A9"]');

-- Migration erfolgreich
SELECT 'Migration 002_add_transit_traffic_widgets.sql erfolgreich ausgeführt' AS status;
