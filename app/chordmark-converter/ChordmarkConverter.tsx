'use client';

import { useState, useEffect } from 'react';
import { serializeToChordmark, combineChordsAndLyrics } from './utils';
import { useChordmarkParser, useChordmarkRenderer } from './ChordmarkRenderer';

const ChordmarkConverter = () => {
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const parsedSong = useChordmarkParser(inputText);
  const baseOutputs = useChordmarkRenderer(parsedSong.song);

  const renderedOutputs = {
    ...baseOutputs,
    htmlChordsFirstLyricLine: baseOutputs.htmlFull ? (() => {
      try { return combineChordsAndLyrics(baseOutputs.htmlFull); } catch { return baseOutputs.htmlFull; }
    })() : '',
    plainText: parsedSong.song ? serializeToChordmark(parsedSong.song) : '',
  };

  useEffect(() => {
    setError(parsedSong.error || renderedOutputs.renderError);
  }, [parsedSong.error, renderedOutputs.renderError]);

  return (
    <div className="p-4">
      <style dangerouslySetInnerHTML={{__html: `
        .styled-chordmark .cmSong {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          white-space: pre;
          font-variant-ligatures: none;
        }
        .styled-chordmark .cmSong * {
          font-family: inherit;
          white-space: inherit;
        }
        .styled-chordmark .cmSong p {
          margin: 0;
          line-height: 1.2;
        }
        .styled-chordmark .cmSong p + p {
          margin-top: 0.25em;
        }
        .styled-chordmark .cmSong .cmLine,
        .styled-chordmark .cmSong .cmChordLine,
        .styled-chordmark .cmSong .cmLyricLine,
        .styled-chordmark .cmSong .cmChordLyricLine,
        .styled-chordmark .cmSong .cmSectionLabel,
        .styled-chordmark .cmSong .cmEmptyLine {
          display: block;
        }
        .styled-chordmark .cmSong .cmChordLyricPair {
          display: inline-flex;
          gap: 1ch;
        }
        .styled-chordmark .cmSong .cmChordLineOffset,
        .styled-chordmark .cmSong .cmChordSymbol,
        .styled-chordmark .cmSong .cmChordDuration,
        .styled-chordmark .cmSong .cmBarSeparator,
        .styled-chordmark .cmSong .cmTimeSignature,
        .styled-chordmark .cmSong .cmSubBeatGroupOpener,
        .styled-chordmark .cmSong .cmSubBeatGroupCloser {
          white-space: inherit;
        }
        .styled-chordmark .cmSong .cmSectionLabel {
          font-weight: 600;
        }
        .styled-chordmark .cmSong .cmEmptyLine {
          min-height: 0.5em;
        }
      `}} />
      <h1 className="text-xl mb-4">Chordmark Converter</h1>
      
      <div className="mb-4 p-3 bg-gray-50 text-xs">
        <div className="font-semibold mb-2">Chordmark Syntax:</div>
        <div className="space-y-1">
          <div><strong>Chords:</strong> Use bars <code>|C|G|Am|F|</code> or chord names <code>C G Am F</code></div>
          <div><strong>Lyrics:</strong> Plain text lines. Use <code>_</code> to align chords with lyrics</div>
          <div><strong>Sections:</strong> <code>#v</code> (verse), <code>#c</code> (chorus), <code>#b</code> (bridge), <code>#i</code> (intro), <code>#o</code> (outro). Use <code>#v2</code> for numbered sections, <code>#c x2</code> for repetition</div>
          <div><strong>Key:</strong> <code>{'{key: C}'}</code> or <code>{'{key: Am}'}</code></div>
          <div><strong>Time signature:</strong> <code>4/4</code>, <code>3/4</code>, etc.</div>
          <div><strong>Comments:</strong> Lines starting with <code>#</code> that aren&apos;t section labels are ignored during rendering</div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-800 text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold mb-2">Chordmark Input</h2>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter chordmark notation..."
            className="flex-1 p-2 border text-xs font-mono"
            rows={20}
          />
        </div>

        <div className="flex flex-col">
          <h2 className="text-sm font-semibold mb-2">HTML (Full Chart)</h2>
          <div className="flex-1 p-2 border overflow-auto text-xs font-mono styled-chordmark">
            {renderedOutputs.htmlFull ? (
              <div dangerouslySetInnerHTML={{ __html: renderedOutputs.htmlFull }} />
            ) : (
              <div className="text-gray-400">Enter chordmark to see rendered output</div>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <h2 className="text-sm font-semibold mb-2">HTML (Chords Only)</h2>
          <div className="flex-1 p-2 border overflow-auto text-xs font-mono">
            {renderedOutputs.htmlChordsOnly ? (
              <div dangerouslySetInnerHTML={{ __html: renderedOutputs.htmlChordsOnly }} />
            ) : (
              <div className="text-gray-400">Enter chordmark to see rendered output</div>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <h2 className="text-sm font-semibold mb-2">HTML (Lyrics Only)</h2>
          <div className="flex-1 p-2 border overflow-auto text-xs font-mono styled-chordmark">
            {renderedOutputs.htmlLyricsOnly ? (
              <div dangerouslySetInnerHTML={{ __html: renderedOutputs.htmlLyricsOnly }} />
            ) : (
              <div className="text-gray-400">Enter chordmark to see rendered output</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChordmarkConverter;