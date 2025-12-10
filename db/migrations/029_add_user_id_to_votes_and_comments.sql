-- Add user_id column to votes table
ALTER TABLE votes ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE CASCADE;

-- Add user_id column to comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS votes_user_id_idx ON votes USING btree (user_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON comments USING btree (user_id);

