-- Korrigiere Slide-Prioritäten: Folie 1 = höchste Priorität
-- Extrahiere Foliennummer aus Titel und berechne neue Priorität

UPDATE posts
SET priority = 20000 - CAST(
    SUBSTRING(title FROM 'Folie ([0-9]+)') AS INTEGER
),
    updated_at = NOW()
WHERE title LIKE '% - Folie %'
  AND content_type = 'image';

-- Zeige korrigierte Slides sortiert
SELECT 
    id,
    title,
    priority,
    SUBSTRING(title FROM 'Folie ([0-9]+)') as folie_nr
FROM posts
WHERE title LIKE '% - Folie %'
ORDER BY priority DESC
LIMIT 50;
