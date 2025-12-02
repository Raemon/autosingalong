'use client';

import { type ReactElement } from 'react';
import ProgramStructureNode from './components/ProgramStructureNode';
import type { Program, VersionOption } from '../types';

export type ProgramStructurePanelProps = {
  program: Program | null;
  programMap: Record<string, Program>;
  versions: VersionOption[];
  versionMap: Record<string, VersionOption>;
  selectedVersionId?: string;
  onVersionClick: (versionId: string) => void | Promise<void>;
};

const ProgramStructurePanel = ({
  program,
  programMap,
  versions,
  versionMap,
  selectedVersionId,
  onVersionClick,
}: ProgramStructurePanelProps): ReactElement => {
  if (!program) {
    return (
      <div className="border-l border-gray-200 pl-4 w-full max-w-xl h-[calc(100vh-2rem)] overflow-y-auto scrollbar-hide">
        <p className="text-sm text-gray-400">Select a program to explore its contents.</p>
      </div>
    );
  }

  const handleElementClick = (versionId: string) => {
    void onVersionClick(versionId);
  };

  const subprogramNames = program.programIds
    .map((childId) => programMap[childId]?.title)
    .filter(Boolean) as string[];

  return (
    <div className="border-l border-gray-200 pl-4 w-full max-w-xl h-[calc(100vh-2rem)] overflow-y-auto scrollbar-hide">
      <div className="mb-4">
        <div className="text-xs text-gray-400">
          {program.elementIds.length} elements · {program.programIds.length} linked programs
        </div>
        {subprogramNames.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-300">
            {subprogramNames.map((name) => (
              <span key={name} className="rounded-full border border-gray-700 px-2 py-0.5">
                {name}
              </span>
            ))}
          </div>
        )}
      </div>
      <ProgramStructureNode
        current={program}
        depth={0}
        trail={new Set()}
        programMap={programMap}
        versionMap={versionMap}
        versions={versions}
        selectedVersionId={selectedVersionId}
        onElementClick={handleElementClick}
      />
    </div>
  );
};

export default ProgramStructurePanel;

