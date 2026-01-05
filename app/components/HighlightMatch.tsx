const HighlightMatch = ({text, searchTerm}: {text: string; searchTerm?: string}) => {
  if (!searchTerm || searchTerm.trim() === '') return <>{text}</>;
  const searchLower = searchTerm.toLowerCase();
  const textLower = text.toLowerCase();
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let index = textLower.indexOf(searchLower);
  while (index !== -1) {
    if (index > lastIndex) parts.push(text.slice(lastIndex, index));
    parts.push(<span key={index} className="text-white underline">{text.slice(index, index + searchTerm.length)}</span>);
    lastIndex = index + searchTerm.length;
    index = textLower.indexOf(searchLower, lastIndex);
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <>{parts}</>;
};

export default HighlightMatch;