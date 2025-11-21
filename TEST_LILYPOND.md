# Testing LilyPond (.ly) File Rendering

## Quick Test

1. **Start the dev server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Option A: Test via the test page**
   - Navigate to: http://localhost:3000/test-lilypond
   - Click "Test Simple LilyPond" button
   - Should see: "Success! Generated 1 page(s)" with rendered sheet music below
   
3. **Option B: Test via the songs page**
   - Navigate to: http://localhost:3000/songs
   - Find "Walk With Me" song (or any song with a .ly file)
   - Click to expand "sheet-music.ly"
   - Should see: Sheet music rendered as SVG

## Manual API Test

```bash
cd /Users/raymondarnold/Documents/autosingalong

# Test simple LilyPond
node -e "
const fs = require('fs');
const simpleLy = '\\\\version \"2.18.2\"\\n{c\\' d\\' e\\' f\\'}';
const formData = new FormData();
formData.append('content', simpleLy);
fetch('http://localhost:3000/api/lilypond-to-svg', {
  method: 'POST',
  body: formData
}).then(r => r.json()).then(d => console.log('Result:', d));
"
```

## Expected Behavior

### When expanding a .ly file:
1. **Loading state**: "Converting LilyPond to sheet music..."
2. **Success state**: Sheet music rendered as SVG images (one per page)
3. **Error state**: Error message with collapsible source code

### Console logs (check browser DevTools):
- "LilyPond conversion successful: X pages" on success
- "LilyPond API Error: ..." on failure

## Files Changed

1. `/app/api/lilypond-to-svg/route.ts` - API endpoint for conversion
2. `/app/songs/LilypondViewer.tsx` - React component to display SVG
3. `/app/songs/SongItem.tsx` - Integration to detect and render .ly files
4. `/app/test-lilypond/page.tsx` - Test page for debugging

## Songs with .ly Files

Run this to find all songs with .ly files:
```bash
find songs -name "*.ly" | head -10
```

Known examples:
- Walk_With_Me/sheet-music.ly
- Sons_of_Martha/sheet-music.ly
- Beautiful_Tomorrow/Beautiful_Tomorrow_duet.ly

## Troubleshooting

### "Failed to convert LilyPond to SVG"
1. Check if LilyPond is installed: `lilypond --version`
2. Check server logs for detailed error messages
3. Try the test page at /test-lilypond for more detailed error info

### .ly file not rendering
1. Open browser DevTools Console
2. Look for "LilyPond" related messages
3. Check Network tab for /api/lilypond-to-svg request
4. Verify the file is actually a .ly file (check extension)

### Server won't start
1. Kill any existing processes: `pkill -f "next dev"`
2. Restart: `npm run dev`
3. Wait 10-15 seconds for full initialization


















