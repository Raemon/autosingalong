'use client';

import { useState, useEffect } from 'react';

// Module-level cache for static markdown files
const markdownCache: Record<string, string> = {};

const useStaticMarkdown = (path: string): { content: string; loading: boolean } => {
  const [content, setContent] = useState<string>(markdownCache[path] || '');
  const [loading, setLoading] = useState(!markdownCache[path]);

  useEffect(() => {
    if (markdownCache[path]) {
      setContent(markdownCache[path]);
      setLoading(false);
      return;
    }
    fetch(path)
      .then(res => res.text())
      .then(text => {
        markdownCache[path] = text;
        setContent(text);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [path]);

  return { content, loading };
};

export default useStaticMarkdown;