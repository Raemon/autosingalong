# FAQ

## Song Formats

Songs can have multiple content types that get rendered automatically:
- **Full chords + lyrics** - Complete chord chart
- **Chords only** - Just the chord progression
- **Lyrics only** - Plain text lyrics for slides/projections
- **Chords + first lyric line** - Compact reference format
- **Slides** - Formatted for projection

The system supports ChordMark syntax for chord charts, which can be transposed and played back.

## Version Tracking

Every song version tracks:
- **Previous/Next version** - For browsing version history
- **Original version** - Links to the root of a version chain
- **BPM and transpose** - Playback settings
- **Audio URL** - Optional linked audio file
- **Slide movie URL** - For video content

## Program Structure

Programs contain ordered elements that can reference song versions. When a program is **locked**, it preserves historical accuracy while still allowing the underlying songs to receive new versions.

## Feedback System

Votes include:
- **Quality**: Hate, Dislike, Eh, Like, or Love
- **Singability**: Easy, Medium, or Hard
- **Comments**: Aggregate across all solstices to show patterns

Feedback is tied to song versions but can be viewed at the song level.

## Authentication

- **Anonymous**: View all content
- **Logged in**: Vote, comment
- **Admin**: Edit content, manage programs, access backups

## Data Sync

Content imports from secularsolstice.github.io daily. The system maintains its own database but tracks which content originated from the GitHub source.

## Backups

Database backups can be created and restored. Public backups are available for data portability.