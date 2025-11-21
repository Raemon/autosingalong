import { NextResponse } from 'next/server';
import { File, Track } from 'jsmidgen';

// Chord to MIDI note mapping (root note + intervals for common chords)
const CHORD_NOTES: { [key: string]: number[] } = {
  'C': [60, 64, 67],      // C-E-G
  'C#': [61, 65, 68],     // C#-F-G#
  'Db': [61, 65, 68],     // Db-F-Ab
  'D': [62, 66, 69],      // D-F#-A
  'D#': [63, 67, 70],     // D#-G-A#
  'Eb': [63, 67, 70],     // Eb-G-Bb
  'E': [64, 68, 71],      // E-G#-B
  'F': [65, 69, 72],      // F-A-C
  'F#': [66, 70, 73],     // F#-A#-C#
  'Gb': [66, 70, 73],     // Gb-Bb-Db
  'G': [67, 71, 74],      // G-B-D
  'G#': [68, 72, 75],     // G#-C-D#
  'Ab': [68, 72, 75],     // Ab-C-Eb
  'A': [69, 73, 76],      // A-C#-E
  'A#': [70, 74, 77],     // A#-D-F
  'Bb': [70, 74, 77],     // Bb-D-F
  'B': [71, 75, 78],      // B-D#-F#
  
  // Minor chords
  'Am': [69, 72, 76],     // A-C-E
  'A#m': [70, 73, 77],    // A#-C#-F
  'Bbm': [70, 73, 77],    // Bb-Db-F
  'Bm': [71, 74, 78],     // B-D-F#
  'Cm': [60, 63, 67],     // C-Eb-G
  'C#m': [61, 64, 68],    // C#-E-G#
  'Dbm': [61, 64, 68],    // Db-Fb-Ab
  'Dm': [62, 65, 69],     // D-F-A
  'D#m': [63, 66, 70],    // D#-F#-A#
  'Ebm': [63, 66, 70],    // Eb-Gb-Bb
  'Em': [64, 67, 71],     // E-G-B
  'Fm': [65, 68, 72],     // F-Ab-C
  'F#m': [66, 69, 73],    // F#-A-C#
  'Gbm': [66, 69, 73],    // Gb-Bbb-Db
  'Gm': [67, 70, 74],     // G-Bb-D
  'G#m': [68, 71, 75],    // G#-B-D#
  'Abm': [68, 71, 75],    // Ab-Cb-Eb
};

function parseBarLine(barLine: string): string[][] {
  // Parse bars separated by |
  const barParts = barLine.split('|');
  const bars: string[] = [];
  for (let i = 0; i < barParts.length; i++) {
    const part = barParts[i].trim();
    // Include empty bars (when we have | |)
    if (i > 0 || (i === 0 && part.length === 0 && barParts.length > 1)) {
      bars.push(part);
    }
  }
  
  // Split each bar into chords (handling dots, ellipsis, and spaces)
  return bars.map(bar => {
    if (bar.length === 0) {
      return []; // Empty bar
    }
    
    // Normalize ellipsis (…) to dots (.) for processing
    const normalizedBar = bar.replace(/…/g, '.');
    
    // Split by spaces, but handle dots that might be separated by spaces
    const tokens = normalizedBar.split(/\s+/).filter(c => c.length > 0);
    const chords: string[] = [];
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      // If token is just a dot and previous token exists, attach it
      if (token === '.' && chords.length > 0) {
        chords[chords.length - 1] += '.';
      } else if (token !== '.') {
        chords.push(token);
      }
    }
    return chords;
  });
}

