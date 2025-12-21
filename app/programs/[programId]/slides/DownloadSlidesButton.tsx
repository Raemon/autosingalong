'use client';

import { useState } from 'react';
import pptxgen from 'pptxgenjs';
import type { Slide, ParsedLine } from '../../../../src/components/slides/types';

type DownloadSlidesButtonProps = {
  slides: Slide[];
  programTitle: string;
  getBackgroundForSlide: (index: number) => string | undefined;
  programTitleSlideIndices: Set<number>;
  className?: string;
};

const DownloadSlidesButton = ({ slides, programTitle, getBackgroundForSlide, programTitleSlideIndices, className }: DownloadSlidesButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePowerPoint = async () => {
    if (isGenerating || slides.length === 0) return;
    setIsGenerating(true);

    try {
      const pptx = new pptxgen();
      pptx.title = programTitle;
      pptx.author = 'Singalong';
      pptx.layout = 'LAYOUT_WIDE';

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const pptSlide = pptx.addSlide();
        const backgroundUrl = getBackgroundForSlide(i);
        const isProgramTitle = programTitleSlideIndices.has(i);
        const backgroundOpacity = isProgramTitle ? 0.2 : 0.65;

        if (backgroundUrl) {
          pptSlide.background = { data: backgroundUrl };
          pptSlide.addShape('rect', {
            x: 0, y: 0, w: '100%', h: '100%',
            fill: { color: '000000', transparency: (1 - backgroundOpacity) * 100 },
          });
        } else {
          pptSlide.background = { color: '000000' };
        }

        const lines = slide.filter((line: ParsedLine) => !line.isHr);
        if (lines.length === 0) continue;

        const isHeadingSlide = lines.length === 1 && lines[0].isHeading;
        const baseScale = 0.04;
        const headingScale = isProgramTitle ? baseScale * 3.5 : baseScale * 1.85;
        const baseFontPt = Math.round(540 * baseScale);
        const headingFontPt = Math.round(540 * headingScale);

        if (isHeadingSlide || isProgramTitle) {
          const headingLine = lines.find(l => l.isHeading) || lines[0];
          const text = (headingLine.text || '').replace(/[_]/g, ' ');
          pptSlide.addText(text, {
            x: 0, y: 0, w: '100%', h: '100%',
            fontSize: headingFontPt,
            bold: false,
            color: 'FFFFFF',
            align: 'center',
            valign: 'middle',
            fontFace: 'Georgia',
            shadow: { type: 'outer', blur: 10, offset: 0, angle: 0, color: '000000', opacity: 0.8 },
          });
        } else {
          const textContent: pptxgen.TextProps[] = [];
          for (const line of lines) {
            if (line.isEmpty) {
              textContent.push({ text: '\n', options: { fontSize: baseFontPt, color: 'FFFFFF', fontFace: 'Georgia' } });
            } else if (line.isSlideMeta) {
              textContent.push({ text: (line.text || '') + '\n', options: { fontSize: baseFontPt, color: 'FFFFFF', fontFace: 'Georgia', italic: true, transparency: 35 } });
            } else if (line.isHeading) {
              const text = (line.text || '').replace(/[_]/g, ' ');
              textContent.push({ text: text + '\n', options: { fontSize: headingFontPt, color: 'FFFFFF', fontFace: 'Georgia', shadow: { type: 'outer', blur: 10, offset: 0, angle: 0, color: '000000', opacity: 0.8 } } });
            } else {
              textContent.push({ text: (line.text || '') + '\n', options: { fontSize: baseFontPt, color: 'FFFFFF', fontFace: 'Georgia' } });
            }
          }
          pptSlide.addText(textContent, {
            x: 0.5, y: 0.5, w: '92%', h: '90%',
            valign: 'middle',
            align: 'center',
            lineSpacingMultiple: 1.15,
          });
        }
      }

      const filename = `${programTitle.replace(/[^a-zA-Z0-9]/g, '_')}_slides.pptx`;
      await pptx.writeFile({ fileName: filename });
    } catch (err) {
      console.error('Failed to generate PowerPoint:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={generatePowerPoint}
      disabled={isGenerating || slides.length === 0}
      className={className || "text-white text-xs bg-black bg-opacity-50 px-3 py-1 rounded disabled:opacity-50"}
    >
      {isGenerating ? 'Generating...' : 'Download PPTX'}
    </button>
  );
};

export default DownloadSlidesButton;