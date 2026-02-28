-- Migration: Add device authorization fields to displays table
-- Date: 2026-02-27
-- Description: Enables device registration via serial number + MAC address

-- Create ENUM type for authorization status
DO $$ BEGIN
  CREATE TYPE authorization_status_enum AS ENUM ('pending', 'authorized', 'rejected', 'revoked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add device authorization columns
ALTER TABLE displays ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100) UNIQUE;
ALTER TABLE displays ADD COLUMN IF NOT EXISTS mac_address VARCHAR(17);
ALTER TABLE displays ADD COLUMN IF NOT EXISTS device_token VARCHAR(255) UNIQUE;
ALTER TABLE displays ADD COLUMN IF NOT EXISTS authorization_status VARCHAR(20) DEFAULT 'authorized' NOT NULL;
ALTER TABLE displays ADD COLUMN IF NOT EXISTS device_model VARCHAR(100);
ALTER TABLE displays ADD COLUMN IF NOT EXISTS device_os_version VARCHAR(50);
ALTER TABLE displays ADD COLUMN IF NOT EXISTS app_version VARCHAR(20);
ALTER TABLE displays ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE displays ADD COLUMN IF NOT EXISTS registered_at TIMESTAMP WITH TIME ZONE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_displays_authorization_status ON displays(authorization_status);
CREATE INDEX IF NOT EXISTS idx_displays_device_token ON displays(device_token);
CREATE INDEX IF NOT EXISTS idx_displays_serial_number ON displays(serial_number);

-- Set existing displays to 'authorized' (they were created manually)
UPDATE displays SET authorization_status = 'authorized' WHERE authorization_status IS NULL;
