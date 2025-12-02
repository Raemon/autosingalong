-- Only add 'song' tag to songs that don't already have it
-- This is idempotent - safe to run multiple times
-- It will only add the tag to songs that don't have it yet
update songs
set tags = array_append(tags, 'song')
where 'song' != all(tags);

