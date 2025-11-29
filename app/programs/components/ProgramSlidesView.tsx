'use client';

import type { Slide, ParsedLine } from '../../../src/components/slides/types';

type SongSlideData = {
  versionId: string;
  songTitle: string;
  versionLabel: string;
  slides: Slide[];
};

const SlideItem = ({slide, slideIndex, songIndex}:{slide: Slide, slideIndex: number, songIndex: number}) => {
  return (
    <div className="bg-black p-2 text-sm">
      <div className="text-xs text-gray-500 mb-1">Song {songIndex + 1} - Slide {slideIndex + 1}</div>
      <div className="space-y-1">
        {slide.map((line: ParsedLine, lineIndex: number) => {
          if (line.isImage) {
            return <img key={lineIndex} src={line.src} alt="" className="max-w-full h-auto" />;
          }
          if (line.isHeading) {
            return <div key={lineIndex} className="font-bold">{line.text}</div>;
          }
          return <div key={lineIndex}>{line.text}</div>;
        })}
      </div>
    </div>
  );
};

const ProgramSlidesView = ({slides}:{slides: SongSlideData[]}) => {
  if (slides.length === 0) {
    return (
      <div className="text-sm text-gray-400">
        No songs in program yet.
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold">Program Slides</div>
      {slides.map((songData, songIndex) => (
        <div key={songData.versionId} className="space-y-2">
          <div className="text-sm font-semibold">{songData.songTitle} - {songData.versionLabel}</div>
          {songData.slides.length === 0 ? (
            <div className="text-xs text-gray-500">No slides available</div>
          ) : (
            <div className="space-y-2">
              {songData.slides.map((slide, slideIndex) => (
                <SlideItem key={slideIndex} slide={slide} slideIndex={slideIndex} songIndex={songIndex} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProgramSlidesView;