function parseChordChart(chart: string): Array<{ section: string; bars: string[][] }> {
  const sections: Array<{ section: string; bars: string[][] }> = [];
  const lines = chart.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let currentSection = '';
  let currentBars: string[][] = [];
  let lastLineBars: string[][] = []; // Track last line's bars for repetition
  let hasSectionHeaders = false;
  
  for (const line of lines) {
    // Check if this is a section header (Verse, Bridge, Tag, etc., or single letter like "A:", "B:")
    const sectionMatch = line.match(/^(Verse \d+|Bridge|Tag|Chorus|Intro|Outro|Pre-Chorus|[A-Z]:)/i);
    if (sectionMatch) {
      hasSectionHeaders = true;
      // Save previous section if it exists
      if (currentSection && currentBars.length > 0) {
        sections.push({ section: currentSection, bars: currentBars });
      }
      currentSection = sectionMatch[1];
      currentBars = [];
      lastLineBars = [];
      continue;
    }
    
    // Check for repetition notation (e.g., "x 8" or "x2" on its own line)
    const repetitionMatch = line.match(/^x\s*(\d+)$/i);
    if (repetitionMatch && lastLineBars.length > 0) {
      const repeatCount = parseInt(repetitionMatch[1], 10);
      // Repeat the last line's bars (repeatCount-1 more times, since we already added it once)
      for (let i = 1; i < repeatCount; i++) {
        currentBars.push(...lastLineBars.map(bar => [...bar]));
      }
      continue;
    }
    
    // Check for repetition notation at end of bar line (e.g., "|Am| x 8")
    // Allow for optional trailing whitespace
    const lineWithRepetition = line.match(/^(.+?)\s+x\s*(\d+)\s*$/i);
    if (lineWithRepetition) {
      const barLine = lineWithRepetition[1].trim();
      let repeatCount = parseInt(lineWithRepetition[2], 10);
      
      if (repeatCount > 100) {
        console.warn('Repetition count too high, capping at 100:', repeatCount);
        repeatCount = 100;
      }
      
      const barChords = parseBarLine(barLine);
      lastLineBars = barChords;
      
      // Add the bars repeatCount times
      for (let i = 0; i < repeatCount; i++) {
        currentBars.push(...barChords.map(bar => [...bar]));
      }
      continue;
    }
    
    // Regular bar line
    const barChords = parseBarLine(line);
    if (barChords.length > 0) {
      lastLineBars = barChords;
      currentBars.push(...barChords);
    }
  }
  
  // Save last section
  if (currentSection && currentBars.length > 0) {
    sections.push({ section: currentSection, bars: currentBars });
  } else if (!hasSectionHeaders && currentBars.length > 0) {
    // If no section headers were found, create a default section with all bars
    sections.push({ section: 'Main', bars: currentBars });
  }
  
  return sections;
}

function getRootNoteNumber(rootName: string): number | null {
  const root = rootName.trim();
  const rootMap: { [key: string]: number } = {
    'C': 60, 'C#': 61, 'Db': 61,
    'D': 62, 'D#': 63, 'Eb': 63,
    'E': 64,
    'F': 65, 'F#': 66, 'Gb': 66,
    'G': 67, 'G#': 68, 'Ab': 68,
    'A': 69, 'A#': 70, 'Bb': 70,
    'B': 71
  };
  return rootMap[root] || rootMap[root.toUpperCase()] || null;
}

