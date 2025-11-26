'use client';

import { useState, useMemo, useEffect } from 'react';
import type { ParsedSong } from 'chord-mark';
import { extractChordEvents } from './chordUtils';
import { useChordPlayback } from './useChordPlayback';

interface ChordmarkPlayerProps {
  parsedSong: ParsedSong | null;
  onLineChange?: (lineIndex: number | null) => void;
}

const ChordmarkPlayer = ({
  parsedSong,
  onLineChange,
}: ChordmarkPlayerProps) => {
  const [bpm, setBpm] = useState(90);
  const [bpmInput, setBpmInput] = useState('90');
  
  const chordEvents = useMemo(() => extractChordEvents(parsedSong), [parsedSong]);
  const hasChords = chordEvents.length > 0;
  
  // Standard chord set: major, minor, and 5th chords
  const standardChords = useMemo(() => {
    const roots = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const major = roots.map(r => r);
    const minor = roots.map(r => `${r}m`);
    const fifth = roots.map(r => `${r}5`);
    return { major, minor, fifth };
  }, []);
  
  const {
    isPlaying,
    isLoading,
    currentChord,
    currentLineIndex,
    loadError,
    handlePlay,
    handleStop,
    playSingleChord,
  } = useChordPlayback(chordEvents, bpm);
  
  const handleBpmBlur = () => {
    const val = parseInt(bpmInput) || 90;
    const clamped = Math.max(30, Math.min(300, val));
    setBpm(clamped);
    setBpmInput(String(clamped));
  };
  
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
        <label className="flex items-center gap-1">
          <span className="text-gray-500">BPM:</span>
          <input
            type="number"
            value={bpmInput}
            onChange={(e) => setBpmInput(e.target.value)}
            onBlur={handleBpmBlur}
            className="w-12 px-1 py-0.5 border text-center"
            min={30}
            max={300}
          />
        </label>
        {currentChord && <span className="text-blue-600 font-medium">{currentChord}</span>}
        {loadError && <span className="text-red-600">{loadError}</span>}
      </div>
      
      {/* Standard chord buttons */}
      <div className="flex flex-col gap-1">
        <div className="flex gap-1">
          <span className="w-12 text-gray-500 text-right pr-1">Major:</span>
          {standardChords.major.map((chord) => (
            <button
              key={chord}
              onClick={() => playSingleChord(chord)}
              disabled={isLoading}
              className={`px-2 py-0.5 border rounded font-mono text-xs transition-colors
                ${currentChord === chord 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white hover:bg-gray-100 border-gray-300 text-gray-700'
                }
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {chord}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <span className="w-12 text-gray-500 text-right pr-1">Minor:</span>
          {standardChords.minor.map((chord) => (
            <button
              key={chord}
              onClick={() => playSingleChord(chord)}
              disabled={isLoading}
              className={`px-2 py-0.5 border rounded font-mono text-xs transition-colors
                ${currentChord === chord 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white hover:bg-gray-100 border-gray-300 text-gray-700'
                }
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {chord}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <span className="w-12 text-gray-500 text-right pr-1">5th:</span>
          {standardChords.fifth.map((chord) => (
            <button
              key={chord}
              onClick={() => playSingleChord(chord)}
              disabled={isLoading}
              className={`px-2 py-0.5 border rounded font-mono text-xs transition-colors
                ${currentChord === chord 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white hover:bg-gray-100 border-gray-300 text-gray-700'
                }
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {chord}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChordmarkPlayer;
