import { useState, useRef, useCallback, useEffect } from 'react';
import type { ChordEvent } from './types';
import { usePianoPlayback } from './usePianoPlayback';

type ToneModule = typeof import('tone');
type MetronomeSynth = import('tone').MembraneSynth;

interface ChordPlaybackResult {
  isPlaying: boolean;
  isLoading: boolean;
  currentChord: string | null;
  currentLineIndex: number | null;
  loadError: string | null;
  handlePlay: () => Promise<void>;
  handleStop: () => void;
  playSingleChord: (chordSymbol: string) => Promise<void>;
  setMetronomeEnabled: (enabled: boolean) => void;
}

export const useChordPlayback = (chordEvents: ChordEvent[], bpm: number): ChordPlaybackResult => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState<number | null>(null);
  const [currentChordSymbol, setCurrentChordSymbol] = useState<string | null>(null);
  const [metronomeEnabled, setMetronomeEnabled] = useState(true);
  
  const { isLoading, loadError, loadPiano, getSampler, getTone, playSingleChord } = usePianoPlayback();
  
  const scheduledIdsRef = useRef<number[]>([]);
  const updateIntervalRef = useRef<number | null>(null);
  const chordEventsRef = useRef<ChordEvent[]>([]);
  const metronomeIdRef = useRef<number | null>(null);
  const metronomeSynthRef = useRef<MetronomeSynth | null>(null);
  
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
  
  const clearMetronome = useCallback((Tone: ToneModule | null) => {
    if (!Tone) return;
    if (metronomeIdRef.current !== null) {
      Tone.Transport.clear(metronomeIdRef.current);
      metronomeIdRef.current = null;
    }
  }, []);
  
  const getMetronomeSynth = useCallback((Tone: ToneModule | null) => {
    if (!Tone) return null;
    if (!metronomeSynthRef.current) {
      const synth = new Tone.MembraneSynth({
        envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.03 },
        octaves: 2
      }).toDestination();
      synth.volume.value = -8;
      metronomeSynthRef.current = synth;
    }
    return metronomeSynthRef.current;
  }, []);
  
  const scheduleMetronome = useCallback((Tone: ToneModule | null) => {
    if (!Tone) return;
    const synth = getMetronomeSynth(Tone);
    if (!synth) return;
    clearMetronome(Tone);
    let beatCount = 0;
    metronomeIdRef.current = Tone.Transport.scheduleRepeat((time) => {
      const isDownbeat = beatCount % 4 === 0;
      beatCount += 1;
      const note = isDownbeat ? 'C6' : 'C5';
      const velocity = isDownbeat ? 0.6 : 0.4;
      synth.triggerAttackRelease(note, '32n', time, velocity);
    }, '4n');
  }, [clearMetronome, getMetronomeSynth]);
  
  const handleStop = useCallback(() => {
    clearUpdateInterval();
    
    const Tone = getTone();
    const synth = getSampler();
    
    if (!Tone) {
      setIsPlaying(false);
      setCurrentChordSymbol(null);
      setCurrentLineIndex(null);
      return;
    }
    
    clearScheduledEvents(Tone);
    clearMetronome(Tone);
    
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    
    if (synth) {
      synth.releaseAll();
    }
    
    setIsPlaying(false);
    setCurrentChordSymbol(null);
    setCurrentLineIndex(null);
  }, [clearScheduledEvents, clearUpdateInterval, clearMetronome, getTone, getSampler]);
  
  const updateCurrentChord = useCallback(() => {
    const Tone = getTone();
    if (!Tone) return;
    
    const events = chordEventsRef.current;
    const currentBeat = Tone.Transport.seconds * (bpm / 60);
    
    const current = events.find(
      e => currentBeat >= e.startBeat && currentBeat < e.startBeat + e.durationBeats
    );
    setCurrentChordSymbol(current?.chordSymbol || null);
    setCurrentLineIndex(current?.lineIndex ?? null);
    
    if (events.length > 0) {
      const lastEvent = events[events.length - 1];
      if (currentBeat >= lastEvent.startBeat + lastEvent.durationBeats) {
        handleStop();
      }
    }
  }, [bpm, handleStop, getTone]);
  
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
    const synth = getSampler();
    const Tone = getTone();
    
    if (!loaded || !synth || !Tone) return;
    
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
    for (const event of chordEvents) {
      const startTime = event.startBeat * secondsPerBeat;
      const duration = event.durationBeats * secondsPerBeat * 0.9;
      
      const id = Tone.Transport.schedule((time) => {
        console.log(`Playing chord ${event.chordSymbol}:`, event.notes);
        synth.triggerAttackRelease(event.notes, duration, time, 0.7);
      }, startTime);
      
      scheduledIdsRef.current.push(id);
    }
    
    if (metronomeEnabled) {
      scheduleMetronome(Tone);
    } else {
      clearMetronome(Tone);
    }
    
    // Start transport
    Tone.Transport.start();
    setIsPlaying(true);
  };
  
  useEffect(() => {
    if (!isPlaying) return;
    const Tone = getTone();
    if (!Tone) return;
    if (metronomeEnabled) {
      if (metronomeIdRef.current === null) {
        scheduleMetronome(Tone);
      }
    } else {
      clearMetronome(Tone);
    }
  }, [metronomeEnabled, isPlaying, getTone, scheduleMetronome, clearMetronome]);
  
  const updateMetronomeEnabled = useCallback((enabled: boolean) => {
    setMetronomeEnabled(enabled);
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleStop();
      if (metronomeSynthRef.current) {
        metronomeSynthRef.current.dispose();
        metronomeSynthRef.current = null;
      }
    };
  }, [handleStop]);
  
  return {
    isPlaying,
    isLoading,
    currentChord: currentChordSymbol,
    currentLineIndex,
    loadError,
    handlePlay,
    handleStop,
    playSingleChord,
    setMetronomeEnabled: updateMetronomeEnabled,
  };
};
