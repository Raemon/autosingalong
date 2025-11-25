declare module 'chord-mark' {
  // Line Types
  export const lineTypes: {
    readonly CHORD: 'chord';
    readonly EMPTY_LINE: 'emptyLine';
    readonly KEY_DECLARATION: 'keyDeclaration';
    readonly LYRIC: 'lyric';
    readonly SECTION_LABEL: 'sectionLabel';
    readonly TIME_SIGNATURE: 'timeSignature';
  };

  // Base Types
  export interface TimeSignature {
    string: string;
    count: number;
    value: number;
    beatCount: number;
  }

  export interface KeyDeclaration {
    string: string;
    accidental: 'flat' | 'sharp';
    // Additional properties that may be present
    root?: string;
    symbol?: string;
  }

  // Alias for compatibility
  export type KeyModel = KeyDeclaration;

  export interface SectionLabel {
    string: string;
    label: string;
    multiplyTimes: number;
    copyIndex: number;
    rendered?: {
      label?: string;
      multiplier?: string;
    };
  }

  export interface LyricLineModel {
    lyrics: string;
    chordPositions: number[];
  }

  // Chord types (from chord-symbol, simplified)
  export interface ChordDef {
    root?: string;
    symbol?: string;
    bass?: string;
    numeral?: string;
    [key: string]: unknown; // chord-symbol has many properties
  }

  export interface Chord {
    string: string;
    model: ChordDef | string; // string is "NC" for "no chord"
    duration: number;
    beat: number;
    isPositioned: boolean;
    isInSubBeatGroup: boolean;
    isFirstOfSubBeat?: boolean;
    isLastOfSubBeat?: boolean;
  }

  export interface Bar {
    timeSignature: TimeSignature;
    allChords: Chord[];
    isRepeated: boolean;
    hasUnevenChordsDurations: boolean;
    lineHadTimeSignatureChange: boolean;
  }

  export interface ChordLineModel {
    allBars: Bar[];
    originalKey: KeyDeclaration;
    hasPositionedChords: boolean;
  }

  // Song Line Types
  export interface BaseSongLine {
    string: string;
    type: string;
    isFromSectionMultiply?: boolean;
    isFromSectionCopy?: boolean;
    isFromAutoRepeatChords?: boolean;
  }

  export interface EmptyLine extends BaseSongLine {
    type: 'emptyLine';
  }

  export interface ChordLineSongLine extends BaseSongLine {
    type: 'chord';
    model: ChordLineModel;
    isFromChordLineRepeater?: boolean;
    // Convenience properties matching code usage
    allBars: Bar[];
  }

  export interface LyricLineSongLine extends BaseSongLine {
    type: 'lyric';
    model: LyricLineModel;
    // Convenience properties matching code usage
    lyrics: string;
    chordPositions: number[];
  }

  export interface TimeSignatureLine extends BaseSongLine {
    type: 'timeSignature';
    model: TimeSignature;
    timeSignature: TimeSignature; // Convenience property matching code usage
  }

  export interface SectionLabelLine extends BaseSongLine {
    type: 'sectionLabel';
    model: SectionLabel;
    index: number;
    indexWithoutMultiply: number;
    id: string;
    // Convenience properties matching code usage
    label: string;
    copyIndex: number;
    multiplyTimes: number;
  }

  export interface KeyDeclarationLine extends BaseSongLine {
    type: 'keyDeclaration';
    model: KeyDeclaration;
    symbol?: string;
    // Convenience properties for chord-symbol compatibility
    root?: string;
  }

  export type SongLine =
    | EmptyLine
    | ChordLineSongLine
    | LyricLineSongLine
    | TimeSignatureLine
    | SectionLabelLine
    | KeyDeclarationLine;

  // Type aliases for convenience (matching usage in codebase)
  export type ChordLine = ChordLineSongLine;
  export type LyricLine = LyricLineSongLine;

  // Song Types
  export interface SongChord {
    model: ChordDef;
    occurrences: number;
    duration: number;
    isFirst?: boolean;
    isLast?: boolean;
  }

  export interface SongKeys {
    auto?: KeyDeclaration;
    explicit: KeyDeclaration[];
  }

  export interface ParsedSong {
    allLines: SongLine[];
    allChords: SongChord[];
    allKeys: SongKeys;
  }

  // Render Options
  export interface RenderSongOptions {
    accidentalsType?: 'auto' | 'flat' | 'sharp';
    alignBars?: boolean;
    alignChordsWithLyrics?: boolean;
    autoRepeatChords?: boolean;
    chartType?: 'all' | 'lyrics' | 'chords' | 'chordsFirstLyricLine';
    chordSymbolRenderer?: ((...args: unknown[]) => unknown) | boolean;
    symbolType?: 'chord' | 'roman';
    customRenderer?: ((...args: unknown[]) => unknown) | boolean;
    expandSectionCopy?: boolean;
    expandSectionMultiply?: boolean;
    simplifyChords?: boolean | 'none' | 'max' | 'core';
    printChordsDuration?: 'never' | 'uneven' | 'always';
    printBarSeparators?: 'never' | 'grids' | 'always';
    printSubBeatDelimiters?: boolean;
    printInlineTimeSignatures?: boolean;
    transposeValue?: number;
    useShortNamings?: boolean;
    windowObject?: unknown; // JSDOM window object for Node.js
    wrapChordLyricLines?: boolean;
  }

  // Functions
  export function parseSong(
    songSrc: string | string[],
    options?: { windowObject?: unknown }
  ): ParsedSong;

  export function renderSong(
    parsedSong: ParsedSong,
    options?: RenderSongOptions
  ): string;
}
