-- Add program_id column to votes to track which program context a vote was made in
ALTER TABLE votes ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES programs(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS votes_program_id_idx ON votes USING btree (program_id);
