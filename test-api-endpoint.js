#!/usr/bin/env node

/**
 * End-to-end HTTP test for PDF to Lilypond conversion API endpoint
 */

const fs = require('fs');
const path = require('path');

async function testApiEndpoint() {
  console.log('=== API Endpoint Test ===\n');

  try {
    // Find a test PDF
    console.log('Step 1: Finding test PDF...');
    const testPdfPath = path.join(__dirname, 'songs/Beautiful_Tomorrow/Beautiful_Tomorrow_SATB_v1.4.pdf');
    
    if (!fs.existsSync(testPdfPath)) {
      console.error('✗ Test PDF not found:', testPdfPath);
      process.exit(1);
    }
    
    const pdfBuffer = fs.readFileSync(testPdfPath);
    console.log(`✓ Loaded test PDF (${pdfBuffer.length} bytes)`);

    // Create FormData
    console.log('\nStep 2: Creating request...');
    const FormData = (await import('undici')).FormData;
    const formData = new FormData();
    formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), 'test.pdf');
    formData.append('songName', 'test-song');
    formData.append('fileName', 'test.pdf');
    console.log('✓ Created form data');

    // Make request
    console.log('\nStep 3: Sending request to http://localhost:3000/api/pdf-to-lilypond...');
    const response = await fetch('http://localhost:3000/api/pdf-to-lilypond', {
      method: 'POST',
      body: formData,
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('\nStep 4: Response data:');
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✓ API call successful!');
      console.log('Converted', data.numPages, 'pages');
      console.log('Output file:', data.fileName);
    } else {
      console.error('\n✗ API call failed');
      console.error('Error:', data.error);
      if (data.details) {
        console.error('Details:', data.details);
      }
      process.exit(1);
    }

    console.log('\n=== TEST PASSED ===\n');
  } catch (error) {
    console.error('\n=== TEST FAILED ===');
    console.error('Error:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    console.error('\nFull stack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Check if server is running
console.log('Checking if Next.js dev server is running...');
fetch('http://localhost:3000')
  .then(() => {
    console.log('✓ Server is running\n');
    testApiEndpoint();
  })
  .catch(() => {
    console.error('✗ Server is not running on http://localhost:3000');
    console.error('Please start the dev server with: npm run dev');
    process.exit(1);
  });


