-- Migration: Add sound_enabled column to posts
-- Date: 2026-02-28
-- Description: Adds per-post sound enable/disable toggle for video posts

BEGIN;

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN DEFAULT true;

COMMENT ON COLUMN posts.sound_enabled IS 'Whether sound/audio is enabled for this post (video posts)';

COMMIT;
