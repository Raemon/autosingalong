'use client';

import { type ReactElement } from 'react';
import ProgramElementItem from './components/ProgramElementItem';
import type { Program, VersionOption } from '../types';

export type ProgramStructurePanelProps = {
  program: Program | null;
  programMap: Record<string, Program>;
  versions: VersionOption[];
  versionMap: Record<string, VersionOption>;
  selectedVersionId?: string;
  onVersionClick: (versionId: string) => void | Promise<void>;
};

const noop = () => {};

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

  const renderProgram = (current: Program, depth: number, trail: Set<string>): ReactElement => {
    const nextTrail = new Set(trail);
    nextTrail.add(current.id);

    return (
      <div
        key={`${current.id}-${depth}`}
        className={`rounded border border-gray-800 bg-black/30 p-3 ${depth > 0 ? 'ml-4' : ''}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="text-xl font-georgia">
            {depth === 0 ? 'Program elements' : current.title}
          </div>
        </div>
        <div className="mt-2 flex flex-col divide-y divide-gray-900">
          {current.elementIds.length === 0 && (
            <div className="py-2 text-xs text-gray-500">No elements yet.</div>
          )}
          {current.elementIds.map((elementId, index) => {
            const version = versionMap[elementId];
            return (
              <ProgramElementItem
                key={`${elementId}-${current.id}`}
                id={elementId}
                index={index}
                version={version}
                allVersions={versions}
                onRemove={noop}
                onChangeVersion={noop}
                onClick={handleElementClick}
                canEdit={false}
                selectedVersionId={selectedVersionId}
                showDropdown={false}
              />
            );
          })}
        </div>
        {current.programIds.length > 0 && (
          <div className="mt-3 flex flex-col gap-3">
            {current.programIds.map((childId) => {
              if (nextTrail.has(childId)) {
                return (
                  <div key={`${childId}-cycle`} className="text-xs text-red-400">
                    Circular reference detected for {childId}
                  </div>
                );
              }
              const childProgram = programMap[childId];
              if (!childProgram) {
                return (
                  <div key={`${childId}-missing`} className="text-xs text-gray-500">
                    Program {childId} unavailable.
                  </div>
                );
              }
              return renderProgram(childProgram, depth + 1, nextTrail);
            })}
          </div>
        )}
      </div>
    );
  };

  const subprogramNames = program.programIds
    .map((childId) => programMap[childId]?.title)
    .filter(Boolean) as string[];

  return (
    <div className="border-l border-gray-200 pl-4 w-full max-w-xl h-[calc(100vh-2rem)] overflow-y-auto scrollbar-hide">
      <div className="mb-4">
        <h2 className="font-georgia text-2xl mb-1">{program.title}</h2>
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
      {renderProgram(program, 0, new Set())}
    </div>
  );
};

export default ProgramStructurePanel;

