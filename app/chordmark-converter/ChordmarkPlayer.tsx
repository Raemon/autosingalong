'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { lineTypes } from 'chord-mark';
import type { ParsedSong, ChordLine } from 'chord-mark';
import { Chord as TonalChord } from 'tonal';

type ToneModule = typeof import('tone');
type SamplerInstance = import('tone').Sampler;

interface ChordEvent {
  chordSymbol: string;
  notes: string[];
  startBeat: number;
  durationBeats: number;
}

const isChordLine = (line: { type: string }): line is ChordLine => line.type === lineTypes.CHORD;

// Salamander Grand Piano samples hosted on a CDN
const PIANO_SAMPLES_BASE = 'https://tonejs.github.io/audio/salamander/';
const PIANO_SAMPLES: Record<string, string> = {
  'A0': 'A0.mp3', 'C1': 'C1.mp3', 'D#1': 'Ds1.mp3', 'F#1': 'Fs1.mp3',
  'A1': 'A1.mp3', 'C2': 'C2.mp3', 'D#2': 'Ds2.mp3', 'F#2': 'Fs2.mp3',
  'A2': 'A2.mp3', 'C3': 'C3.mp3', 'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3',
  'A3': 'A3.mp3', 'C4': 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3',
  'A4': 'A4.mp3', 'C5': 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3',
  'A5': 'A5.mp3', 'C6': 'C6.mp3', 'D#6': 'Ds6.mp3', 'F#6': 'Fs6.mp3',
  'A6': 'A6.mp3', 'C7': 'C7.mp3', 'D#7': 'Ds7.mp3', 'F#7': 'Fs7.mp3',
  'A7': 'A7.mp3', 'C8': 'C8.mp3',
};

