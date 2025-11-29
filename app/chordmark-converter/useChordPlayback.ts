import { useState, useRef, useCallback, useEffect } from 'react';
import type { ChordEvent } from './types';
import { usePianoPlayback } from './usePianoPlayback';

type ToneModule = typeof import('tone');
type MetronomePlayer = import('tone').Player & {
  _highBuffer?: import('tone').ToneAudioBuffer;
  _lowBuffer?: import('tone').ToneAudioBuffer;
};

export type MetronomeMode = 'off' | '2/4' | '3/4' | '4/4' | '6/4';

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
  setMetronomeMode: (mode: MetronomeMode) => void;
}

// Metronome audio configuration - adjust these to change the click sound
const METRONOME_CONFIG = {
  duration: 0.02,           // Click duration in seconds (0.02 = 20ms)
  decayRate: 150,           // How fast the sound fades (higher = faster fade)
  noiseAmount: 0.7,         // Amount of noise/white noise (0-1)
  bodyFrequency: 200,       // Frequency of the tonal "body" in Hz (lower = deeper)
  bodyAmount: 0.3,          // Amount of tonal body mixed in (0-1)
  highAmplitude: 0.8,       // Volume of the high tick (0-1)
  lowAmplitude: 0.3,        // Volume of the low tick (0-1)
  volume: -10,              // Overall volume in dB (negative = quieter)
};

export const useChordPlayback = (chordEvents: ChordEvent[], bpm: number): ChordPlaybackResult => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState<number | null>(null);
  const [currentChordSymbol, setCurrentChordSymbol] = useState<string | null>(null);
  const [metronomeMode, setMetronomeMode] = useState<MetronomeMode>('4/4');
  
  const { isLoading, loadError, loadPiano, getSampler, getTone, playSingleChord } = usePianoPlayback();
  
  const scheduledIdsRef = useRef<number[]>([]);
  const updateIntervalRef = useRef<number | null>(null);
  const chordEventsRef = useRef<ChordEvent[]>([]);
  const metronomeIdRef = useRef<number | null>(null);
  const metronomePlayerRef = useRef<MetronomePlayer | null>(null);
  
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
  
  const createMetronomeBuffer = useCallback((Tone: ToneModule, isHigh: boolean) => {
    const sampleRate = Tone.context.sampleRate;
    const length = Math.floor(sampleRate * METRONOME_CONFIG.duration);
    const buffer = Tone.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    
    const amplitude = isHigh ? METRONOME_CONFIG.highAmplitude : METRONOME_CONFIG.lowAmplitude;
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * METRONOME_CONFIG.decayRate);
      const noise = (Math.random() * 2 - 1) * METRONOME_CONFIG.noiseAmount;
      const body = Math.sin(2 * Math.PI * METRONOME_CONFIG.bodyFrequency * t) * METRONOME_CONFIG.bodyAmount;
      data[i] = (noise + body) * envelope * amplitude;
    }
    
    return new Tone.ToneAudioBuffer(buffer);
  }, []);

  const getMetronomePlayer = useCallback((Tone: ToneModule | null) => {
    if (!Tone) return null;
    if (!metronomePlayerRef.current) {
      const highBuffer = createMetronomeBuffer(Tone, true);
      const lowBuffer = createMetronomeBuffer(Tone, false);
      
      const player = new Tone.Player().toDestination() as MetronomePlayer;
      player.volume.value = METRONOME_CONFIG.volume;
      player._highBuffer = highBuffer;
      player._lowBuffer = lowBuffer;
      metronomePlayerRef.current = player;
    }
    return metronomePlayerRef.current;
  }, [createMetronomeBuffer]);
  
  const scheduleMetronome = useCallback((Tone: ToneModule | null, mode: MetronomeMode) => {
    if (!Tone || mode === 'off') return;
    const player = getMetronomePlayer(Tone);
    if (!player) return;
    clearMetronome(Tone);
    
    // Determine interval and beats per measure based on mode
    let interval: string;
    let beatsPerMeasure: number | null = null;
    
    if (mode === '2/4') {
      interval = '2n';
      beatsPerMeasure = 2;
    } else if (mode === '3/4') {
      interval = '3n';
      beatsPerMeasure = 3;
    } else if (mode === '4/4') {
      interval = '4n';
      beatsPerMeasure = 4;
    } else if (mode === '6/4') {
      interval = '6n';
      beatsPerMeasure = 6;
    } else {
      interval = '2n';
      beatsPerMeasure = 2;
    }
    
    let beatInMeasure = 0;
    metronomeIdRef.current = Tone.Transport.scheduleRepeat((time) => {
      const isDownbeat = beatInMeasure === 0;
      const buffer = isDownbeat ? player._highBuffer : player._lowBuffer;
      if (buffer) {
        player.buffer = buffer;
        player.start(time);
      }
      beatInMeasure = (beatInMeasure + 1) % beatsPerMeasure!;
    }, interval);
  }, [clearMetronome, getMetronomePlayer]);
  
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
    
    scheduleMetronome(Tone, metronomeMode);
    
    // Start transport
    Tone.Transport.start();
    setIsPlaying(true);
  };
  
  useEffect(() => {
    if (!isPlaying) return;
    const Tone = getTone();
    if (!Tone) return;
    clearMetronome(Tone);
    if (metronomeMode !== 'off') {
      scheduleMetronome(Tone, metronomeMode);
    }
  }, [metronomeMode, isPlaying, getTone, scheduleMetronome, clearMetronome]);
  
  const updateMetronomeEnabled = useCallback((enabled: boolean) => {
    setMetronomeMode(enabled ? '4/4' : 'off');
  }, []);
  
  const updateMetronomeMode = useCallback((mode: MetronomeMode) => {
    setMetronomeMode(mode);
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleStop();
      if (metronomePlayerRef.current) {
        metronomePlayerRef.current.dispose();
        metronomePlayerRef.current = null;
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
    setMetronomeMode: updateMetronomeMode,
  };
};
