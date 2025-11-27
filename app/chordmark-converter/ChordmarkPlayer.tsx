'use client';

import { useMemo, useEffect, useState } from 'react';
import type { ParsedSong } from 'chord-mark';
import { extractChordEvents } from './chordUtils';
import { useChordPlayback } from './useChordPlayback';

interface ChordmarkPlayerProps {
  parsedSong: ParsedSong | null;
  onLineChange?: (lineIndex: number | null) => void;
  bpm?: number;
  onBpmChange?: (bpm: number) => void;
}

const ChordmarkPlayer = ({
  parsedSong,
  onLineChange,
  bpm = 90,
  onBpmChange,
}: ChordmarkPlayerProps) => {
  const chordEvents = useMemo(() => extractChordEvents(parsedSong), [parsedSong]);
  const hasChords = chordEvents.length > 0;
  const [startLine, setStartLine] = useState(0);
  const filteredChordEvents = useMemo(() => {
    if (chordEvents.length === 0) return [];
    const firstIndex = chordEvents.findIndex(event => event.lineIndex >= startLine);
    if (firstIndex === -1) return [];
    const startOffset = chordEvents[firstIndex].startBeat;
    return chordEvents.slice(firstIndex).map(event => ({
      ...event,
      startBeat: event.startBeat - startOffset,
    }));
  }, [chordEvents, startLine]);
  
  const {
    isPlaying,
    isLoading,
    currentChord,
    currentLineIndex,
    loadError,
    handlePlay,
    handleStop,
  } = useChordPlayback(filteredChordEvents, bpm);
  
  // Notify parent of line changes
  useEffect(() => {
    if (onLineChange) {
      onLineChange(currentLineIndex);
    }
  }, [currentLineIndex, onLineChange]);
  
  if (!hasChords) return null;
  
  return (
    <div className="flex flex-col gap-2 text-xs mb-2">
      <div className="flex items-center gap-2">
        <button
          onClick={isPlaying ? handleStop : handlePlay}
          disabled={isLoading}
          className="px-2 py-0.5 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? '...' : isPlaying ? '■' : '▶'}
        </button>
        {onBpmChange ? (
          <div className="flex items-center gap-1">
            <span className="text-gray-500">BPM:</span>
            <input
              type="number"
              value={bpm}
              onChange={(e) => onBpmChange(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-12 px-1 border border-gray-300 text-gray-900"
              min="1"
              max="300"
            />
          </div>
        ) : (
          <span className="text-gray-500">BPM: {bpm}</span>
        )}
        <div className="flex items-center gap-1">
          <span className="text-gray-500">Start line:</span>
          <input
            type="number"
            value={startLine}
            onChange={(e) => {
              const nextLine = Number.parseInt(e.target.value, 10);
              setStartLine(Number.isNaN(nextLine) ? 0 : Math.max(0, nextLine));
            }}
            className="w-16 px-1 border border-gray-300 text-gray-900"
            min="0"
          />
        </div>
        {currentChord && <span className="text-blue-600 font-medium">{currentChord}</span>}
        {loadError && <span className="text-red-600">{loadError}</span>}
      </div>
    </div>
  );
};

export default ChordmarkPlayer;
