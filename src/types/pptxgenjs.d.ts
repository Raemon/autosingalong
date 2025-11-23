declare module 'pptxgenjs' {
  type SlideOptions = Record<string, unknown>;

  interface Slide {
    background?: { data: string };
    addShape(type: number, options: SlideOptions): void;
    addImage(options: SlideOptions): void;
    addText(text: string, options: SlideOptions): void;
  }

  export default class PptxGenJS {
    layout: string;
    ShapeType: Record<string, number>;
    addSlide(): Slide;
    writeFile(options: { fileName: string }): Promise<void>;
  }
}

