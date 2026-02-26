-- Migration: Add Display Support to PRASCO
-- Date: 2026-02-08
-- Description: Creates displays table, post_displays junction, and adds display_mode to posts

BEGIN;

-- 1. Create displays table
CREATE TABLE IF NOT EXISTS displays (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  identifier VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_displays_identifier ON displays(identifier);
CREATE INDEX idx_displays_organization_id ON displays(organization_id);
CREATE INDEX idx_displays_is_active ON displays(is_active);

-- 2. Create post_displays junction table
CREATE TABLE IF NOT EXISTS post_displays (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  display_id INTEGER NOT NULL REFERENCES displays(id) ON DELETE CASCADE,
  priority_override INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, display_id)
);

CREATE INDEX idx_post_displays_post_id ON post_displays(post_id);
CREATE INDEX idx_post_displays_display_id ON post_displays(display_id);

-- 3. Add display_mode column to posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'display_mode'
  ) THEN
    ALTER TABLE posts ADD COLUMN display_mode VARCHAR(20) DEFAULT 'all';
    
    -- Add check constraint
    ALTER TABLE posts ADD CONSTRAINT posts_display_mode_check 
      CHECK (display_mode IN ('all', 'specific'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_posts_display_mode ON posts(display_mode);

-- 4. Update existing posts to use 'all' mode (backwards compatibility)
UPDATE posts SET display_mode = 'all' WHERE display_mode IS NULL;

COMMIT;

-- Verify tables
SELECT 'displays' AS table_name, COUNT(*) AS row_count FROM displays
UNION ALL
SELECT 'post_displays', COUNT(*) FROM post_displays;

-- Show new column
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'posts' AND column_name = 'display_mode';
