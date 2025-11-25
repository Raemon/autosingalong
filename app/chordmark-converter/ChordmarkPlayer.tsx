'use client';

import { useState, useMemo } from 'react';
import type { ParsedSong } from 'chord-mark';
import { extractChordEvents } from './chordUtils';
import { useChordPlayback } from './useChordPlayback';

const ChordmarkPlayer = ({parsedSong}: {parsedSong: ParsedSong | null}) => {
  const [bpm, setBpm] = useState(90);
  const [bpmInput, setBpmInput] = useState('90');
  
  const chordEvents = useMemo(() => extractChordEvents(parsedSong), [parsedSong]);
  const hasChords = chordEvents.length > 0;
  
  const {
    isPlaying,
    isLoading,
    currentChord,
    loadError,
    handlePlay,
    handleStop,
  } = useChordPlayback(chordEvents, bpm);
  
  const handleBpmBlur = () => {
    const val = parseInt(bpmInput) || 90;
    const clamped = Math.max(30, Math.min(300, val));
    setBpm(clamped);
    setBpmInput(String(clamped));
  };
  
  if (!hasChords) return null;
  
  return (
    <div className="flex items-center gap-2 text-xs mb-2">
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
  );
};

export default ChordmarkPlayer;
