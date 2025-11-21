#!/usr/bin/env node

/**
 * Test script for chord-to-midi API endpoint
 */

const testChordChart = `A:

|Am…| | C D | |Am…| x 8

| C D | |Am…| |C D| |G…|

B:

|Am…| |F…| |C…| |G…|

|Am…| |F…| |C…| |G…|

|Am…| |F…| |G…| |G…|

|Am…| |F…| |G…| |Am…|

A:

|Am…| | C D | |Am…| x 8

| C D | |Am…| |C D| |G…|

B:

|Am…| |F…| |C…| |G…|

|Am…| |F…| |C…| |G…|

|Am…| |F…| |G…| |G…|

|Am…| |F…| 

C:

|G…| |G…| |Am…| |F…| x2

|G…| |Am…|`;

async function testChordToMidi() {
  console.log('=== Chord to MIDI API Test ===\n');

  try {
    console.log('Step 1: Sending chord chart to API...');
    console.log('Chord chart preview:', testChordChart.substring(0, 100) + '...\n');
    
    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch('http://localhost:3000/api/chord-to-midi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chart: testChordChart }),
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

    // Save to file for inspection
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(__dirname, 'tmp', 'test-chord-output.mid');
    const buffer = Buffer.from(await blob.arrayBuffer());
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, buffer);
    console.log(`✓ Saved MIDI file to: ${outputPath}`);

    // Try to parse with @tonejs/midi to check if it's valid
    console.log('\nStep 2: Validating MIDI file structure...');
    try {
      const { Midi } = await import('@tonejs/midi');
      const arrayBuffer = await blob.arrayBuffer();
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error('MIDI file is empty');
      }
      
      const midi = new Midi(arrayBuffer);
      
      console.log('✓ MIDI file parsed successfully');
      console.log('  Tracks:', midi.tracks.length);
      console.log('  Duration:', midi.duration, 'seconds');
      
      midi.tracks.forEach((track, i) => {
        console.log(`  Track ${i}: ${track.notes.length} notes`);
        if (track.notes.length > 0) {
          console.log(`    First note: ${track.notes[0].name} at ${track.notes[0].time}s`);
          console.log(`    Last note: ${track.notes[track.notes.length - 1].name} at ${track.notes[track.notes.length - 1].time}s`);
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
      
      console.log('\n✓ MIDI file is valid and contains notes');
    } catch (parseError) {
      console.error('\n✗ Failed to parse MIDI file:', parseError.message);
      console.error('This suggests the MIDI file is malformed');
      process.exit(1);
    }

    console.log('\n=== TEST PASSED ===\n');
  } catch (err) {
    console.error('\n✗ Test failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

testChordToMidi();

