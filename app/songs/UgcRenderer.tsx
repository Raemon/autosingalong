'use client';

import React, { useState, useMemo, useEffect } from 'react';
import TransposeControls from '../chordmark-converter/TransposeControls';

// Chord transposition utilities
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const normalizeNote = (note: string): { index: number; usesFlats: boolean } | null => {
  const upper = note.toUpperCase();
  let idx = NOTES.indexOf(upper);
  if (idx >= 0) return { index: idx, usesFlats: false };
  idx = NOTES_FLAT.indexOf(upper.charAt(0).toUpperCase() + upper.slice(1));
  if (idx >= 0) return { index: idx, usesFlats: true };
  // Handle double sharps/flats and edge cases
  const baseNote = upper.charAt(0);
  const modifier = upper.slice(1);
  const baseIdx = NOTES.indexOf(baseNote);
  if (baseIdx < 0) return null;
  let offset = 0;
  if (modifier === '#' || modifier === '♯') offset = 1;
  else if (modifier === 'B' || modifier === 'b' || modifier === '♭') offset = -1;
  else if (modifier === '##') offset = 2;
  else if (modifier === 'BB' || modifier === 'bb') offset = -2;
  return { index: (baseIdx + offset + 12) % 12, usesFlats: modifier.toLowerCase().includes('b') };
};

