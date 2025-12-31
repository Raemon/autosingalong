import type { Song } from '../songs/types';
import { ParsedLine, StatusType } from '../../src/components/slides/types';

export type Section = {
  title: string;
  content: string;
  lines: ParsedLine[];
};

export type ProcessResult = {
  title: string;
  matched: boolean;
  songId?: string;
  error?: string;
};

export type CandidateSong = {
  song: Song;
  similarity: number;
};

export type PreviewItem = {
  sectionTitle: string;
  song: Song | null;
  candidateSongs: CandidateSong[];
  selectedVersionId: string | null;
  versionName: string;
  content: string;
  contentPreview: string;
};

export type { Song, ParsedLine, StatusType };
