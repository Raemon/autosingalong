'use client';

import { useMemo, useState } from 'react';
import ChevronArrow from '@/app/components/ChevronArrow';
import { usePianoPlayback } from '../chordmark-converter/usePianoPlayback';

interface ChordButtonsProps {
  startCollapsed?: boolean;
}

const ChordButtons = ({ startCollapsed = false }: ChordButtonsProps) => {
  const { playSingleChord, currentChord, isLoading } = usePianoPlayback();
  const [isCollapsed, setIsCollapsed] = useState(startCollapsed);

  const chordGroups = useMemo(() => {
    const roots = ['C', 'D', 'E', 'F', 'G', 'A', 'Bb', 'B'];
    return [
      { label: 'Major:', chords: roots },
      { label: 'Minor:', chords: roots.map(r => `${r}m`) },
      { label: '5th:', chords: roots.map(r => `${r}5`) }
    ];
  }, []);

  const getButtonClass = (isActive: boolean, position: 'left' | 'center' | 'right') => {
    const base = 'font-mono text-xs py-0.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    const state = isActive ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-500 hover:bg-black/80 border-gray-300 text-gray-300';
    const variant = position === 'center' ? 'border px-2 w-8 text-gray-800 bg-gray-100 ' : position === 'left' ? 'border-l border-t border-b px-1 w-5' : 'border-r border-t border-b px-1 w-5';
    return `${base} ${state} ${variant}`;
  };

  return (
    <div className="flex flex-col gap-1">
      <button type="button" onClick={() => setIsCollapsed(!isCollapsed)} className="flex items-center gap-1 text-xs text-gray-400">
        <ChevronArrow isExpanded={!isCollapsed} />
        <span>Chord Palette</span>
      </button>
      {!isCollapsed && chordGroups.map(({ label, chords }) => (
        <div key={label} className="flex gap-1">
          <span className="w-12 text-gray-500 text-right pr-1">{label}</span>
          {chords.map((chord) => (
            <div key={chord} className="flex">
              <button onClick={() => playSingleChord(chord, -1)} disabled={isLoading} className={getButtonClass(currentChord === chord, 'left')} title="Low">-</button>
              <button onClick={() => playSingleChord(chord, 0)} disabled={isLoading} className={getButtonClass(currentChord === chord, 'center')}>{chord}</button>
              <button onClick={() => playSingleChord(chord, 1)} disabled={isLoading} className={getButtonClass(currentChord === chord, 'right')} title="High">+</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default ChordButtons;
