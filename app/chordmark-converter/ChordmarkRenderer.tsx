'use client';

import { useState, useMemo } from 'react';
import { parseSong, renderSong, lineTypes } from 'chord-mark';
import type { SongLine, ChordLine, LyricLine, Bar, Chord } from 'chord-mark';
import { extractTextFromHTML, convertCustomFormatToChordmark, prepareSongForRendering } from './utils';

export type ChordmarkViewMode = 'lyrics+chords' | 'one-line' | 'lyrics' | 'chords' | 'raw';

const CHORDMARK_STYLES = `
  .styled-chordmark .cmSong {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    white-space: pre;
    font-variant-ligatures: none;
  }
  .styled-chordmark .cmSong * {
    font-family: inherit;
    white-space: inherit;
  }
  .styled-chordmark .cmSong p {
    margin: 0;
    line-height: 1.2;
  }
  .styled-chordmark .cmSong p + p {
    margin-top: 0.25em;
  }
  .styled-chordmark .cmSong .cmLine,
  .styled-chordmark .cmSong .cmChordLine,
  .styled-chordmark .cmSong .cmLyricLine,
  .styled-chordmark .cmSong .cmChordLyricLine,
  .styled-chordmark .cmSong .cmSectionLabel,
  .styled-chordmark .cmSong .cmEmptyLine {
    display: block;
  }
  .styled-chordmark .cmSong .cmChordLyricPair {
    display: inline-flex;
    gap: 1ch;
  }
  .styled-chordmark .cmSong .cmChordLineOffset,
  .styled-chordmark .cmSong .cmChordSymbol,
  .styled-chordmark .cmSong .cmChordDuration,
  .styled-chordmark .cmSong .cmBarSeparator,
  .styled-chordmark .cmSong .cmTimeSignature,
  .styled-chordmark .cmSong .cmSubBeatGroupOpener,
  .styled-chordmark .cmSong .cmSubBeatGroupCloser {
    white-space: inherit;
    color: #aaa;
  }
  .styled-chordmark .cmSong .cmLyricLine,
  .styled-chordmark .cmSong .cmLyric {
    color: #000;
  }
  .styled-chordmark .cmSong .cmSectionLabel {
    font-weight: 600;
  }
  .styled-chordmark .cmSong .cmEmptyLine {
    min-height: 0.5em;
  }
`;

export const useChordmarkParser = (content: string) => {
  return useMemo<{ song: ReturnType<typeof parseSong> | null; error: string | null }>(() => {
    if (!content.trim()) {
      return { song: null, error: null };
    }

    try {
      let textToParse = content.trim();
      
      if (textToParse.startsWith('<') && textToParse.includes('>')) {
        textToParse = extractTextFromHTML(textToParse);
      }

      if (!textToParse) {
        return { song: null, error: null };
      }

      try {
        return { song: parseSong(textToParse), error: null };
      } catch {
        const customResult = convertCustomFormatToChordmark(textToParse);
        if (customResult !== textToParse) {
          try {
            return { song: parseSong(customResult), error: null };
          } catch {
            return { song: null, error: 'Could not parse input as valid chordmark' };
          }
        }
        return { song: null, error: 'Could not parse input as valid chordmark' };
      }
    } catch (err) {
      return { song: null, error: err instanceof Error ? err.message : 'An error occurred during parsing' };
    }
  }, [content]);
};

export const useChordmarkRenderer = (parsedSong: ReturnType<typeof parseSong> | null) => {
  const songForRendering = useMemo(() => {
    if (!parsedSong) return null;
    return prepareSongForRendering(parsedSong);
  }, [parsedSong]);

  return useMemo(() => {
    if (!songForRendering) {
      return { htmlFull: '', htmlChordsOnly: '', htmlLyricsOnly: '', renderError: null };
    }

    try {
      const htmlFull = renderSong(songForRendering, { chartType: 'all' });
      const htmlChordsOnly = renderSong(songForRendering, { chartType: 'chords', alignChordsWithLyrics: false });
      const htmlLyricsOnly = renderSong(songForRendering, { chartType: 'lyrics' });

      return { htmlFull, htmlChordsOnly, htmlLyricsOnly, renderError: null };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred during rendering';
      return { htmlFull: '', htmlChordsOnly: '', htmlLyricsOnly: '', renderError: errorMsg };
    }
  }, [songForRendering]);
};

const isChordLine = (line: SongLine): line is ChordLine => line.type === lineTypes.CHORD;
const isLyricLine = (line: SongLine): line is LyricLine => line.type === lineTypes.LYRIC;

const extractChordsFromLine = (line: ChordLine): string[] => {
  const chords: string[] = [];
  line.model?.allBars?.forEach((bar: Bar) => {
    bar.allChords?.forEach((chord: Chord) => {
      if (chord.string) chords.push(chord.string);
    });
  });
  return chords;
};

