'use client';

import VoteWidget from "./VoteWidget";

type VersionOption = {
  id: string;
  songId: string;
  label: string;
  songTitle: string;
  createdAt: string;
  tags: string[];
};

type SimpleProgramElementProps = {
  version: VersionOption;
  index: number;
  onClick: () => void;
  isSelected: boolean;
};

const SimpleProgramElement = ({ version, index, onClick, isSelected }: SimpleProgramElementProps) => {
  const isSpeech = version?.tags?.includes('speech');

  return (
    <div
      className={`flex justify-between items-center gap-2 text-sm px-2 py-1 cursor-pointer hover:bg-black`}
      onClick={onClick}
    >
      <span className={`${isSelected ? 'text-primary' : ''} font-georgia text-base ${isSpeech ? 'italic' : ''}`}>
        {version?.songTitle || 'Unknown'}
      </span>
      <VoteWidget versionId={version?.id} songId={version?.songId} hideVotes/>
    </div>
  );
};

export default SimpleProgramElement;

