#!/usr/bin/env node

/**
 * Test script for chord chart parsing logic
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

// Copy the parsing logic from the route
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
    
    const lineWithRepetition = line.match(/^(.+?)\s+x\s*(\d+)$/i);
    if (lineWithRepetition) {
      const barLine = lineWithRepetition[1];
      const repeatCount = parseInt(lineWithRepetition[2], 10);
      
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

console.log('=== Testing Chord Chart Parsing ===\n');

const sections = parseChordChart(testChordChart);

console.log('Parsed sections:', sections.length);
sections.forEach((section, i) => {
  console.log(`\nSection ${i}: "${section.section}"`);
  console.log(`  Bars: ${section.bars.length}`);
  let totalChords = 0;
  section.bars.forEach((bar, barIdx) => {
    totalChords += bar.length;
    if (barIdx < 5) { // Show first 5 bars
      console.log(`    Bar ${barIdx}: [${bar.join(', ')}]`);
    }
  });
  console.log(`  Total chords: ${totalChords}`);
});

console.log('\n=== Parsing Test Complete ===');