const renderOneLineView = (parsedSong: ReturnType<typeof parseSong> | null): string => {
  if (!parsedSong?.allLines) return '';
  
  const lines = parsedSong.allLines;
  const outputLines: string[] = [];
  let currentChords: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.type === lineTypes.SECTION_LABEL) {
      if (outputLines.length > 0) outputLines.push('');
      const label = (line as { label?: string }).label || '';
      outputLines.push(`[${label.toUpperCase()}]`);
      currentChords = [];
    } else if (line.type === lineTypes.EMPTY_LINE) {
      if (currentChords.length > 0) {
        outputLines.push(currentChords.map(c => `[${c}]`).join(' '));
        currentChords = [];
      }
      outputLines.push('');
    } else if (isChordLine(line)) {
      currentChords = extractChordsFromLine(line);
    } else if (isLyricLine(line)) {
      const lyrics = line.model?.lyrics || '';
      const positions = line.model?.chordPositions || [];
      
      if (positions.length > 0 && currentChords.length > 0) {
        let result = '';
        let lastPos = 0;
        const sortedPositions = [...positions].sort((a, b) => a - b);
        
        for (let j = 0; j < sortedPositions.length && j < currentChords.length; j++) {
          const pos = sortedPositions[j];
          if (pos > lastPos) {
            result += lyrics.slice(lastPos, pos);
          }
          result += `[${currentChords[j]}]`;
          lastPos = pos;
        }
        result += lyrics.slice(lastPos);
        
        if (currentChords.length > sortedPositions.length) {
          const remaining = currentChords.slice(sortedPositions.length);
          result += ' ' + remaining.map(c => `[${c}]`).join(' ');
        }
        
        outputLines.push(result);
      } else if (currentChords.length > 0) {
        outputLines.push(currentChords.map(c => `[${c}]`).join(' ') + ' ' + lyrics);
      } else {
        outputLines.push(lyrics);
      }
      currentChords = [];
    }
  }
  
  if (currentChords.length > 0) {
    outputLines.push(currentChords.map(c => `[${c}]`).join(' '));
  }
  
  return outputLines.join('\n');
};

const ChordmarkTabs = ({mode, onModeChange}: {mode: ChordmarkViewMode, onModeChange: (mode: ChordmarkViewMode) => void}) => {
  const tabs: {id: ChordmarkViewMode, label: string}[] = [
    { id: 'lyrics+chords', label: 'Lyrics + Chords' },
    { id: 'one-line', label: 'One-Line' },
    { id: 'lyrics', label: 'Lyrics' },
    { id: 'chords', label: 'Chords' },
    { id: 'raw', label: 'Raw' },
  ];

  return (
    <div className="flex gap-1 mb-2">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onModeChange(tab.id)}
          className={`px-2 py-0.5 text-xs ${mode === tab.id ? 'bg-gray-200 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

const ChordmarkRenderer = ({content, defaultMode = 'lyrics+chords', showTabs = true}: {
  content: string;
  defaultMode?: ChordmarkViewMode;
  showTabs?: boolean;
}) => {
  const [mode, setMode] = useState<ChordmarkViewMode>(defaultMode);
  const parsedSong = useChordmarkParser(content);
  const renderedOutputs = useChordmarkRenderer(parsedSong.song);

  const error = parsedSong.error || renderedOutputs.renderError;

  const renderContent = () => {
    if (mode === 'raw') {
      return <pre className="text-xs font-mono whitespace-pre-wrap">{content}</pre>;
    }

    if (error) {
      return <pre className="text-xs font-mono whitespace-pre-wrap">{content}</pre>;
    }

    let html = '';
    if (mode === 'lyrics+chords') {
      html = renderedOutputs.htmlFull;
    } else if (mode === 'lyrics') {
      html = renderedOutputs.htmlLyricsOnly;
    } else if (mode === 'chords') {
      html = renderedOutputs.htmlChordsOnly;
    }

    if (!html) {
      return <pre className="text-xs font-mono whitespace-pre-wrap">{content}</pre>;
    }

    // Don't apply CSS styling for chords-only mode
    if (mode === 'chords') {
      return <div className="text-xs font-mono" dangerouslySetInnerHTML={{ __html: html }} />;
    }

    return <div className="styled-chordmark text-xs" dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: CHORDMARK_STYLES }} />
      {showTabs && <ChordmarkTabs mode={mode} onModeChange={setMode} />}
      {error && mode !== 'raw' && (
        <div className="mb-2 p-1 bg-red-100 text-red-800 text-xs">{error}</div>
      )}
      {renderContent()}
    </div>
  );
};

export default ChordmarkRenderer;