// Convert a chord symbol like "C", "Am7", "G/B" to piano notes in a good octave range
const chordToNotes = (chordSymbol: string): string[] => {
  if (!chordSymbol || chordSymbol === 'NC' || chordSymbol === '%') return [];
  
  // Handle slash chords - use the bass note
  let symbol = chordSymbol;
  let bassNote: string | null = null;
  if (chordSymbol.includes('/')) {
    const parts = chordSymbol.split('/');
    symbol = parts[0];
    bassNote = parts[1];
  }
  
  const chord = TonalChord.get(symbol);
  if (!chord.notes || chord.notes.length === 0) {
    // Try with just the root if chord parsing fails
    const rootMatch = symbol.match(/^([A-G][#b]?)/);
    if (rootMatch) {
      // Return just the root as a power chord (root + fifth)
      const root = rootMatch[1];
      return [`${root}3`, `${root}4`];
    }
    return [];
  }
  
  // Place chord in a nice piano range (octave 3-4 for left hand, 4-5 for right)
  const notes: string[] = [];
  
  // Add bass note if present (lower octave)
  if (bassNote) {
    notes.push(`${bassNote}2`);
  }
  
  // Add chord notes - spread across octaves for nice voicing
  chord.notes.forEach((note, i) => {
    if (i === 0) {
      // Root in lower octave
      notes.push(`${note}3`);
    } else if (i < 3) {
      // First few extensions in middle
      notes.push(`${note}4`);
    } else {
      // Higher extensions
      notes.push(`${note}5`);
    }
  });
  
  return notes;
};

// Extract chord events with timing from a parsed song
const extractChordEvents = (song: ParsedSong | null): ChordEvent[] => {
  if (!song?.allLines) return [];
  
  const events: ChordEvent[] = [];
  let currentBeat = 0;
  
  for (const line of song.allLines) {
    if (!isChordLine(line)) continue;
    
    const bars = line.model?.allBars || line.allBars || [];
    
    for (const bar of bars) {
      if (bar.isRepeated) {
        // Repeated bar - advance by time signature beats
        const beatsPerBar = bar.timeSignature?.count || 4;
        currentBeat += beatsPerBar;
        continue;
      }
      
      const chords = bar.allChords || [];
      const beatsPerBar = bar.timeSignature?.count || 4;
      
      if (chords.length === 0) {
        currentBeat += beatsPerBar;
        continue;
      }
      
      for (const chord of chords) {
        const chordSymbol = chord.string || '';
        if (!chordSymbol || chordSymbol === '%') {
          currentBeat += chord.duration || 1;
          continue;
        }
        
        const notes = chordToNotes(chordSymbol);
        if (notes.length > 0) {
          events.push({
            chordSymbol,
            notes,
            startBeat: currentBeat,
            durationBeats: chord.duration || 1,
          });
        }
        currentBeat += chord.duration || 1;
      }
    }
  }
  
  return events;
};

const ChordmarkPlayer = ({parsedSong}: {parsedSong: ParsedSong | null}) => {
  const [bpm, setBpm] = useState(90);
  const [bpmInput, setBpmInput] = useState('90');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChord, setCurrentChord] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const samplerRef = useRef<SamplerInstance | null>(null);
  const ToneRef = useRef<ToneModule | null>(null);
  const scheduledIdsRef = useRef<number[]>([]);
  const updateIntervalRef = useRef<number | null>(null);
  const chordEventsRef = useRef<ChordEvent[]>([]);
  
  const chordEvents = useMemo(() => extractChordEvents(parsedSong), [parsedSong]);
  const hasChords = chordEvents.length > 0;
  
  // Load piano samples on first interaction
  const loadPiano = useCallback(async () => {
    if (samplerRef.current) return true;
    
    setIsLoading(true);
    setLoadError(null);
    
    try {
      const Tone = await import('tone');
      ToneRef.current = Tone;
      
      // Create sampler with Salamander Grand Piano samples
      const sampleUrls: Record<string, string> = {};
      for (const [note, file] of Object.entries(PIANO_SAMPLES)) {
        sampleUrls[note] = PIANO_SAMPLES_BASE + file;
      }
      
      const sampler = new Tone.Sampler({
        urls: sampleUrls,
        release: 1,
        onload: () => {
          console.log('Piano samples loaded');
        },
      }).toDestination();
      
      // Wait for samples to load
      await Tone.loaded();
      
      samplerRef.current = sampler;
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Failed to load piano:', err);
      setLoadError(err instanceof Error ? err.message : 'Failed to load piano');
      setIsLoading(false);
      return false;
    }
  }, []);
  
  // Update current chord display during playback
  useEffect(() => {
    if (!isPlaying || !ToneRef.current) {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      return;
    }
    
    const Tone = ToneRef.current;
    const events = chordEventsRef.current;
    
    const updateCurrentChord = () => {
      const currentBeat = Tone.Transport.seconds * (bpm / 60);
      
      const current = events.find(
        e => currentBeat >= e.startBeat && currentBeat < e.startBeat + e.durationBeats
      );
      setCurrentChord(current?.chordSymbol || null);
      
      // Check if we've finished
      if (events.length > 0) {
        const lastEvent = events[events.length - 1];
        if (currentBeat >= lastEvent.startBeat + lastEvent.durationBeats) {
          handleStop();
        }
      }
    };
    
    updateIntervalRef.current = window.setInterval(updateCurrentChord, 50);
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [isPlaying, bpm]);
  
  const handlePlay = async () => {
    if (!hasChords) return;
    
    const loaded = await loadPiano();
    if (!loaded || !samplerRef.current || !ToneRef.current) return;
    
    const Tone = ToneRef.current;
    const sampler = samplerRef.current;
    
    // Start audio context if needed
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }
    
    // Stop any previous playback
    handleStop();
    
    // Set BPM
    Tone.Transport.bpm.value = bpm;
    
    // Store events for current chord tracking
    chordEventsRef.current = chordEvents;
    
    // Calculate seconds per beat
    const secondsPerBeat = 60 / bpm;
    
    // Schedule all chord events
    for (const event of chordEvents) {
      const startTime = event.startBeat * secondsPerBeat;
      const duration = event.durationBeats * secondsPerBeat * 0.9; // Slightly shorter for clarity
      
      const id = Tone.Transport.schedule((time) => {
        // Play all notes in the chord with triggerAttackRelease
        sampler.triggerAttackRelease(event.notes, duration, time, 0.7);
      }, startTime);
      
      scheduledIdsRef.current.push(id);
    }
    
    // Start transport
    Tone.Transport.start();
    setIsPlaying(true);
  };
  
  const handleStop = useCallback(() => {
    if (!ToneRef.current) return;
    
    const Tone = ToneRef.current;
    
    // Clear scheduled events
    for (const id of scheduledIdsRef.current) {
      Tone.Transport.clear(id);
    }
    scheduledIdsRef.current = [];
    
    // Stop transport
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    
    // Release all notes
    if (samplerRef.current) {
      samplerRef.current.releaseAll();
    }
    
    setIsPlaying(false);
    setCurrentChord(null);
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleStop();
    };
  }, [handleStop]);
  
  if (!hasChords) {
    return null;
  }
  
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
          onBlur={() => {
            const val = parseInt(bpmInput) || 90;
            const clamped = Math.max(30, Math.min(300, val));
            setBpm(clamped);
            setBpmInput(String(clamped));
          }}
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
