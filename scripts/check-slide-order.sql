-- Zeige alle Slides mit ihrer Priorität in der Reihenfolge wie sie vom Display geladen werden
SELECT 
    id,
    title,
    priority,
    created_at,
    SUBSTRING(title FROM 'Folie ([0-9]+)') as folie_nr
FROM posts
WHERE title LIKE '% - Folie %'
  AND is_active = true
ORDER BY priority DESC, created_at DESC
LIMIT 30;
