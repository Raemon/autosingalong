-- Add unique constraint to prevent duplicate votes per user/version/category
CREATE UNIQUE INDEX IF NOT EXISTS votes_version_id_user_id_category_idx
ON votes (version_id, user_id, category) WHERE (user_id IS NOT NULL);
