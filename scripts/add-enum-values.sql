-- Füge fehlende content_type Enum-Werte hinzu
ALTER TYPE enum_posts_content_type ADD VALUE 'presentation';
ALTER TYPE enum_posts_content_type ADD VALUE 'pdf';
ALTER TYPE enum_posts_content_type ADD VALUE 'word';
