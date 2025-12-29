-- Add index optimized for DISTINCT ON (song_id, label) ORDER BY created_at DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS song_versions_song_label_created_idx 
  ON song_versions (song_id, label, created_at DESC);
