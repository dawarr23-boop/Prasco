-- Aktualisiere Prioritäten für alle Presentation-Slides
-- Slides mit Priorität zwischen 1000-2000 werden auf 10000+ gesetzt

UPDATE posts
SET priority = priority + 9000,
    updated_at = NOW()
WHERE priority >= 1000 
  AND priority < 2000
  AND content_type = 'image'
  AND title LIKE '% - Folie %';

-- Zeige aktualisierte Slides sortiert nach Priorität
SELECT 
    id,
    title,
    priority,
    content_type,
    created_at
FROM posts
WHERE title LIKE '% - Folie %'
ORDER BY priority DESC
LIMIT 50;
