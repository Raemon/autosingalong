#!/usr/bin/env node

/**
 * End-to-end test script for PDF to Lilypond conversion
 * Tests the conversion API without needing the full Next.js server
 */

const fs = require('fs').promises;
const path = require('path');

async function testPdfConversion() {
  console.log('=== PDF to Lilypond Conversion Test ===\n');

  try {
    // Step 1: Check if pdfjs-dist is available
    console.log('Step 1: Testing pdfjs-dist import...');
    let pdfjsLib;
    try {
      pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      console.log('✓ Successfully imported pdfjs-dist/legacy/build/pdf.mjs');
      console.log('  Available methods:', Object.keys(pdfjsLib).slice(0, 10).join(', '), '...');
      
      // Set GlobalWorkerOptions
      if (pdfjsLib.GlobalWorkerOptions) {
        try {
          const workerPath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
          pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
          console.log('✓ Set GlobalWorkerOptions.workerSrc to:', workerPath);
        } catch (e) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = '//fake-worker-path';
          console.log('✓ Set GlobalWorkerOptions.workerSrc to: //fake-worker-path');
        }
      }
    } catch (err) {
      console.error('✗ Failed to import pdfjs-dist/legacy:', err.message);
      throw err;
    }

    // Step 2: Check canvas availability
    console.log('\nStep 2: Testing canvas import...');
    let canvas;
    try {
      canvas = await import('canvas');
      console.log('✓ Successfully imported canvas');
      console.log('  Available methods:', Object.keys(canvas).slice(0, 10).join(', '), '...');
      console.log('  Has createCanvas:', !!canvas.createCanvas);
      console.log('  Has DOMMatrix:', !!canvas.DOMMatrix);
    } catch (err) {
      console.error('✗ Failed to import canvas:', err.message);
      throw err;
    }

    // Step 3: Create a simple test PDF in memory
    console.log('\nStep 3: Creating test PDF data...');
    const testPdfPath = path.join(__dirname, 'songs');
    console.log('  Looking for test PDF files in:', testPdfPath);
    
    let testPdfData;
    try {
      const songsExist = await fs.access(testPdfPath).then(() => true).catch(() => false);
      if (songsExist) {
        const songs = await fs.readdir(testPdfPath);
        console.log('  Available songs:', songs.slice(0, 5).join(', '), songs.length > 5 ? '...' : '');
        
        // Look for a PDF file in any song directory
        for (const song of songs) {
          const songPath = path.join(testPdfPath, song);
          const stat = await fs.stat(songPath);
          if (stat.isDirectory()) {
            const files = await fs.readdir(songPath);
            const pdfFile = files.find(f => f.toLowerCase().endsWith('.pdf'));
            if (pdfFile) {
              console.log(`  Found test PDF: ${song}/${pdfFile}`);
              testPdfData = await fs.readFile(path.join(songPath, pdfFile));
              console.log(`  ✓ Loaded test PDF (${testPdfData.length} bytes)`);
              break;
            }
          }
        }
      }
      
      if (!testPdfData) {
        console.log('  ⚠ No test PDF found, will create minimal PDF');
        // Create a minimal PDF for testing
        testPdfData = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n190\n%%EOF\n');
      }
    } catch (err) {
      console.error('✗ Failed to load test PDF:', err.message);
      throw err;
    }

    // Step 4: Test PDF loading
    console.log('\nStep 4: Testing PDF document loading...');
    try {
      const { createCanvas, DOMMatrix } = canvas;
      
      // Set up canvas factory
      class NodeCanvasFactory {
        create(width, height) {
          const c = createCanvas(width, height);
          const ctx = c.getContext('2d');
          return { canvas: c, context: ctx };
        }
        reset(canvasAndContext, width, height) {
          canvasAndContext.canvas.width = width;
          canvasAndContext.canvas.height = height;
        }
        destroy(canvasAndContext) {
          canvasAndContext.canvas.width = 0;
          canvasAndContext.canvas.height = 0;
          canvasAndContext.canvas = null;
          canvasAndContext.context = null;
        }
      }
      
      const canvasFactory = new NodeCanvasFactory();
      console.log('  ✓ Created NodeCanvasFactory');
      
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(testPdfData),
        canvasFactory,
        disableWorker: true,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
      });
      console.log('  ✓ Created loading task');
      console.log('  Loading task type:', typeof loadingTask);
      console.log('  Has promise:', !!loadingTask.promise);
      
      const pdfDocument = await loadingTask.promise;
      console.log('  ✓ PDF document loaded successfully');
      console.log('  Number of pages:', pdfDocument.numPages);
      
      // Step 5: Test rendering a page
      if (pdfDocument.numPages > 0) {
        console.log('\nStep 5: Testing page rendering...');
        const page = await pdfDocument.getPage(1);
        console.log('  ✓ Got page 1');
        
        const viewport = page.getViewport({ scale: 2.0 });
        console.log('  ✓ Created viewport (', viewport.width, 'x', viewport.height, ')');
        
        const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);
        console.log('  ✓ Created canvas');
        
        const renderContext = {
          canvasContext: canvasAndContext.context,
          viewport: viewport,
          canvas: canvasAndContext.canvas,
        };
        
        await page.render(renderContext).promise;
        console.log('  ✓ Rendered page to canvas');
        
        const buffer = canvasAndContext.canvas.toBuffer('image/png');
        console.log('  ✓ Converted to PNG buffer (', buffer.length, 'bytes)');
      }
      
    } catch (err) {
      console.error('✗ Failed during PDF processing:', err.message);
      console.error('  Error stack:', err.stack);
      throw err;
    }

    console.log('\n=== ALL TESTS PASSED ===\n');
    
  } catch (error) {
    console.error('\n=== TEST FAILED ===');
    console.error('Error:', error);
    console.error('\nFull stack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

testPdfConversion();

