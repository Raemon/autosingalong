'use client';

import ChordmarkRenderer from '@/app/chordmark-converter/ChordmarkRenderer';

const PRINT_STYLE_OVERRIDES = `
  .styled-chordmark .cmSong .cmChordLineOffset,
  .styled-chordmark .cmSong .cmChordSymbol,
  .styled-chordmark .cmSong .cmChordDuration,
  .styled-chordmark .cmSong .cmBarSeparator,
  .styled-chordmark .cmSong .cmTimeSignature,
  .styled-chordmark .cmSong .cmSubBeatGroupOpener,
  .styled-chordmark .cmSong .cmSubBeatGroupCloser {
    color: #444;
  }
  .styled-chordmark .cmSong .cmBracketMeta {
    color: #555;
  }
`;

const ScriptSongRenderer = ({content}: {content: string}) => {
  return (
    <div className="styled-chordmark lyrics-wrap text-xs font-mono">
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLE_OVERRIDES }} />
      <ChordmarkRenderer 
        content={content}
        defaultMode="lyrics"
        print={true}
      />
    </div>
  );
};

export default ScriptSongRenderer;

