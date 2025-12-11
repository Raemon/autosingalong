'use client';

import VoteWidget from "./VoteWidget";
import InlineCommentBox from "./InlineCommentBox";
import { useState } from "react";
import ChevronArrow from "@/app/components/ChevronArrow";
import FeedbackDetail from "./FeedbackDetail";
import { FullVersion } from "../ProgramFeedback";

type VersionOption = {
  id: string;
  songId: string;
  label: string;
  songTitle: string;
  createdAt: string;
  tags: string[];
};

type Comment = {
  id: string;
  version_id: string;
  content: string;
  created_by: string;
  created_at: string;
};

type Vote = {
  version_id: string;
  weight: number;
  type: string;
  category: string;
  created_at: string;
};

type FeedbackItemProps = {
  version: VersionOption;
  index: number;
  onClick: () => void;
  isSelected: boolean;
  existingComment?: Comment | null;
  onCommentPosted?: (comment: Comment) => void;
  userVotes?: Vote[];
  content?: string;
};

export const gridCols = '190px 210px 120px 1fr'

const FeedbackItem = ({ version, index, onClick, isSelected, existingComment, onCommentPosted, userVotes, content }: FeedbackItemProps) => {
  const isSpeech = version?.tags?.includes('speech');
  const isSong = version?.tags?.includes('song');
  const [selected, setSelected] = useState(false);

  const qualityVote = userVotes?.find(v => v.category === 'quality');
  const singabilityVote = userVotes?.find(v => v.category === 'singability');

  return (
    <div className="border-b border-gray-500">
      <div
          className="relative group/feedback-element cursor-pointer px-2 flex flex-col gap-2 md:grid md:items-center md:gap-4 text-sm"
          style={{ gridTemplateColumns: `var(--md-grid, ${gridCols})` }}
        >
          <div className={`flex items-center py-1 ${isSelected ? 'text-primary' : ''} font-georgia text-base`} onClick={() => {setSelected(!selected); onClick();}}>
            <ChevronArrow isExpanded={selected} className={`${isSelected ? 'text-base' : 'text-xs opacity-35'} mr-4`} />
            <span className={`${isSpeech && 'italic'}`}>{version?.songTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <VoteWidget versionId={version?.id} songId={version?.songId} category="quality" hideVotes preloadedUserVote={qualityVote}/>
          </div>
          <div className="flex items-center gap-2">
            {!isSpeech && <VoteWidget versionId={version?.id} songId={version?.songId} category="singability" hideVotes preloadedUserVote={singabilityVote}/>}
          </div>
          <InlineCommentBox versionId={version?.id} existingComment={existingComment} onCommentPosted={onCommentPosted} />
        </div>
      {selected && (
          <div className="flex-1 max-w-xl mt-4 mb-8">
            <FeedbackDetail
              version={version}
              content={content}
              onClose={() => setSelected(false)}
            />
          </div>
      )}
    </div>
  
  );
};

export default FeedbackItem;

