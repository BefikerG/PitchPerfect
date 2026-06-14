-- Delete test pitches created earlier with fake image domains
DELETE FROM pitches 
WHERE image_url LIKE '%test.com%' 
   OR image_url LIKE '%img.com%';
