-- Publish existing assignments so students can see them
UPDATE assignments 
SET is_published = true 
WHERE id IN (
  SELECT id 
  FROM assignments 
  WHERE is_published = false 
  LIMIT 3
);