function getChordNotes(chordName: string): number[] {
  // Normalize chord name (remove extensions, handle variations)
  const normalized = chordName.trim();
  
  // Handle slash chords (e.g., C/G)
  const slashMatch = normalized.match(/^([A-G][#b]?[^/]*)\/([A-G][#b]?)$/i);
  if (slashMatch) {
    const chordPart = slashMatch[1];
    const bassNote = slashMatch[2];
    const bassNoteNum = getRootNoteNumber(bassNote);
    
    // Get the chord notes
    let chordNotes = getChordNotes(chordPart);
    
    // If we have chord notes and a bass note, rearrange so bass is lowest
    if (chordNotes.length > 0 && bassNoteNum !== null) {
      // Remove bass note from chord if present, then add it as lowest
      chordNotes = chordNotes.filter(n => n !== bassNoteNum);
      // Add bass note as lowest (or keep it if already there)
      chordNotes.unshift(bassNoteNum);
      return chordNotes;
    }
    // If chord part failed, just return bass note as power chord
    if (bassNoteNum !== null) {
      return [bassNoteNum, bassNoteNum + 7]; // Root + fifth
    }
  }
  
  // Handle power chords (e.g., A5, D5)
  const powerChordMatch = normalized.match(/^([A-G][#b]?)5$/i);
  if (powerChordMatch) {
    const root = powerChordMatch[1];
    const rootNote = getRootNoteNumber(root);
    if (rootNote !== null) {
      return [rootNote, rootNote + 7]; // Root + fifth (7 semitones)
    }
  }
  
  // Check for minor chord (m, min, -)
  if (normalized.match(/^[A-G][#b]?[m-]/i) || normalized.match(/^[A-G][#b]?min/i)) {
    const root = normalized.match(/^([A-G][#b]?)/i)?.[1];
    if (root) {
      const minorKey = root + 'm';
      return CHORD_NOTES[minorKey] || CHORD_NOTES[minorKey.toUpperCase()] || [];
    }
  }
  
  // Check for major chord (default)
  const root = normalized.match(/^([A-G][#b]?)/i)?.[1];
  if (root) {
    return CHORD_NOTES[root] || CHORD_NOTES[root.toUpperCase()] || [];
  }
  
  return [];
}

function generateMIDI(chart: string): Uint8Array {
  const file = new File();
  const track = new Track();
  
  // Set tempo (60 BPM - 1 beat per second, 4 seconds per bar)
  track.setTempo(60);
  // @ts-expect-error - setTimeSignature exists but types may be incomplete
  track.setTimeSignature(4, 4);
  
  const sections = parseChordChart(chart);
  
  if (sections.length === 0) {
    throw new Error('No sections found in chord chart');
  }
  
  // Default timing: each chord gets 1 beat, dots indicate subdivisions
  const beatLength = 480; // ticks per quarter note (standard MIDI resolution)
  
  let noteCount = 0;
  let chordCount = 0;
  for (const section of sections) {
    for (const bar of section.bars) {
      // Skip empty bars
      if (bar.length === 0) {
        continue;
      }
      for (const chordToken of bar) {
        if (chordToken === '%') {
          // Rest - add a silent note (very low velocity, inaudible)
          // Use middle C with velocity 1 (inaudible)
          track.addNote(0, 60, beatLength, 0, 1);
          continue;
        }
        
        // Count dots to determine duration
        const dots = (chordToken.match(/\./g) || []).length;
        const chordName = chordToken.replace(/\./g, '').trim();
        
        if (chordName.length === 0) {
          continue;
        }
        
        const notes = getChordNotes(chordName);
        
        if (notes.length > 0) {
          noteCount += notes.length;
          chordCount++;
          // Duration: base beat divided by (dots + 1)
          // e.g., "C" = 1 beat, "C." = 0.5 beat, "C.." = 0.33 beat
          const duration = dots > 0 ? Math.floor(beatLength / (dots + 1)) : beatLength;
          
          // Add chord using addChord method (channel, chord array, duration, velocity)
          track.addChord(0, notes, duration, 90);
          
          // If there are dots, add rest for remaining time
          if (dots > 0) {
            const remainingDuration = beatLength - duration;
            if (remainingDuration > 0) {
              track.addNote(0, 60, remainingDuration, 0, 1);
            }
          }
        } else {
          console.warn('Unknown chord:', chordName);
          // Unknown chord - add rest
          const duration = dots > 0 ? Math.floor(beatLength / (dots + 1)) : beatLength;
          track.addNote(0, 60, duration, 0, 1);
        }
      }
    }
  }
  
  console.log('Total notes added to track:', noteCount);
  console.log('Total chords processed:', chordCount);
  
  if (chordCount === 0) {
    throw new Error('No chords found in chord chart - MIDI file would be empty');
  }
  
  file.addTrack(track);
  // toBytes() returns a string where each character is a byte value
  // Convert it properly to a Uint8Array
  const bytesString = file.toBytes() as unknown as string;
  // Convert string to Uint8Array by mapping each character to its byte value
  const bytes = new Uint8Array(bytesString.length);
  for (let i = 0; i < bytesString.length; i++) {
    bytes[i] = bytesString.charCodeAt(i);
  }
  return bytes;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const chordChart = body.chart || body.chordChart;
    
    if (!chordChart || typeof chordChart !== 'string') {
      return NextResponse.json(
        { error: 'Chord chart is required. Send JSON with "chart" or "chordChart" field.' },
        { status: 400 }
      );
    }
    
    console.log('Parsing chord chart, length:', chordChart.length);
    const sections = parseChordChart(chordChart);
    console.log('Parsed sections:', sections.length);
    sections.forEach((section, i) => {
      console.log(`  Section ${i}: ${section.section}, bars: ${section.bars.length}`);
      let totalChords = 0;
      section.bars.forEach(bar => {
        totalChords += bar.length;
      });
      console.log(`    Total chords: ${totalChords}`);
    });
    
    const midiBuffer = generateMIDI(chordChart);
    console.log('Generated MIDI buffer, size:', midiBuffer.length);
    
    // Convert Uint8Array to Buffer for NextResponse
    // NextResponse can handle Buffer directly, which is more reliable than ArrayBuffer conversion
    const buffer = Buffer.from(midiBuffer);
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/midi',
        'Content-Disposition': 'attachment; filename="chord-chart.mid"',
      },
    });
  } catch (error) {
    console.error('Error generating MIDI:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate MIDI file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

