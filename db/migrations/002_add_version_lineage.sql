alter table song_versions
  add column if not exists next_version_id uuid references song_versions(id) on delete set null,
  add column if not exists original_version_id uuid references song_versions(id) on delete set null;

create index if not exists song_versions_next_version_idx on song_versions (next_version_id);
create index if not exists song_versions_original_version_idx on song_versions (original_version_id);

