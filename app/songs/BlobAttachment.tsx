'use client';

import { useState, useEffect } from 'react';
import ChevronArrow from '@/app/components/ChevronArrow';
import PDFViewer from './PDFViewer';

const getFileType = (pathname: string): 'image' | 'video' | 'audio' | 'pdf' | 'text' | null => {
  const ext = pathname.split('.').pop()?.toLowerCase();
  if (!ext) return null;
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
  if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'].includes(ext)) return 'audio';
  if (ext === 'pdf') return 'pdf';
  if (['txt', 'md', 'json', 'xml', 'csv'].includes(ext)) return 'text';
  return null;
};

const TextPreview = ({ url }: { url: string }) => {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    fetch(url)
      .then(res => res.text())
      .then(setContent)
      .catch(() => setError(true));
  }, [url]);
  if (error) return <div className="text-red-400 text-sm py-2">Failed to load text</div>;
  if (content === null) return <div className="text-gray-400 text-sm py-2">Loading...</div>;
  return <pre className="bg-gray-900 p-2 text-xs overflow-auto max-h-64 my-2 whitespace-pre-wrap">{content.slice(0, 5000)}</pre>;
};

const FilePreview = ({ url, pathname }: { url: string; pathname: string }) => {
  const fileType = getFileType(pathname);
  if (!fileType) return <div className="text-gray-500 text-sm py-2">Cannot preview this file type</div>;
  switch (fileType) {
    case 'image':
      return <img src={url} alt={pathname} className="max-w-full max-h-96 object-contain my-2" />;
    case 'video':
      return <video src={url} controls className="max-w-full max-h-96 my-2" />;
    case 'audio':
      return <audio src={url} controls className="my-2" />;
    case 'pdf':
      return <PDFViewer fileUrl={url} />;
    case 'text':
      return <TextPreview url={url} />;
    default:
      return null;
  }
};

const BlobAttachment = ({ blobUrl, defaultExpanded = false }: { blobUrl: string; defaultExpanded?: boolean }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [downloading, setDownloading] = useState(false);
  const filename = (() => {
    try {
      const pathname = new URL(blobUrl).pathname;
      return pathname.split('/').pop() || 'Attached file';
    } catch {
      return blobUrl.split('/').pop() || 'Attached file';
    }
  })();
  const fileType = getFileType(filename);
  const canPreview = fileType !== null;

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (downloading) return;
    setDownloading(true);
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-1">
        {canPreview ? (
          <ChevronArrow isExpanded={expanded} className="cursor-pointer text-xs opacity-50 hover:opacity-100" onClick={() => setExpanded(!expanded)} />
        ) : (
          <span className="w-3" />
        )}
        <a href={blobUrl} target="_blank" rel="noreferrer" className="text-blue-400 underline text-xs">
          📎 {filename}
        </a>
        <button onClick={handleDownload} disabled={downloading} className="text-gray-400 hover:text-gray-200 text-xs ml-1 disabled:opacity-50">{downloading ? '...' : '⬇'}</button>
      </div>
      {expanded && canPreview && (
        <div className="ml-4 mt-4">
          <FilePreview url={blobUrl} pathname={filename} />
        </div>
      )}
    </div>
  );
};

export default BlobAttachment;
