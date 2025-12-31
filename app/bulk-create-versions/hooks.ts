import { useState, useEffect, useCallback } from 'react';
import { parseHTMLContent } from '../../src/components/slides/slideUtils';
import type { Song, Section, ProcessResult, StatusType } from './types';
import { ParsedLine } from '../../src/components/slides/types';

const groupIntoSections = (lines: ParsedLine[]): Section[] => {
  const result: Section[] = [];
  let currentTitle = '';
  let currentLines: ParsedLine[] = [];

  const flushSection = () => {
    if (!currentTitle) return;
    const contentLines = currentLines
      .filter(line => line.text && !line.isHeading)
      .map(line => line.text || '');
    result.push({
      title: currentTitle,
      content: contentLines.join('\n').trim(),
      lines: currentLines,
    });
  };

  for (const line of lines) {
    if (line.isHeading && line.text) {
      flushSection();
      currentTitle = line.text;
      currentLines = [];
    } else if (!line.isHr && !line.isEmpty) {
      currentLines.push(line);
    }
  }
  flushSection();
  return result;
};

const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix: number[][] = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
};

const calculateSimilarity = (str1: string, str2: string): number => {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 100;
  return Math.round(((maxLength - distance) / maxLength) * 100);
};

const calculateSubstringMatch = (str1: string, str2: string, minChars: number = 15): number => {
  const lower1 = str1.toLowerCase().trim();
  const lower2 = str2.toLowerCase().trim();
  const shorter = lower1.length <= lower2.length ? lower1 : lower2;
  const longer = lower1.length <= lower2.length ? lower2 : lower1;
  if (longer.includes(shorter) && shorter.length >= minChars) {
    return 95;
  }
  return 0;
};

type CandidateSong = {
  song: Song;
  similarity: number;
};

const findCandidateSongs = (title: string, songsList: Song[], threshold: number = 70, limit: number = 5): CandidateSong[] => {
  const normalizedTitle = title.trim();
  const candidates: CandidateSong[] = [];
  for (const song of songsList) {
    const substringMatch = calculateSubstringMatch(normalizedTitle, song.title);
    const levenshteinMatch = calculateSimilarity(normalizedTitle, song.title);
    const similarity = Math.max(substringMatch, levenshteinMatch);
    if (similarity >= threshold) {
      candidates.push({ song, similarity });
    }
  }
  candidates.sort((a, b) => b.similarity - a.similarity);
  return candidates.slice(0, limit);
};

const findMatchingSong = (title: string, songsList: Song[]): Song | null => {
  const normalizedTitle = title.trim().toLowerCase();
  return songsList.find(song => song.title.toLowerCase() === normalizedTitle) || null;
};

export const useSongs = () => {
  const [songs, setSongs] = useState<Song[]>([]);

  const loadSongs = async (): Promise<Song[]> => {
    try {
      const response = await fetch('/api/songs');
      const data = await response.json();
      const loadedSongs = data.songs || [];
      setSongs(loadedSongs);
      return loadedSongs;
    } catch (error) {
      console.error('Failed to load songs:', error);
      return [];
    }
  };

  useEffect(() => {
    loadSongs();
  }, []);

  return { songs, loadSongs };
};

export const useSections = (htmlContent: string) => {
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    if (htmlContent.trim()) {
      const parsedLines = parseHTMLContent(htmlContent);
      const parsedSections = groupIntoSections(parsedLines);
      setSections(parsedSections);
    } else {
      setSections([]);
    }
  }, [htmlContent]);

  return sections;
};

export const useStatus = () => {
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<StatusType>(null);

  const showStatus = useCallback((message: string, type: StatusType) => {
    setStatusMessage(message);
    setStatusType(type);
  }, []);

  return { statusMessage, statusType, showStatus };
};

export const useProcessSections = (
  songs: Song[],
  loadSongs: () => Promise<Song[]>,
  sections: Section[],
  versionSuffix: string,
  userName: string,
  versionSelections: Map<string, string>
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ProcessResult[]>([]);

  const processSections = async () => {
    if (!versionSuffix.trim()) {
      alert('Please enter a version suffix');
      return;
    }

    if (!userName || userName.trim().length < 3) {
      alert('Please set your username (at least 3 characters) before creating versions');
      return;
    }

    setIsProcessing(true);
    setResults([]);

    if (sections.length === 0) {
      alert('No sections found. Make sure your text contains headings (h1-h6)');
      setIsProcessing(false);
      return;
    }

    let songsToUse = songs;
    if (songsToUse.length === 0) {
      songsToUse = await loadSongs();
      if (songsToUse.length === 0) {
        alert('Failed to load songs. Please try again.');
        setIsProcessing(false);
        return;
      }
    }

    const processedResults: ProcessResult[] = [];

    for (const section of sections) {
      let matchedSong: Song | null = null;
      let previousVersionId: string | null = null;
      const selectedVersionId = versionSelections.get(section.title);
      if (selectedVersionId) {
        // Find song by version ID
        for (const song of songsToUse) {
          const version = song.versions.find(v => v.id === selectedVersionId);
          if (version) {
            matchedSong = song;
            previousVersionId = selectedVersionId;
            break;
          }
        }
      } else {
        matchedSong = findMatchingSong(section.title, songsToUse);
        if (matchedSong) {
          const latestVersion = matchedSong.versions.find(v => v.nextVersionId === null);
          previousVersionId = latestVersion?.id || null;
        }
      }
      
      if (!matchedSong) {
        processedResults.push({ title: section.title, matched: false });
        continue;
      }

      try {
        const response = await fetch('/api/songs/versions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            songId: matchedSong.id,
            label: versionSuffix.trim(),
            content: section.content,
            previousVersionId,
            createdBy: userName,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          processedResults.push({
            title: section.title,
            matched: true,
            songId: matchedSong.id,
            error: errorData.error || 'Failed to create version',
          });
        } else {
          processedResults.push({
            title: section.title,
            matched: true,
            songId: matchedSong.id,
          });
        }
      } catch (error) {
        processedResults.push({
          title: section.title,
          matched: true,
          songId: matchedSong.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    setResults(processedResults);
    setIsProcessing(false);
  };

  return { isProcessing, results, processSections };
};

export const usePreviewItems = (sections: Section[], songs: Song[], versionSuffix: string, versionSelections: Map<string, string>) => {
  return sections.map(section => {
    const matchedSong = findMatchingSong(section.title, songs);
    const selectedVersionId = versionSelections.get(section.title) || null;
    const candidateSongs = findCandidateSongs(section.title, songs);
    return {
      sectionTitle: section.title,
      song: matchedSong,
      candidateSongs,
      selectedVersionId,
      versionName: versionSuffix.trim() || '(no suffix)',
      contentPreview: section.content.slice(0, 100) + (section.content.length > 100 ? '...' : ''),
    };
  });
};
