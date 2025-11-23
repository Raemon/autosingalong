create extension if not exists "pgcrypto";

create table if not exists songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists songs_title_key on songs (title);

create table if not exists song_versions (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references songs(id) on delete cascade,
  label text not null,
  content text,
  audio_url text,
  previous_version_id uuid references song_versions(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists song_versions_song_id_idx on song_versions (song_id);
create index if not exists song_versions_prev_version_idx on song_versions (previous_version_id);
create index if not exists song_versions_song_label_idx on song_versions (song_id, label);

