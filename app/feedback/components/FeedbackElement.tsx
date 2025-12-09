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

type FeedbackElementProps = {
  version: VersionOption;
  index: number;
  onClick: () => void;
  isSelected: boolean;
};

const FeedbackElement = ({ version, index, onClick, isSelected }: FeedbackElementProps) => {
  const isSpeech = version?.tags?.includes('speech');
  const [selected, setSelected] = useState(false);

  return (
    <div
      className={`flex relative group/feedback-element justify-start items-start gap-2 text-sm px-2 py-1 cursor-pointer w-[300px]]`}
      onClick={() => {setSelected(!selected); onClick();}}
    >
      <span className={`${isSelected ? 'text-primary' : ''} w-[200px] font-georgia text-base ${isSpeech ? 'italic' : ''}`}>
        {version?.songTitle || 'Unknown'}
      </span>
      <div className="flex items-start gap-2 flex-shrink-0">
        <div className="w-[100px]">
          <VoteWidget versionId={version?.id} songId={version?.songId} hideVotes/>
        </div>
        {/* <div className={`opacity-0 group-hover/feedback-element:opacity-100 ${selected ? 'opacity-100' : ''} absolute top-0 right-0`}> */}
          <InlineCommentBox versionId={version?.id} />
        {/* </div> */}
      </div>
    </div>
  );
};

export default FeedbackElement;

