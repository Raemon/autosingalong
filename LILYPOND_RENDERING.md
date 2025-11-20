# LilyPond (.ly) File Rendering

## Overview
LilyPond files (.ly) are now rendered as sheet music when expanded in the songs list. The implementation converts LilyPond files to SVG format on the server side using the LilyPond command-line tool, then displays them in the browser.

## Components

### 1. API Endpoint: `/app/api/lilypond-to-svg/route.ts`
- Accepts LilyPond content via POST request
- Uses LilyPond CLI to convert to SVG format
- Handles multi-page output (if the music spans multiple pages)
- Returns SVG content for rendering in the browser

### 2. Viewer Component: `/app/songs/LilypondViewer.tsx`
- Client-side component that fetches and displays SVG sheet music
- Handles loading states and errors gracefully
- Falls back to showing the LilyPond source code if conversion fails
- Supports multi-page sheet music display

### 3. Integration: `/app/songs/SongItem.tsx`
- Added `isLilypondFile()` helper function to detect .ly files
- Updated `FileContentRenderer` to use `LilypondViewer` for .ly files
- Fetches .ly file content when expanded (similar to other text-based formats)

## Requirements
- **LilyPond must be installed on the server**: The system uses the `lilypond` command-line tool to convert .ly files to SVG
- Install from: https://lilypond.org/download.html
- Current installation: GNU LilyPond 2.24.4

## Usage
1. Navigate to the songs page
2. Find a song with a .ly file (e.g., Walk_With_Me/sheet-music.ly)
3. Click to expand the file
4. The sheet music will be rendered as SVG images

## Error Handling
- If LilyPond is not installed, users see a helpful error message with installation instructions
- If conversion fails, the component shows the error and provides access to the source code
- Conversion timeout is set to 30 seconds to prevent hanging

## Testing
Tested with existing .ly files in the repository:
- Walk_With_Me/sheet-music.ly (4 pages)
- Sons_of_Martha/sheet-music.ly
- Beautiful_Tomorrow/Beautiful_Tomorrow_duet.ly
- And others...

All conversions were successful with valid SVG output.


