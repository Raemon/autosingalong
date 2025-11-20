'use client';

import { useEffect, useState } from 'react';

const LilypondViewer = ({lilypondContent}:{lilypondContent: string | undefined}) => {
  const [svgs, setSvgs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const convertToSvg = async () => {
      if (!lilypondContent || lilypondContent.trim() === '') return;

      console.log('[LilypondViewer] Starting conversion, content length:', lilypondContent.length);
      setIsLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('content', lilypondContent);

        console.log('[LilypondViewer] Sending request to /api/lilypond-to-svg');
        const response = await fetch('/api/lilypond-to-svg', {
          method: 'POST',
          body: formData,
        });

        console.log('[LilypondViewer] Response status:', response.status, response.statusText);

        if (!response.ok) {
          const responseText = await response.text();
          console.error('[LilypondViewer] Error response:', responseText);
          
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch {
            throw new Error(`Server error (${response.status}): ${responseText.substring(0, 200)}`);
          }
          
          console.error('[LilypondViewer] API Error:', errorData);
          throw new Error(errorData.error || 'Failed to convert LilyPond to SVG');
        }

        const data = await response.json();
        console.log('[LilypondViewer] Conversion successful:', data.pageCount, 'pages');
        setSvgs(data.svgs || []);
      } catch (err) {
        console.error('[LilypondViewer] Error converting LilyPond to SVG:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    convertToSvg();
  }, [lilypondContent]);

  if (!lilypondContent || lilypondContent.trim() === '') {
    return <div className="text-gray-500 text-xs">No LilyPond content available</div>;
  }

  if (isLoading) {
    return <div className="text-gray-500 text-xs">Converting LilyPond to sheet music...</div>;
  }

  if (error) {
    return (
      <div className="text-red-600 text-xs">
        <div>Error rendering sheet music: {error}</div>
        <details className="mt-2">
          <summary className="cursor-pointer text-gray-600">Show LilyPond source</summary>
          <pre className="mt-2 text-gray-800 overflow-x-auto whitespace-pre-wrap break-words">{lilypondContent}</pre>
        </details>
      </div>
    );
  }

  if (svgs.length === 0) {
    return <div className="text-gray-500 text-xs">No sheet music generated</div>;
  }

  return (
    <div className="w-full space-y-4">
      {svgs.map((svg, index) => (
        <div 
          key={index} 
          className="w-full overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ))}
    </div>
  );
};

export default LilypondViewer;

