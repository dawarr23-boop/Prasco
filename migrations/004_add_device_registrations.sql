-- Migration: Add Device Registrations for Client Software Validation
-- Date: 2026-02-27
-- Description: Creates device_registrations table to authorize clients by serial number and virtual MAC address

BEGIN;

-- Create device_registrations table
CREATE TABLE IF NOT EXISTS device_registrations (
  id SERIAL PRIMARY KEY,
  serial_number VARCHAR(255) NOT NULL UNIQUE,
  mac_address VARCHAR(17) NOT NULL,
  device_name VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  display_id INTEGER REFERENCES displays(id) ON DELETE SET NULL,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
  notes TEXT,
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_device_registrations_serial_number ON device_registrations(serial_number);
CREATE INDEX IF NOT EXISTS idx_device_registrations_mac_address ON device_registrations(mac_address);
CREATE INDEX IF NOT EXISTS idx_device_registrations_status ON device_registrations(status);
CREATE INDEX IF NOT EXISTS idx_device_registrations_display_id ON device_registrations(display_id);
CREATE INDEX IF NOT EXISTS idx_device_registrations_organization_id ON device_registrations(organization_id);

COMMIT;

-- Verify table
SELECT 'device_registrations' AS table_name, COUNT(*) AS row_count FROM device_registrations;
