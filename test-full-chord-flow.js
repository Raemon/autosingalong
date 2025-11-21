#!/usr/bin/env node

/**
 * Full test of chord chart parsing and MIDI generation
 */

const { File, Track } = require('jsmidgen');
const fs = require('fs');
const path = require('path');

// Copy all the logic from route.ts
const CHORD_NOTES = {
  'C': [60, 64, 67],
  'D': [62, 66, 69],
  'G': [67, 71, 74],
  'Am': [69, 72, 76],
  'F': [65, 69, 72],
};

function parseBarLine(barLine) {
  const barParts = barLine.split('|');
  const bars = [];
  for (let i = 0; i < barParts.length; i++) {
    const part = barParts[i].trim();
    if (i > 0 || (i === 0 && part.length === 0 && barParts.length > 1)) {
      bars.push(part);
    }
  }
  
  return bars.map(bar => {
    if (bar.length === 0) {
      return [];
    }
    const normalizedBar = bar.replace(/…/g, '.');
    const tokens = normalizedBar.split(/\s+/).filter(c => c.length > 0);
    const chords = [];
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token === '.' && chords.length > 0) {
        chords[chords.length - 1] += '.';
      } else if (token !== '.') {
        chords.push(token);
      }
    }
    return chords;
  });
}

function parseChordChart(chart) {
  const sections = [];
  const lines = chart.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let currentSection = '';
  let currentBars = [];
  let lastLineBars = [];
  
  for (const line of lines) {
    const sectionMatch = line.match(/^(Verse \d+|Bridge|Tag|Chorus|Intro|Outro|Pre-Chorus|[A-Z]:)/i);
    if (sectionMatch) {
      if (currentSection && currentBars.length > 0) {
        sections.push({ section: currentSection, bars: currentBars });
      }
      currentSection = sectionMatch[1];
      currentBars = [];
      lastLineBars = [];
      continue;
    }
    
    const repetitionMatch = line.match(/^x\s*(\d+)$/i);
    if (repetitionMatch && lastLineBars.length > 0) {
      const repeatCount = parseInt(repetitionMatch[1], 10);
      for (let i = 1; i < repeatCount; i++) {
        currentBars.push(...lastLineBars.map(bar => [...bar]));
      }
      continue;
    }
    
    const lineWithRepetition = line.match(/^(.+?)\s+x\s*(\d+)\s*$/i);
    if (lineWithRepetition) {
      const barLine = lineWithRepetition[1].trim();
      let repeatCount = parseInt(lineWithRepetition[2], 10);
      if (repeatCount > 100) repeatCount = 100;
      
      const barChords = parseBarLine(barLine);
      lastLineBars = barChords;
      
      for (let i = 0; i < repeatCount; i++) {
        currentBars.push(...barChords.map(bar => [...bar]));
      }
      continue;
    }
    
    const barChords = parseBarLine(line);
    if (barChords.length > 0) {
      lastLineBars = barChords;
      currentBars.push(...barChords);
    }
  }
  
  if (currentSection && currentBars.length > 0) {
    sections.push({ section: currentSection, bars: currentBars });
  }
  
  return sections;
}

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

function generateMIDI(chart) {
  const file = new File();
  const track = new Track();
  
  track.setTempo(120);
  track.setTimeSignature(4, 4);
  
  const sections = parseChordChart(chart);
  
  if (sections.length === 0) {
    throw new Error('No sections found in chord chart');
  }
  
  const beatLength = 480;
  let noteCount = 0;
  let chordCount = 0;
  
  for (const section of sections) {
    for (const bar of section.bars) {
      if (bar.length === 0) {
        continue;
      }
      for (const chordToken of bar) {
        if (chordToken === '%') {
          track.addNote(0, 60, beatLength, 0, 1);
          continue;
        }
        
        const dots = (chordToken.match(/\./g) || []).length;
        const chordName = chordToken.replace(/\./g, '').trim();
        
        if (chordName.length === 0) {
          continue;
        }
        
        const notes = getChordNotes(chordName);
        
        if (notes.length > 0) {
          noteCount += notes.length;
          chordCount++;
          const duration = dots > 0 ? Math.floor(beatLength / (dots + 1)) : beatLength;
          track.addChord(0, notes, duration, 90);
          
          if (dots > 0) {
            const remainingDuration = beatLength - duration;
            if (remainingDuration > 0) {
              track.addNote(0, 60, remainingDuration, 0, 1);
            }
          }
        } else {
          console.warn('Unknown chord:', chordName);
          const duration = dots > 0 ? Math.floor(beatLength / (dots + 1)) : beatLength;
          track.addNote(0, 60, duration, 0, 1);
        }
      }
    }
  }
  
  console.log('Total notes added:', noteCount);
  console.log('Total chords processed:', chordCount);
  
  if (chordCount === 0) {
    throw new Error('No chords found in chord chart - MIDI file would be empty');
  }
  
  file.addTrack(track);
  const bytesString = file.toBytes();
  const bytes = new Uint8Array(bytesString.length);
  for (let i = 0; i < bytesString.length; i++) {
    bytes[i] = bytesString.charCodeAt(i);
  }
  return bytes;
}

const testChart = `A:

|Am…| | C D | |Am…| x 8

| C D | |Am…| |C D| |G…|`;

async function runTest() {
  console.log('=== Full Chord Flow Test ===\n');
  console.log('Test chart:');
  console.log(testChart);
  console.log('\n');

  try {
    const midiBytes = generateMIDI(testChart);
  const outputPath = path.join(__dirname, 'tmp', 'test-full-flow.mid');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, Buffer.from(midiBytes));
  console.log(`✓ MIDI file generated: ${outputPath} (${midiBytes.length} bytes)`);
  
  // Try to validate with @tonejs/midi
  import('@tonejs/midi').then(({ Midi }) => {
    const midi = new Midi(Buffer.from(midiBytes));
    console.log(`\nMIDI validation:`);
    console.log(`  Tracks: ${midi.tracks.length}`);
    midi.tracks.forEach((track, i) => {
      console.log(`  Track ${i}: ${track.notes.length} notes`);
    });
    
    const hasNotes = midi.tracks.some(track => track.notes.length > 0);
    if (hasNotes) {
      console.log('\n✓ MIDI file is valid and has notes');
    } else {
      console.error('\n✗ MIDI file has no notes!');
      process.exit(1);
    }
  }).catch(err => {
    console.error('Could not validate with @tonejs/midi:', err.message);
  });
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

runTest();

