#!/usr/bin/env node

/**
 * Test script for the specific chord chart provided by user
 */

const chordChart = `A5    | C/G    |A5     |C/G     | D5    | A5

Am    | F      | D      | F

A     | C      | D      | F

A     | C	  | D      | %

A     | C       | D     | A     |

A     | C       | D     | A     |

D     | E       | D     | %     |

A     | %       |

A     | C       | D     | A     |

A     | C       | D     | A     |

A     | C       | D     | A     |

A     | C       | D     | A     |

D     | E       | D     | %     |

A     | %       | %     | %     |`;

async function testChordChart() {
  console.log('=== Testing Specific Chord Chart ===\n');

  try {
    console.log('Step 1: Sending chord chart to API...');
    console.log('Chord chart preview:', chordChart.substring(0, 150) + '...\n');
    
    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch('http://localhost:3000/api/chord-to-midi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chart: chordChart }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
      console.error('\n✗ API call failed');
      console.error('Error:', errorData.error);
      if (errorData.details) {
        console.error('Details:', errorData.details);
      }
      process.exit(1);
    }

    const blob = await response.blob();
    console.log(`\n✓ Received MIDI file (${blob.size} bytes)`);

    if (blob.size === 0) {
      console.error('\n✗ MIDI file is empty!');
      process.exit(1);
    }

    // Save to file for inspection
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(__dirname, 'tmp', 'test-chord-chart-specific.mid');
    const buffer = Buffer.from(await blob.arrayBuffer());
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, buffer);
    console.log(`✓ Saved MIDI file to: ${outputPath}`);

    // Try to parse with @tonejs/midi to check if it's valid
    console.log('\nStep 2: Validating MIDI file structure...');
    try {
      const arrayBuffer = await blob.arrayBuffer();
      
      // Use dynamic import with proper handling
      const midiModule = await import('@tonejs/midi');
      const Midi = midiModule.default?.Midi || midiModule.Midi || midiModule.default;
      
      if (!Midi || typeof Midi !== 'function') {
        throw new Error('Could not find Midi class in @tonejs/midi module');
      }
      
      const midi = new Midi(arrayBuffer);
      
      console.log('✓ MIDI file parsed successfully');
      console.log('  Tracks:', midi.tracks.length);
      console.log('  Duration:', midi.duration, 'seconds');
      
      midi.tracks.forEach((track, i) => {
        console.log(`  Track ${i}: ${track.notes.length} notes`);
        if (track.notes.length > 0) {
          const firstNote = track.notes[0];
          const lastNote = track.notes[track.notes.length - 1];
          console.log(`    First note: ${firstNote.name} (MIDI ${firstNote.midi}) at ${firstNote.time.toFixed(2)}s`);
          console.log(`    Last note: ${lastNote.name} (MIDI ${lastNote.midi}) at ${lastNote.time.toFixed(2)}s`);
          console.log(`    Note range: ${track.notes.map(n => n.name).slice(0, 10).join(', ')}${track.notes.length > 10 ? '...' : ''}`);
        }
      });
      
      const hasNotes = midi.tracks.some(track => track.notes.length > 0);
      if (!hasNotes) {
        console.error('\n✗ MIDI file has no notes!');
        console.error('MIDI structure:', {
          tracks: midi.tracks.length,
          trackDetails: midi.tracks.map(t => ({
            notes: t.notes.length,
            instrument: t.instrument?.name,
            channel: t.channel
          }))
        });
        process.exit(1);
      }
      
      const totalNotes = midi.tracks.reduce((sum, track) => sum + track.notes.length, 0);
      console.log(`\n✓ MIDI file is valid and contains ${totalNotes} notes`);
      console.log('\n=== TEST PASSED ===\n');
    } catch (parseError) {
      console.error('\n✗ Failed to parse MIDI file:', parseError.message);
      console.error('This suggests the MIDI file is malformed');
      console.error('Stack:', parseError.stack);
      process.exit(1);
    }

  } catch (err) {
    console.error('\n✗ Test failed:', err.message);
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

testChordChart();

