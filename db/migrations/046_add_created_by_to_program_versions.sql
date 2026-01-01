-- Add created_by column to program_versions to track who made each change
ALTER TABLE program_versions ADD COLUMN created_by text;
