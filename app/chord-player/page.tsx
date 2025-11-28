'use client';

import { useState } from 'react';
import ChordmarkEditor from '../chordmark-converter/ChordmarkEditor';
import ChordButtons from './ChordButtons';

export default function ChordPlayerPage() {
  const [chordmark, setChordmark] = useState('');

  return (
    <div className="p-4 space-y-4">
      <ChordButtons />
      <ChordmarkEditor value={chordmark} onChange={setChordmark} autosaveKey="chord-player" />
    </div>
  );
}
