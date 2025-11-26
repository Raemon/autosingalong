'use client';

import { useMemo } from 'react';
import { usePianoPlayback } from '../chordmark-converter/usePianoPlayback';

const ChordButtons = () => {
  const { playSingleChord, currentChord, isLoading } = usePianoPlayback();

  // Standard chord set: major, minor, and 5th chords
  const standardChords = useMemo(() => {
    const roots = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const major = roots.map(r => r);
    const minor = roots.map(r => `${r}m`);
    const fifth = roots.map(r => `${r}5`);
    return { major, minor, fifth };
  }, []);

  return (
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
  );
};

export default ChordButtons;
