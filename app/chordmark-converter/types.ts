// Re-export types from chord-mark module for convenience
// These types are defined in chord-mark.d.ts
export type {
  SongLine,
  ParsedSong,
  SectionLabelLine,
  TimeSignatureLine,
  KeyDeclarationLine,
  ChordLine,
  LyricLine,
  EmptyLine,
  Bar,
  Chord,
  TimeSignature,
  KeyDeclaration,
} from 'chord-mark';

export interface ChordEvent {
  chordSymbol: string;
  notes: string[];
  startBeat: number;
  durationBeats: number;
}
