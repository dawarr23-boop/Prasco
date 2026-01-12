-- Add 'presentation' to content_type enum
ALTER TYPE enum_posts_content_type ADD VALUE IF NOT EXISTS 'presentation';
