'use client';
import { marked } from 'marked';

const MarkdownRenderer = ({content, monospace}: {content: string, monospace?: boolean}) => {
  const renderer = new marked.Renderer();
  renderer.code = function({text}: {text: string}) {
    return text;
  };
  return (
    <div 
      className={`markdown-content text-sm ${monospace ? 'monospace' : ''}`}
      style={monospace ? { whiteSpace: 'pre-wrap' } : undefined}
      dangerouslySetInnerHTML={{ __html: marked.parse(content, { breaks: true, renderer }) as string }}
    />
  );
};

export default MarkdownRenderer;
