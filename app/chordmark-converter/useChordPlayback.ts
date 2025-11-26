import { useState, useRef, useCallback, useEffect } from 'react';
import type { ChordEvent } from './types';

type ToneModule = typeof import('tone');
type SamplerInstance = import('tone').Sampler;

export const useChordPlayback = (chordEvents: ChordEvent[], bpm: number) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChord, setCurrentChord] = useState<string | null>(null);
  const [currentLineIndex, setCurrentLineIndex] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const synthRef = useRef<SamplerInstance | null>(null);
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
  
  // Load piano sampler on first interaction
  const loadPiano = useCallback(async () => {
    if (synthRef.current) return true;
    
    setIsLoading(true);
    setLoadError(null);
    
    try {
      const Tone = await import('tone');
      ToneRef.current = Tone;
      
      // Create a Sampler with piano samples for realistic sound
      const sampler = new Tone.Sampler({
        urls: {
          A0: "A0.mp3",
          C1: "C1.mp3",
          "D#1": "Ds1.mp3",
          "F#1": "Fs1.mp3",
          A1: "A1.mp3",
          C2: "C2.mp3",
          "D#2": "Ds2.mp3",
          "F#2": "Fs2.mp3",
          A2: "A2.mp3",
          C3: "C3.mp3",
          "D#3": "Ds3.mp3",
          "F#3": "Fs3.mp3",
          A3: "A3.mp3",
          C4: "C4.mp3",
          "D#4": "Ds4.mp3",
          "F#4": "Fs4.mp3",
          A4: "A4.mp3",
          C5: "C5.mp3",
          "D#5": "Ds5.mp3",
          "F#5": "Fs5.mp3",
          A5: "A5.mp3",
          C6: "C6.mp3",
          "D#6": "Ds6.mp3",
          "F#6": "Fs6.mp3",
          A6: "A6.mp3",
          C7: "C7.mp3",
          "D#7": "Ds7.mp3",
          "F#7": "Fs7.mp3",
          A7: "A7.mp3",
          C8: "C8.mp3"
        },
        release: 1,
        baseUrl: "https://tonejs.github.io/audio/salamander/"
      }).toDestination();
      
      sampler.volume.value = -6; // Reduce volume to avoid clipping
      
      // Wait for samples to load
      await new Promise<void>((resolve) => {
        Tone.loaded().then(() => {
          console.log('Piano samples loaded');
          resolve();
        });
      });
      
      synthRef.current = sampler;
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Failed to load piano:', err);
      setLoadError(err instanceof Error ? err.message : 'Failed to load piano');
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
  
  const scheduleChordEvents = useCallback((Tone: ToneModule, synth: SamplerInstance, events: ChordEvent[], secondsPerBeat: number) => {
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

