declare module 'pptxgenjs' {
  export default class PptxGenJS {
    layout: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ShapeType: any;
    addSlide(): unknown;
    writeFile(options: { fileName: string }): Promise<void>;
  }
}

