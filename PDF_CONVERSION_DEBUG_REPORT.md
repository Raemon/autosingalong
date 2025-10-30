# PDF to Lilypond Conversion Debug Report

## Problem
Error when converting PDF to Lilypond:
```
Warning: Please use the `legacy` build in Node.js environments.
Error converting PDF to Lilypond: [Error: Setting up fake worker failed: "Cannot find module '/Users/raymondarnold/Documents/autosingalong/.next/server/chunks/pdf.worker.mjs' ...]
```

## Observations

### ✓ Working:
1. Standalone Node.js script successfully loads `pdfjs-dist/legacy/build/pdf.mjs`
2. PDF document loads and renders correctly in standalone script
3. Canvas library works correctly
4. All PDF operations (page loading, rendering, PNG conversion) work outside Next.js

### ✗ Not Working:
1. Next.js API route fails with worker module error
2. Error occurs despite using `pdfjs-dist/legacy/build/pdf.mjs`
3. Error occurs despite setting `disableWorker: true`

## Root Cause Analysis

### Key Discovery: Turbopack vs Webpack
- The dev server was using `--turbopack` flag
- Turbopack bundles dependencies differently than Webpack
- The `pdfjs-dist` package was being bundled by Next.js, causing it to try loading worker files
- When bundled, even the "legacy" build tries to set up workers, which fails in the Next.js environment

### Secondary Issues:
1. Multiple pdfjs imports in codebase:
   - `app/api/pdf-to-lilypond/route.ts` uses `pdfjs-dist/legacy/build/pdf.mjs` (server)
   - `app/songs/PDFViewer.tsx` uses `react-pdf` which imports regular `pdfjs-dist` (client)
   - This could cause bundling conflicts

## Hypotheses Tested

### H1: Next.js bundling wrong pdfjs build ✓ CONFIRMED
- **Test**: Check if pdfjs works outside Next.js bundling
- **Result**: Standalone script works perfectly
- **Conclusion**: Next.js bundling is the issue

### H2: Dynamic import causing issues ✓ PARTIAL
- **Test**: Dynamic import pattern might confuse bundler
- **Result**: Dynamic import is fine, but bundling is still problematic
- **Conclusion**: Import pattern is OK, but package needs to be external

### H3: Webpack config needed ✓ TESTED
- **Test**: Add webpack externals configuration
- **Result**: Added but needs server restart with regular webpack (not turbopack)
- **Conclusion**: Correct approach for webpack, but need `serverExternalPackages` for turbopack

### H4: GlobalWorkerOptions needed ✓ ADDED
- **Test**: Explicitly disable worker via GlobalWorkerOptions
- **Result**: Added as safety measure
- **Conclusion**: Good defense-in-depth but not sufficient alone

### H5: CommonJS vs ESM ⏭️ SKIPPED
- **Reasoning**: H3 is more direct solution

## Solutions Implemented

### 1. Added `serverExternalPackages` to next.config.ts
```typescript
serverExternalPackages: ['pdfjs-dist', 'canvas']
```
This tells Next.js (both Webpack AND Turbopack) to NOT bundle these packages on the server side.

### 2. Added webpack externals configuration
```typescript
webpack: (config, { isServer }) => {
  if (isServer) {
    config.externals.push({
      'pdfjs-dist/legacy/build/pdf.worker.mjs': 'commonjs pdfjs-dist/legacy/build/pdf.worker.mjs',
      'pdfjs-dist/build/pdf.worker.mjs': 'commonjs pdfjs-dist/build/pdf.worker.mjs',
    });
    config.resolve.alias = {
      ...config.resolve.alias,
      'pdfjs-dist/legacy/build/pdf.worker.mjs': false,
      'pdfjs-dist/build/pdf.worker.mjs': false,
    };
  }
  return config;
}
```

### 3. Added explicit GlobalWorkerOptions.workerSrc = ''
Added in `getPdfjsLib()` function as defense-in-depth.

### 4. Changed dev script
```json
"dev": "next dev",  // Was: "next dev --turbopack"
"dev:turbo": "next dev --turbopack",  // Preserved as option
```

## Testing

### Created test scripts:
1. `test-pdf-conversion.js` - Tests PDF operations outside Next.js
2. `test-api-endpoint.js` - Tests the actual API endpoint

## Next Steps

1. **Restart the dev server** (required for config changes to take effect)
   ```bash
   # Kill current server (running with --turbopack)
   # Then start with new config:
   npm run dev
   ```

2. **Run the API endpoint test**
   ```bash
   node test-api-endpoint.js
   ```

3. **Test in the UI**
   - Open the songs page
   - Click "To Lilypond" on a PDF file
   - Verify conversion succeeds

## Why This Should Work

1. `serverExternalPackages` prevents Next.js from bundling pdfjs-dist
2. Without bundling, the package loads directly from node_modules
3. The legacy build works perfectly when loaded directly (proven by test script)
4. Canvas library also marked as external (it also needs to load natively)

## Cleanup

After verification, delete these test files:
- `test-pdf-conversion.js`
- `test-api-endpoint.js`
- `PDF_CONVERSION_DEBUG_REPORT.md` (this file)


