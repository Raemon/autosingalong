#!/usr/bin/env node

/**
 * Test MIDI generation with parsed chords
 */

const { File, Track } = require('jsmidgen');
const fs = require('fs');
const path = require('path');

// Copy chord mapping and functions from route.ts
const CHORD_NOTES = {
  'C': [60, 64, 67],
  'D': [62, 66, 69],
  'G': [67, 71, 74],
  'Am': [69, 72, 76],
  'F': [65, 69, 72],
};

function getChordNotes(chordName) {
  const normalized = chordName.trim();
  if (normalized.match(/^[A-G][#b]?[m-]/i)) {
    const root = normalized.match(/^([A-G][#b]?)/i)?.[1];
    if (root) {
      const minorKey = root + 'm';
      return CHORD_NOTES[minorKey] || CHORD_NOTES[minorKey.toUpperCase()] || [];
    }
  }
  const root = normalized.match(/^([A-G][#b]?)/i)?.[1];
  if (root) {
    return CHORD_NOTES[root] || CHORD_NOTES[root.toUpperCase()] || [];
  }
  return [];
}

// Test with a simple chord progression
const testBars = [
  ['Am.'],  // Am with dot
  [],       // Empty bar
  ['C', 'D'], // C and D chords
  [],       // Empty bar
  ['Am.'],  // Am with dot
];

console.log('=== Testing MIDI Generation ===\n');

const file = new File();
const track = new Track();

track.setTempo(120);
track.setTimeSignature(4, 4);

const beatLength = 480;
let noteCount = 0;

for (const bar of testBars) {
  console.log(`Processing bar: [${bar.join(', ')}]`);
  for (const chordToken of bar) {
    const dots = (chordToken.match(/\./g) || []).length;
    const chordName = chordToken.replace(/\./g, '').trim();
    
    if (chordName.length === 0) {
      console.log('  Skipping empty chord');
      continue;
    }
    
    const notes = getChordNotes(chordName);
    console.log(`  Chord: ${chordName}, Notes: [${notes.join(', ')}], Dots: ${dots}`);
    
    if (notes.length > 0) {
      noteCount += notes.length;
      const duration = dots > 0 ? Math.floor(beatLength / (dots + 1)) : beatLength;
      console.log(`    Adding chord with duration: ${duration} ticks`);
      track.addChord(0, notes, duration, 90);
      
      if (dots > 0) {
        const remainingDuration = beatLength - duration;
        if (remainingDuration > 0) {
          track.addNote(0, 60, remainingDuration, 0, 1);
        }
      }
    }
  }
}

console.log(`\nTotal notes added: ${noteCount}`);

file.addTrack(track);

const bytesString = file.toBytes();
console.log(`MIDI file size: ${bytesString.length} bytes`);

// Convert to Uint8Array
const bytes = new Uint8Array(bytesString.length);
for (let i = 0; i < bytesString.length; i++) {
  bytes[i] = bytesString.charCodeAt(i);
}

// Save to file
const outputPath = path.join(__dirname, 'tmp', 'test-midi-generation.mid');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, Buffer.from(bytes));
console.log(`Saved to: ${outputPath}`);

// Try to parse with @tonejs/midi
console.log('\n=== Validating MIDI ===');
import('@tonejs/midi').then(({ Midi }) => {
  const midi = new Midi(Buffer.from(bytes));
  console.log(`Tracks: ${midi.tracks.length}`);
  midi.tracks.forEach((track, i) => {
    console.log(`Track ${i}: ${track.notes.length} notes`);
    if (track.notes.length > 0) {
      console.log(`  First note: ${track.notes[0].name} at ${track.notes[0].time}s`);
      console.log(`  Last note: ${track.notes[track.notes.length - 1].name} at ${track.notes[track.notes.length - 1].time}s`);
    }
  });
  
  const hasNotes = midi.tracks.some(track => track.notes.length > 0);
  if (!hasNotes) {
    console.error('\n✗ MIDI file has no notes!');
    process.exit(1);
  } else {
    console.log('\n✓ MIDI file is valid');
  }
}).catch(err => {
  console.error('Error parsing MIDI:', err.message);
  process.exit(1);
});




