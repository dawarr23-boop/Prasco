-- Prüfe Slide-Prioritäten
SELECT id, title, priority, created_at
FROM posts
WHERE title LIKE '%Folie%'
ORDER BY priority DESC
LIMIT 30;
