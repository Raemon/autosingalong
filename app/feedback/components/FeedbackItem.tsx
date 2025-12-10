'use client';

import VoteWidget from "./VoteWidget";
import InlineCommentBox from "./InlineCommentBox";
import { useState } from "react";

type VersionOption = {
  id: string;
  songId: string;
  label: string;
  songTitle: string;
  createdAt: string;
  tags: string[];
};

type FeedbackItemProps = {
  version: VersionOption;
  index: number;
  onClick: () => void;
  isSelected: boolean;
};

export const gridCols = '190px 210px 120px 1fr'

const FeedbackItem = ({ version, index, onClick, isSelected }: FeedbackItemProps) => {
  const isSpeech = version?.tags?.includes('speech');
  const isSong = version?.tags?.includes('song');
  const [selected, setSelected] = useState(false);

  return (
    <div
      className="relative group/feedback-element cursor-pointer border-b border-gray-500 px-2 flex flex-col gap-2 md:grid md:items-center md:gap-4 text-sm"
      style={{ gridTemplateColumns: `var(--md-grid, ${gridCols})` }}
    >
      <div className={`py-1 ${isSelected ? 'text-primary' : ''} font-georgia text-base ${isSpeech ? 'italic' : ''}`} onClick={() => {setSelected(!selected); onClick();}}>
        {version?.songTitle}
      </div>
      <div className="flex items-center gap-2">
        <VoteWidget versionId={version?.id} songId={version?.songId} category="quality" hideVotes/>
      </div>
      <div className="flex items-center gap-2">
        {isSong && <VoteWidget versionId={version?.id} songId={version?.songId} category="singability" hideVotes/>}
      </div>
      <InlineCommentBox versionId={version?.id} />
    </div>
  );
};

export default FeedbackItem;