const transposeChord = (chord: string, steps: number): string => {
  if (steps === 0) return chord;
  // Match chord root note (with optional sharp/flat) at the start
  const match = chord.match(/^([A-Ga-g][#b♯♭]?)/);
  if (!match) return chord;
  const root = match[1];
  const rest = chord.slice(root.length);
  const normalized = normalizeNote(root);
  if (!normalized) return chord;
  const newIndex = (normalized.index + steps + 120) % 12;
  const newRoot = normalized.usesFlats ? NOTES_FLAT[newIndex] : NOTES[newIndex];
  // Handle bass note if present (e.g., Am/G)
  const bassMatch = rest.match(/\/([A-Ga-g][#b♯♭]?)$/);
  if (bassMatch) {
    const bassNote = bassMatch[1];
    const bassNormalized = normalizeNote(bassNote);
    if (bassNormalized) {
      const newBassIndex = (bassNormalized.index + steps + 120) % 12;
      const newBass = bassNormalized.usesFlats ? NOTES_FLAT[newBassIndex] : NOTES[newBassIndex];
      const middlePart = rest.slice(0, rest.length - bassMatch[0].length);
      return newRoot + middlePart + '/' + newBass;
    }
  }
  return newRoot + rest;
};

// Regex to match chord symbols - matches chords like A, Am, A7, Am7, Amaj7, Asus4, A/G, etc.
const CHORD_REGEX = /\b([A-Ga-g][#b♯♭]?(?:m|maj|min|aug|dim|sus|add)?[0-9]?(?:\/[A-Ga-g][#b♯♭]?)?)\b/g;

type LineType = 'chord' | 'lyric' | 'empty' | 'section' | 'header';

interface ParsedLine {
  type: LineType;
  content: string;
  chords?: { chord: string; position: number }[];
}

const isChordLine = (line: string): boolean => {
  const trimmed = line.trim();
  if (!trimmed) return false;
  // If it starts with [, it's a section marker
  if (trimmed.startsWith('[')) return false;
  // Check if the line is mostly chords (by checking the ratio of chord characters to total)
  const words = trimmed.split(/\s+/);
  const chordPattern = /^[A-Ga-g][#b♯♭]?(?:m|maj|min|aug|dim|sus|add)?[0-9]?(?:\/[A-Ga-g][#b♯♭]?)?$/;
  const chordWords = words.filter(w => chordPattern.test(w));
  // Consider it a chord line if more than 70% of words are chords or if all words are chords
  return chordWords.length > 0 && (chordWords.length === words.length || chordWords.length / words.length > 0.7);
};

const isSectionMarker = (line: string): boolean => {
  const trimmed = line.trim();
  // Match [Chorus], [Verse], [[Instrumental]], etc.
  return /^\[{1,2}[^\]]+\]{1,2}$/.test(trimmed);
};

const isHeaderLine = (line: string): boolean => {
  const trimmed = line.trim();
  // Match lines that are all dashes or title headers
  return /^-{3,}$/.test(trimmed);
};

const parseLine = (line: string): ParsedLine => {
  if (!line.trim()) {
    return { type: 'empty', content: '' };
  }
  if (isHeaderLine(line)) {
    return { type: 'header', content: line };
  }
  if (isSectionMarker(line)) {
    return { type: 'section', content: line.trim() };
  }
  if (isChordLine(line)) {
    // Parse chord positions
    const chords: { chord: string; position: number }[] = [];
    let match;
    const regex = new RegExp(CHORD_REGEX.source, 'g');
    while ((match = regex.exec(line)) !== null) {
      chords.push({ chord: match[1], position: match.index });
    }
    return { type: 'chord', content: line, chords };
  }
  return { type: 'lyric', content: line };
};

const UGC_STYLES = `
  .ugc-renderer {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px;
    line-height: 1.4;
  }
  .ugc-renderer .ugc-line {
    display: block;
    min-height: 1em;
    white-space: pre;
  }
  .ugc-renderer .ugc-chord-line {
    color: #aaa;
  }
  .ugc-renderer .ugc-chord {
    color: #aaa;
    font-weight: 500;
  }
  .ugc-renderer .ugc-lyric-line {
    color: inherit;
  }
  .ugc-renderer .ugc-section {
    color: #888;
    font-weight: 600;
  }
  .ugc-renderer .ugc-bracket-meta {
    color: #888;
    font-style: italic;
  }
  .ugc-renderer .ugc-header {
    color: #666;
  }
  .ugc-renderer .ugc-empty {
    min-height: 0.5em;
  }
`;

const renderChordLine = (line: ParsedLine, transposeSteps: number): React.ReactElement => {
  if (!line.chords || line.chords.length === 0) {
    return <span className="ugc-chord-line">{line.content}</span>;
  }
  // Build the line with transposed chords in their original positions
  const result: (string | React.ReactElement)[] = [];
  let lastEnd = 0;
  line.chords.forEach((chordInfo, idx) => {
    // Add any text/spaces before this chord
    if (chordInfo.position > lastEnd) {
      result.push(line.content.slice(lastEnd, chordInfo.position));
    }
    const transposed = transposeChord(chordInfo.chord, transposeSteps);
    result.push(<span key={idx} className="ugc-chord">{transposed}</span>);
    lastEnd = chordInfo.position + chordInfo.chord.length;
  });
  // Add any remaining content
  if (lastEnd < line.content.length) {
    result.push(line.content.slice(lastEnd));
  }
  return <span className="ugc-chord-line">{result}</span>;
};

const renderLine = (line: ParsedLine, index: number, transposeSteps: number): React.ReactElement => {
  switch (line.type) {
    case 'empty':
      return <div key={index} className="ugc-line ugc-empty">&nbsp;</div>;
    case 'header':
      return <div key={index} className="ugc-line ugc-header">{line.content}</div>;
    case 'section':
      return <div key={index} className="ugc-line ugc-section ugc-bracket-meta">{line.content}</div>;
    case 'chord':
      return <div key={index} className="ugc-line">{renderChordLine(line, transposeSteps)}</div>;
    case 'lyric':
    default:
      return <div key={index} className="ugc-line ugc-lyric-line">{line.content}</div>;
  }
};

const UgcRenderer = ({content, initialTranspose = 0}: {content: string; initialTranspose?: number}) => {
  const [transposeSteps, setTransposeSteps] = useState(initialTranspose);

  useEffect(() => {
    setTransposeSteps(initialTranspose);
  }, [initialTranspose]);

  const parsedLines = useMemo(() => {
    return content.split('\n').map(parseLine);
  }, [content]);

  return (
    <div className="ugc-renderer-wrapper">
      <style dangerouslySetInnerHTML={{ __html: UGC_STYLES }} />
      <div className="flex items-center justify-end mb-2">
        <TransposeControls value={transposeSteps} onChange={setTransposeSteps} />
      </div>
      <div className="ugc-renderer">
        {parsedLines.map((line, index) => renderLine(line, index, transposeSteps))}
      </div>
    </div>
  );
};

export default UgcRenderer;
