import { useState, useRef, useCallback, useEffect } from 'react';
import type { ChordEvent } from './types';

type ToneModule = typeof import('tone');
type PolySynthInstance = import('tone').PolySynth;

export const useChordPlayback = (chordEvents: ChordEvent[], bpm: number) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChord, setCurrentChord] = useState<string | null>(null);
  const [currentLineIndex, setCurrentLineIndex] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const synthRef = useRef<PolySynthInstance | null>(null);
  const ToneRef = useRef<ToneModule | null>(null);
  const scheduledIdsRef = useRef<number[]>([]);
  const updateIntervalRef = useRef<number | null>(null);
  const chordEventsRef = useRef<ChordEvent[]>([]);
  
  const clearUpdateInterval = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  }, []);
  
  const clearScheduledEvents = useCallback((Tone: ToneModule) => {
    for (const id of scheduledIdsRef.current) {
      Tone.Transport.clear(id);
    }
    scheduledIdsRef.current = [];
  }, []);
  
  // Load synth on first interaction
  const loadPiano = useCallback(async () => {
    if (synthRef.current) return true;
    
    setIsLoading(true);
    setLoadError(null);
    
    try {
      const Tone = await import('tone');
      ToneRef.current = Tone;
      
      // Create a PolySynth for reliable polyphonic playback
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.005, decay: 0.3, sustain: 0.4, release: 0.8 },
      }).toDestination();
      
      synth.volume.value = -6; // Reduce volume to avoid clipping
      
      console.log('Synth initialized');
      synthRef.current = synth;
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Failed to load synth:', err);
      setLoadError(err instanceof Error ? err.message : 'Failed to load synth');
      setIsLoading(false);
      return false;
    }
  }, []);
  
  const handleStop = useCallback(() => {
    clearUpdateInterval();
    
    if (!ToneRef.current) {
      setIsPlaying(false);
      setCurrentChord(null);
      setCurrentLineIndex(null);
      return;
    }
    
    const Tone = ToneRef.current;
    
    // Clear scheduled events
    clearScheduledEvents(Tone);
    
    // Stop transport
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    
    // Release all notes
    if (synthRef.current) {
      synthRef.current.releaseAll();
    }
    
    setIsPlaying(false);
    setCurrentChord(null);
    setCurrentLineIndex(null);
  }, [clearScheduledEvents, clearUpdateInterval]);
  
  const scheduleChordEvents = useCallback((Tone: ToneModule, synth: PolySynthInstance, events: ChordEvent[], secondsPerBeat: number) => {
    for (const event of events) {
      const startTime = event.startBeat * secondsPerBeat;
      const duration = event.durationBeats * secondsPerBeat * 0.9; // Slightly shorter for clarity
      
      const id = Tone.Transport.schedule((time) => {
        console.log(`Playing chord ${event.chordSymbol}:`, event.notes);
        synth.triggerAttackRelease(event.notes, duration, time, 0.7);
      }, startTime);
      
      scheduledIdsRef.current.push(id);
    }
  }, []);
  
  const updateCurrentChord = useCallback(() => {
    if (!ToneRef.current) return;
    
    const Tone = ToneRef.current;
    const events = chordEventsRef.current;
    const currentBeat = Tone.Transport.seconds * (bpm / 60);
    
    const current = events.find(
      e => currentBeat >= e.startBeat && currentBeat < e.startBeat + e.durationBeats
    );
    setCurrentChord(current?.chordSymbol || null);
    setCurrentLineIndex(current?.lineIndex ?? null);
    
    if (events.length > 0) {
      const lastEvent = events[events.length - 1];
      if (currentBeat >= lastEvent.startBeat + lastEvent.durationBeats) {
        handleStop();
      }
    }
  }, [bpm, handleStop]);
  
  // Update current chord display during playback
  useEffect(() => {
    if (!isPlaying) {
      clearUpdateInterval();
      return;
    }
    
    updateIntervalRef.current = window.setInterval(updateCurrentChord, 50);
    
    return () => {
      clearUpdateInterval();
    };
  }, [isPlaying, updateCurrentChord, clearUpdateInterval]);
  
  const handlePlay = async () => {
    if (chordEvents.length === 0) return;
    
    const loaded = await loadPiano();
    if (!loaded || !synthRef.current || !ToneRef.current) return;
    
    const Tone = ToneRef.current;
    const synth = synthRef.current;
    
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
    
    // Calculate timing
    const secondsPerBeat = 60 / bpm;
    
    // Schedule all chord events
    scheduleChordEvents(Tone, synth, chordEvents, secondsPerBeat);
    
    // Start transport
    Tone.Transport.start();
    setIsPlaying(true);
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleStop();
    };
  }, [handleStop]);
  
  return {
    isPlaying,
    isLoading,
    currentChord,
    currentLineIndex,
    loadError,
    handlePlay,
    handleStop,
  };
};

