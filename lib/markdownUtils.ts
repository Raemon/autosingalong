// Shared utilities for processing markdown files
// Used by both importUtils.ts and processMarkdownVersions.ts

// Strip special characters (removes all non-alphanumeric, lowercases, trims)
export const stripSpecialChars = (str: string): string => {
  return str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
};

export const normalizeString = (str: string): string => {
  return stripSpecialChars(str);
};

export const isHeaderStartingWithBy = (line: string): boolean => {
  const trimmed = line.trim();
  if (!trimmed.startsWith('#')) return false;
  // Remove header markers and check if it starts with "by "
  const withoutHeader = trimmed.replace(/^#+\s*/, '').trim();
  return withoutHeader.toLowerCase().startsWith('by ');
};

export const convertHeaderToItalics = (line: string): string => {
  // Remove header markers (#, ##, ###, etc.)
  const withoutHeader = line.replace(/^#+\s*/, '');
  // Convert to italics
  return `*${withoutHeader}*`;
};
