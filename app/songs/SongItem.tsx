'use client';

import { useState } from 'react';
import SheetMusicViewer from './SheetMusicViewer';
import PDFViewer from './PDFViewer';
import LilypondViewer from './LilypondViewer';
import { usePdfToLilypond } from './usePdfToLilypond';

type Song = {
  name: string;
  files: { name: string; size: number; mtime: string; }[];
};

type FileContent = {
  [key: string]: string;
};

// Helper functions for file type detection
const isAudioFile = (fileName: string): boolean => {
  const audioExtensions = ['.mp3', '.wav', '.aiff', '.aif', '.ogg', '.flac', '.m4a', '.aac', '.wma'];
  return audioExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
};

const isMusicScoreFile = (fileName: string): boolean => {
  return fileName.toLowerCase().endsWith('.mscz');
};

const isPDFFile = (fileName: string): boolean => {
  return fileName.toLowerCase().endsWith('.pdf');
};

const isLilypondFile = (fileName: string): boolean => {
  return fileName.toLowerCase().endsWith('.ly');
};

// Formatting utilities
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

// Button component for consistent styling
const ActionButton = ({onClick, disabled, children, variant = 'primary'}: {onClick: () => void, disabled?: boolean, children: React.ReactNode, variant?: 'primary' | 'secondary'}) => {
  const baseClasses = "text-xs px-2 py-0.5";
  const variantClasses = variant === 'primary' 
    ? "bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
    : "text-blue-600 hover:text-blue-800 hover:underline";
  
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${variantClasses}`}>
      {children}
    </button>
  );
};

// Status message component
const StatusMessage = ({type, children}: {type: 'error' | 'success', children: React.ReactNode}) => {
  const colorClass = type === 'error' ? 'text-red-600' : 'text-green-600';
  return <div className={`ml-8 px-2 py-0.5 text-xs ${colorClass}`}>{children}</div>;
};

// File content renderer component
const FileContentRenderer = ({fileName, isLoading, content, songName}: {fileName: string, isLoading: boolean, content: string, songName: string}) => {
  const fileUrl = `/api/songs?song=${encodeURIComponent(songName)}&file=${encodeURIComponent(fileName)}`;
  
  if (isLoading) {
    return <p className="text-gray-500 text-xs">Loading...</p>;
  }
  
  if (isAudioFile(fileName)) {
    return (
      <audio controls src={fileUrl} className="w-full">
        Your browser does not support the audio element.
      </audio>
    );
  }
  
  if (isPDFFile(fileName)) {
    return <PDFViewer fileUrl={fileUrl} />;
  }
  
  if (isMusicScoreFile(fileName)) {
    return <SheetMusicViewer musicXml={content} />;
  }
  
  if (isLilypondFile(fileName)) {
    return <LilypondViewer lilypondContent={content} />;
  }
  
  return <pre className="text-gray-800 text-xs overflow-x-auto whitespace-pre-wrap break-words">{content}</pre>;
};

// Individual file row component
const FileRow = ({file, songName, isExpanded, isLoading, content, onToggle, onDownload, onConvert, conversionStatus}: {
  file: { name: string; size: number; mtime: string; };
  songName: string;
  isExpanded: boolean;
  isLoading: boolean;
  content: string;
  onToggle: () => void;
  onDownload: () => void;
  onConvert?: () => void;
  conversionStatus: { state: string; error?: string | null; numPages?: number | null; fileName?: string | null; };
}) => {
  const showConvertButton = isPDFFile(file.name);
  
  return (
    <div>
      <div className="flex items-center gap-3 px-2 py-1 hover:bg-gray-50">
        <button onClick={onToggle} className="text-gray-400 text-xs w-4">{isExpanded ? '▼' : '▶'}</button>
        <button onClick={onToggle} className="flex-1 text-left font-mono text-sm min-w-0">
          <span className="text-gray-800">{file.name}</span>
        </button>
        <span className="text-gray-400 text-xs w-20">{formatFileSize(file.size)}</span>
        <span className="text-gray-400 text-xs w-20">{formatDate(file.mtime)}</span>
        <div className="flex items-center gap-2">
          {showConvertButton && onConvert && (
            <ActionButton onClick={onConvert} disabled={conversionStatus.state === 'converting'} variant="primary">
              {conversionStatus.state === 'converting' ? 'Converting...' : conversionStatus.state === 'success' ? '✓ Converted' : 'To Lilypond'}
            </ActionButton>
          )}
          <ActionButton onClick={onDownload} variant="secondary">download</ActionButton>
        </div>
      </div>
      
      {conversionStatus.state === 'error' && (
        <StatusMessage type="error">Error: {conversionStatus.error}</StatusMessage>
      )}
      {conversionStatus.state === 'success' && conversionStatus.numPages && (
        <StatusMessage type="success">
          Converted {conversionStatus.numPages} page(s) to {conversionStatus.fileName}
        </StatusMessage>
      )}
      
      {isExpanded && (
        <div className="ml-8 mr-2 my-1 p-2 bg-gray-50">
          <FileContentRenderer 
            fileName={file.name}
            isLoading={isLoading}
            content={content}
            songName={songName}
          />
        </div>
      )}
    </div>
  );
};

const SongItem = ({song, onRefreshSongs, renderName, renderFiles}: {
  song: Song;
  onRefreshSongs?: () => Promise<void>;
  renderName?: boolean;
  renderFiles?: boolean;
}) => {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [fileContents, setFileContents] = useState<FileContent>({});
  const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set());
  const { convertPdf, getConversionStatus } = usePdfToLilypond();

  const handleDownload = (fileName: string) => {
    const url = `/api/songs?song=${encodeURIComponent(song.name)}&file=${encodeURIComponent(fileName)}&binary=true`;
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchFileContent = async (fileName: string, fileKey: string) => {
    setLoadingFiles(prev => new Set(prev).add(fileKey));
    
    try {
      if (fileName.toLowerCase().endsWith('.mscz')) {
        // Fetch the .mscz file as a blob
        const msczResponse = await fetch(`/api/songs?song=${encodeURIComponent(song.name)}&file=${encodeURIComponent(fileName)}`);
        if (!msczResponse.ok) throw new Error('Failed to fetch .mscz file');
        const msczBlob = await msczResponse.blob();
        
        // Convert it using the convert API
        const formData = new FormData();
        formData.append('file', msczBlob, fileName);
        
        const convertResponse = await fetch('/api/convert', {
          method: 'POST',
          body: formData,
        });
        
        if (!convertResponse.ok) {
          const errorData = await convertResponse.json();
          throw new Error(errorData.error || 'Failed to convert .mscz file');
        }
        const mxmlContent = await convertResponse.text();
        setFileContents(prev => ({ ...prev, [fileKey]: mxmlContent }));
      } else if (isLilypondFile(fileName)) {
        // For Lilypond files, fetch as plain text to avoid backslash escaping
        const response = await fetch(`/api/songs?song=${encodeURIComponent(song.name)}&file=${encodeURIComponent(fileName)}`);
        if (!response.ok) throw new Error('Failed to fetch file content');
        const content = await response.text();
        setFileContents(prev => ({ ...prev, [fileKey]: content }));
      } else {
        // For other files, fetch content normally
        const response = await fetch(`/api/songs?song=${encodeURIComponent(song.name)}&file=${encodeURIComponent(fileName)}`);
        if (!response.ok) throw new Error('Failed to fetch file content');
        const data = await response.json();
        setFileContents(prev => ({ ...prev, [fileKey]: data.content }));
      }
    } catch (err) {
      setFileContents(prev => ({ ...prev, [fileKey]: `Error loading file content: ${err instanceof Error ? err.message : 'Unknown error'}` }));
    } finally {
      setLoadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileKey);
        return newSet;
      });
    }
  };

  const toggleFile = async (fileName: string) => {
    const fileKey = `${song.name}/${fileName}`;
    const newExpandedFiles = new Set(expandedFiles);

    if (expandedFiles.has(fileKey)) {
      newExpandedFiles.delete(fileKey);
      setExpandedFiles(newExpandedFiles);
    } else {
      newExpandedFiles.add(fileKey);
      setExpandedFiles(newExpandedFiles);

      // Skip fetching content for audio and PDF files (they'll be loaded directly via src)
      // Fetch content for Lilypond files since we need to convert them
      const needsContentFetch = !isAudioFile(fileName) && !isPDFFile(fileName);
      
      if (needsContentFetch && !fileContents[fileKey]) {
        await fetchFileContent(fileName, fileKey);
      }
    }
  };

  const handleConvertToLilypond = async (fileName: string) => {
    try {
      const response = await fetch(`/api/songs?song=${encodeURIComponent(song.name)}&file=${encodeURIComponent(fileName)}`);
      if (!response.ok) throw new Error('Failed to fetch PDF file');
      const pdfBlob = await response.blob();
      await convertPdf(song.name, fileName, pdfBlob);
      if (onRefreshSongs) {
        await onRefreshSongs();
      }
    } catch (err) {
      console.error('Error converting PDF to Lilypond:', err);
    }
  };

  if (renderName) {
    return (
      <div className="px-2 py-1 text-base font-medium border-b border-gray-200 font-georgia">
        {song.name.replace(/_/g, ' ')}
      </div>
    );
  }

  if (renderFiles) {
    return (
      <div className="border-b border-gray-200">
        {song.files.map((file) => {
          const fileKey = `${song.name}/${file.name}`;
          const isExpanded = expandedFiles.has(fileKey);
          const isLoadingFile = loadingFiles.has(fileKey);
          const conversionStatus = getConversionStatus(song.name, file.name);
          
          return (
            <FileRow
              key={file.name}
              file={file}
              songName={song.name}
              isExpanded={isExpanded}
              isLoading={isLoadingFile}
              content={fileContents[fileKey]}
              onToggle={() => toggleFile(file.name)}
              onDownload={() => handleDownload(file.name)}
              onConvert={isPDFFile(file.name) ? () => handleConvertToLilypond(file.name) : undefined}
              conversionStatus={conversionStatus}
            />
          );
        })}
      </div>
    );
  }

  return null;
};

export default SongItem;
