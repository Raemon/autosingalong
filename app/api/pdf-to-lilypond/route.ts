import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import canvas from 'canvas';

const { createCanvas, DOMMatrix } = canvas;

// Polyfill DOMMatrix for Node.js environment
if (typeof globalThis.DOMMatrix === 'undefined' && DOMMatrix) {
  // @ts-expect-error - DOMMatrix types may not match exactly between canvas and globalThis
  globalThis.DOMMatrix = DOMMatrix;
}

// Use dynamic import for pdfjs-dist to avoid issues with ESM
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsLib: any;
async function getPdfjsLib() {
  if (!pdfjsLib) {
    // Use legacy build which is designed for Node.js and doesn't require workers
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    // Set workerSrc - required even with disableWorker: true
    // We use a dummy path since the worker won't actually be used
    if (pdfjsLib.GlobalWorkerOptions) {
      try {
        // Try to resolve the actual worker path from node_modules
        const workerPath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
      } catch {
        // Fallback to a dummy value - with disableWorker: true, it won't be loaded anyway
        pdfjsLib.GlobalWorkerOptions.workerSrc = '//fake-worker-path';
      }
    }
  }
  return pdfjsLib;
}

// NodeCanvasFactory for pdfjs to work with node-canvas
class NodeCanvasFactory {
  create(width: number, height: number) {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    return {
      canvas,
      context,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reset(canvasAndContext: any, width: number, height: number) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  destroy(canvasAndContext: any) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const songName = formData.get('songName') as string;
    const fileName = formData.get('fileName') as string;

    if (!file || !songName || !fileName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    // Read PDF file
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    // Load PDF.js library
    const pdfjs = await getPdfjsLib();

    // Load PDF document
    const canvasFactory = new NodeCanvasFactory();
    const loadingTask = pdfjs.getDocument({ 
      data,
      canvasFactory,
      disableWorker: true,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;

    // Convert all pages to PNG images concurrently
    const pagePromises = Array.from({ length: numPages }, async (_, index: number) => {
      const pageNumber = index + 1;
      const page = await pdfDocument.getPage(pageNumber);
      
      // Set viewport scale
      const viewport = page.getViewport({ scale: 2.0 });
      
      // Create canvas using the factory
      const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);
      
      // Render PDF page to canvas
      const renderContext = {
        canvasContext: canvasAndContext.context,
        viewport: viewport,
        canvas: canvasAndContext.canvas,
      };
      await page.render(renderContext).promise;
      
      // Convert canvas to PNG buffer
      const buffer = canvasAndContext.canvas.toBuffer('image/png');
      return buffer.toString('base64');
    });

    const pageImages: string[] = await Promise.all(pagePromises);

    // Send all pages to OpenRouter concurrently
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 });
    }
    console.log('openRouterKey', openRouterKey);

    const conversionPromises = pageImages.map((imageBase64, index) => 
      convertPageToLilypond(imageBase64, index + 1, numPages, openRouterKey)
    );
    const pageResults = await Promise.all(conversionPromises);

    // Intelligently stitch the results together
    const stitchedLilypond = stitchLilypondPages(pageResults);

    // Save to file
    const songsDir = path.join(process.cwd(), 'songs');
    const songDir = path.join(songsDir, songName);
    const outputFileName = fileName.replace(/\.pdf$/i, '.ly');
    const outputPath = path.join(songDir, outputFileName);

    await fs.writeFile(outputPath, stitchedLilypond, 'utf-8');

    return NextResponse.json({ 
      success: true, 
      fileName: outputFileName,
      numPages,
      message: `Successfully converted ${numPages} page(s) to Lilypond`
    });
  } catch (error) {
    console.error('Error converting PDF to Lilypond:', error);
    return NextResponse.json({ 
      error: 'Failed to convert PDF to Lilypond',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function convertPageToLilypond(
  imageBase64: string, 
  pageNum: number, 
  totalPages: number,
  apiKey: string
): Promise<string> {
  const prompt = pageNum === 1 
    ? `You are a music notation expert. Convert this sheet music image to Lilypond format. This is page ${pageNum} of ${totalPages}. Include the full Lilypond header with version, title, composer, and all necessary structure. Provide ONLY the Lilypond code without any explanation or markdown formatting.`
    : `You are a music notation expert. Convert this sheet music image to Lilypond format. This is page ${pageNum} of ${totalPages} (continuation). Provide ONLY the music notation code for this page without headers or version declarations. Continue from where the previous page left off.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:3000',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  // Clean up markdown code blocks if present
  let cleaned = content.trim();
  if (cleaned.startsWith('```lilypond') || cleaned.startsWith('```ly')) {
    cleaned = cleaned.replace(/^```(?:lilypond|ly)\n/, '').replace(/\n```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\n/, '').replace(/\n```$/, '');
  }
  
  return cleaned;
}

function stitchLilypondPages(pages: string[]): string {
  if (pages.length === 0) return '';
  if (pages.length === 1) return pages[0];

  // Extract header and version from first page
  const firstPage = pages[0];
  let header = '';
  let version = '';
  let firstPageMusic = firstPage;

  // Extract version declaration
  const versionMatch = firstPage.match(/\\version\s+"[^"]+"/);
  if (versionMatch) {
    version = versionMatch[0] + '\n\n';
    firstPageMusic = firstPage.replace(versionMatch[0], '').trim();
  }

  // Extract header block
  const headerMatch = firstPageMusic.match(/\\header\s*\{[\s\S]*?\}/);
  if (headerMatch) {
    header = headerMatch[0] + '\n\n';
    firstPageMusic = firstPageMusic.replace(headerMatch[0], '').trim();
  }

  // Extract score structure from first page
  const scoreMatch = firstPageMusic.match(/\\score\s*\{/);
  
  if (scoreMatch) {
    // Has explicit score block - need to merge music content
    const musicBlocks = pages.map(page => extractMusicFromScore(page));
    const combinedMusic = musicBlocks.join('\n');
    
    // Reconstruct with merged music
    const layoutMatch = firstPageMusic.match(/\\layout\s*\{[\s\S]*?\}/);
    const layout = layoutMatch ? '\n  ' + layoutMatch[0] : '';
    
    return `${version}${header}\\score {\n  {\n${combinedMusic}\n  }${layout}\n}`;
  } else {
    // Simple concatenation for pages without explicit score structure
    const allMusic = pages.map((page, index) => {
      if (index === 0) return firstPageMusic;
      // Strip any headers/versions from subsequent pages
      let cleaned = page.replace(/\\version\s+"[^"]+"\s*/g, '');
      cleaned = cleaned.replace(/\\header\s*\{[\s\S]*?\}\s*/g, '');
      return cleaned.trim();
    }).join('\n\n');
    
    return `${version}${header}${allMusic}`;
  }
}

function extractMusicFromScore(page: string): string {
  // Remove version and header
  let cleaned = page.replace(/\\version\s+"[^"]+"\s*/g, '');
  cleaned = cleaned.replace(/\\header\s*\{[\s\S]*?\}\s*/g, '');
  
  // Try to extract content within \score { ... }
  const scoreMatch = cleaned.match(/\\score\s*\{([\s\S]*)\}/);
  if (scoreMatch) {
    let scoreContent = scoreMatch[1].trim();
    // Remove layout block
    scoreContent = scoreContent.replace(/\\layout\s*\{[\s\S]*?\}\s*/g, '');
    // Remove outer braces if present
    scoreContent = scoreContent.replace(/^\{\s*/, '').replace(/\s*\}$/, '');
    return '    ' + scoreContent.trim().split('\n').join('\n    ');
  }
  
  return '    ' + cleaned.trim().split('\n').join('\n    ');
}

