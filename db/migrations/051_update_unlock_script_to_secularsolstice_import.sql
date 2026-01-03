-- Update program versions created by unlock-script to secularsolstice-import
UPDATE program_versions
SET created_by = 'secularsolstice-import'
WHERE created_by = 'unlock-script';