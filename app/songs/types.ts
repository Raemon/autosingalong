export type SongVersion = {
  id: string;
  label: string;
  content: string | null;
  audioUrl: string | null;
  previousVersionId: string | null;
  createdAt: string;
};

export type Song = {
  id: string;
  title: string;
  createdAt: string;
  versions: SongVersion[];
};

