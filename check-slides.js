const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/prasco.db');

db.all(`
  SELECT 
    p.id, 
    p.title, 
    p.content, 
    p.content_type, 
    p.media_id, 
    m.url as media_url,
    m.original_name
  FROM posts p 
  LEFT JOIN media m ON p.media_id = m.id 
  WHERE p.title LIKE '%Folie%' 
  ORDER BY p.id DESC 
  LIMIT 5
`, (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log(JSON.stringify(rows, null, 2));
  }
  db.close();
});
