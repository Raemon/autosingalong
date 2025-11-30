'use client';

import { parseSong, renderSong } from 'chord-mark';
import { serializeToChordmark, combineChordsAndLyrics, extractTextFromHTML, convertCustomFormatToChordmark, prepareSongForRendering, prepareSongForChordsWithMeta, removeRepeatBarIndicators } from './utils';
import type { RenderedContent } from '@/lib/songsRepository';

// Client-side rendering function that generates all chordmark render types
// This is the same logic as in useChordmarkParser + useChordmarkRenderer, 
// but extracted so it can be called from form submission handlers
export const generateChordmarkRenderedContent = (content: string): RenderedContent => {
  if (!content || !content.trim()) {
    return {};
  }

  try {
    let textToParse = content.trim();
    
    // Extract text from HTML if needed
    if (textToParse.startsWith('<') && textToParse.includes('>')) {
      textToParse = extractTextFromHTML(textToParse);
    }

    if (!textToParse) {
      return {};
    }

    // Parse the song
    let parsedSong;
    try {
      parsedSong = removeRepeatBarIndicators(parseSong(textToParse));
    } catch {
      // Try custom format conversion
      const customResult = convertCustomFormatToChordmark(textToParse);
      if (customResult !== textToParse) {
        try {
          parsedSong = removeRepeatBarIndicators(parseSong(customResult));
        } catch {
          return {};
        }
      } else {
        return {};
      }
    }

    if (!parsedSong) {
      return {};
    }

    // Prepare songs for rendering
    const songForRendering = prepareSongForRendering(parsedSong);
    const songForChordsWithMeta = prepareSongForChordsWithMeta(parsedSong);

    // Render all types
    const htmlFull = renderSong(songForRendering, { chartType: 'all', accidentalsType: 'auto' });
    const htmlChordsOnly = songForChordsWithMeta 
      ? renderSong(songForChordsWithMeta, { chartType: 'all', alignChordsWithLyrics: false, accidentalsType: 'auto' })
      : renderSong(songForRendering, { chartType: 'chords', alignChordsWithLyrics: false, accidentalsType: 'auto' });
    const htmlLyricsOnly = renderSong(songForRendering, { chartType: 'lyrics', accidentalsType: 'auto' });
    
    // Generate combined chords first lyric line version
    let htmlChordsFirstLyricLine = htmlFull;
    try {
      htmlChordsFirstLyricLine = combineChordsAndLyrics(htmlFull);
    } catch {
      // If combining fails, just use the full HTML
    }

    // Generate plain text version
    const plainText = serializeToChordmark(parsedSong);

    return {
      htmlFull,
      htmlChordsOnly,
      htmlLyricsOnly,
      htmlChordsFirstLyricLine,
      plainText,
    };
  } catch (err) {
    console.error('Failed to generate chordmark rendered content:', err);
    return {};
  }
};

