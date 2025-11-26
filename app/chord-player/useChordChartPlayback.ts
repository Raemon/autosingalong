import { useState, useRef, useCallback, useEffect } from 'react';
import { usePianoPlayback } from '../chordmark-converter/usePianoPlayback';
import { chordToNotes } from '../chordmark-converter/chordUtils';

type ToneModule = typeof import('tone');

export interface ChordChartEvent {
  chord: string;
  startBeat: number;
  durationBeats: number;
}

export const useChordChartPlayback = (bpm: number) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChordSymbol, setCurrentChordSymbol] = useState<string | null>(null);
  
  const { isLoading, loadError, loadPiano, getSampler, getTone, playSingleChord, currentChord: singleChord } = usePianoPlayback();
  
  const scheduledIdsRef = useRef<number[]>([]);
  const updateIntervalRef = useRef<number | null>(null);
  const chordEventsRef = useRef<ChordChartEvent[]>([]);
  const bpmRef = useRef(bpm);
  
  // Keep bpm ref in sync
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);
  
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
  
  const handleStop = useCallback(() => {
    clearUpdateInterval();
    
    const Tone = getTone();
    const synth = getSampler();
    
    if (!Tone) {
      setIsPlaying(false);
      setCurrentChordSymbol(null);
      return;
    }
    
    clearScheduledEvents(Tone);
    
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    
    if (synth) {
      synth.releaseAll();
    }
    
    setIsPlaying(false);
    setCurrentChordSymbol(null);
  }, [clearScheduledEvents, clearUpdateInterval, getTone, getSampler]);
  
  const updateCurrentChord = useCallback(() => {
    const Tone = getTone();
    if (!Tone) return;
    
    const events = chordEventsRef.current;
    const currentBeat = Tone.Transport.seconds * (bpmRef.current / 60);
    
    const current = events.find(
      e => currentBeat >= e.startBeat && currentBeat < e.startBeat + e.durationBeats
    );
    setCurrentChordSymbol(current?.chord || null);
    
    if (events.length > 0) {
      const lastEvent = events[events.length - 1];
      if (currentBeat >= lastEvent.startBeat + lastEvent.durationBeats) {
        handleStop();
      }
    }
  }, [handleStop, getTone]);
  
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
  
  const handlePlay = useCallback(async (chordEvents: ChordChartEvent[]) => {
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
    Tone.Transport.bpm.value = bpmRef.current;
    
    // Store events for current chord tracking
    chordEventsRef.current = chordEvents;
    
    // Calculate timing
    const secondsPerBeat = 60 / bpmRef.current;
    
    // Schedule all chord events
    for (const event of chordEvents) {
      const startTime = event.startBeat * secondsPerBeat;
      const duration = event.durationBeats * secondsPerBeat * 0.9;
      
      const notes = chordToNotes(event.chord);
      if (notes.length === 0) continue;
      
      const id = Tone.Transport.schedule((time) => {
        synth.triggerAttackRelease(notes, duration, time, 0.7);
      }, startTime);
      
      scheduledIdsRef.current.push(id);
    }
    
    // Start transport
    Tone.Transport.start();
    setIsPlaying(true);
  }, [loadPiano, handleStop, getSampler, getTone]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleStop();
    };
  }, [handleStop]);
  
  // Use the single chord from piano playback when not playing a sequence
  const currentChord = isPlaying ? currentChordSymbol : singleChord;
  
  return {
    isPlaying,
    isLoading,
    currentChord,
    loadError,
    handlePlay,
    handleStop,
    playSingleChord,
  };
};
