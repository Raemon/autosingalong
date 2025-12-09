'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Program } from '@/app/programs/types';
import Tooltip from '@/app/components/Tooltip';

type VoteRecord = {
  id: string;
  name: string;
  weight: number;
  type: string;
  versionId: string;
  songId: string;
  createdAt: string;
  category: string;
};

type VersionOption = {
  id: string;
  songId: string;
  label: string;
  songTitle: string;
  createdAt: string;
  tags: string[];
};

type FeedbackResultsProps = {
  programId: string;
};

const FeedbackResults = ({ programId }: FeedbackResultsProps) => {
  const [program, setProgram] = useState<Program | null>(null);
  const [subPrograms, setSubPrograms] = useState<Program[]>([]);
  const [versions, setVersions] = useState<VersionOption[]>([]);
  const [votes, setVotes] = useState<Record<string, VoteRecord[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProgram = useCallback(async () => {
    try {
      const response = await fetch(`/api/programs/${programId}`);
      if (!response.ok) throw new Error('Failed to load program');
      const data = await response.json();
      setProgram(data.program);
      
      if (data.program.programIds && data.program.programIds.length > 0) {
        const subProgramPromises = data.program.programIds.map((id: string) =>
          fetch(`/api/programs/${id}`).then(r => r.json())
        );
        const subProgramsData = await Promise.all(subProgramPromises);
        setSubPrograms(subProgramsData.map((d: any) => d.program));
      }
    } catch (err) {
      console.error('Failed to load program:', err);
      setError(err instanceof Error ? err.message : 'Failed to load program');
    }
  }, [programId]);

  const loadVersions = useCallback(async () => {
    try {
      const response = await fetch('/api/song-versions');
      if (!response.ok) throw new Error('Failed to load versions');
      const data = await response.json();
      setVersions(data.versions || []);
    } catch (err) {
      console.error('Failed to load versions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load versions');
    }
  }, []);

  const loadVotes = useCallback(async (versionIds: string[]) => {
    try {
      const votesData: Record<string, VoteRecord[]> = {};
      await Promise.all(
        versionIds.map(async (versionId) => {
          const [qualityRes, singabilityRes] = await Promise.all([
            fetch(`/api/votes?versionId=${versionId}&category=quality`),
            fetch(`/api/votes?versionId=${versionId}&category=singability`)
          ]);
          const qualityData = await qualityRes.json();
          const singabilityData = await singabilityRes.json();
          votesData[versionId] = [
            ...(qualityData.votes || []),
            ...(singabilityData.votes || [])
          ];
        })
      );
      setVotes(votesData);
    } catch (err) {
      console.error('Failed to load votes:', err);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([loadProgram(), loadVersions()]);
      setIsLoading(false);
    };
    load();
  }, [loadProgram, loadVersions]);

  useEffect(() => {
    if (program && versions.length > 0) {
      const allElementIds = [
        ...(program.elementIds || []),
        ...subPrograms.flatMap(sp => sp.elementIds || [])
      ];
      if (allElementIds.length > 0) {
        loadVotes(allElementIds);
      }
    }
  }, [program, subPrograms, versions, loadVotes]);

  const versionMap = useMemo(() => {
    const map: Record<string, VersionOption> = {};
    versions.forEach((version) => {
      map[version.id] = version;
    });
    return map;
  }, [versions]);

  const getQualityVotes = (versionId: string) => {
    return (votes[versionId] || []).filter(v => v.category === 'quality');
  };

  const getSingabilityScore = (versionId: string) => {
    const singabilityVotes = (votes[versionId] || []).filter(v => v.category === 'singability');
    if (singabilityVotes.length === 0) return null;
    const sum = singabilityVotes.reduce((acc, v) => acc + v.weight, 0);
    const avg = sum / singabilityVotes.length;
    return avg.toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-gray-400">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-gray-400">Program not found.</p>
        </div>
      </div>
    );
  }

  const renderSongRow = (versionId: string) => {
    const version = versionMap[versionId];
    if (!version) return null;

    const qualityVotes = getQualityVotes(versionId);
    const singabilityScore = getSingabilityScore(versionId);
    const isSpeech = version.tags?.includes('speech');

    return (
      <div
        key={versionId}
        className="grid items-center gap-4 text-sm px-2 py-1 border-b border-gray-500"
        style={{ gridTemplateColumns: '300px 1fr 120px' }}
      >
        <div className={`font-georgia text-base ${isSpeech ? 'italic' : ''}`}>
          {version.songTitle}
        </div>
        <div className="flex items-center gap-1">
          {qualityVotes.length === 0 ? (
            <span className="text-gray-400 text-[11px]">No votes</span>
          ) : (
            qualityVotes.map((vote) => {
              const size = Math.abs(vote.weight) === 3 ? 12 : 6;
              const color = vote.weight > 0 ? 'var(--primary)' : vote.weight === 0 ? '#fff' : '#9ca3af';
              return (
                <Tooltip key={vote.id} content={vote.name}>
                  <span
                    className="inline-block rounded-full"
                    style={{ width: `${size}px`, height: `${size}px`, backgroundColor: color }}
                  />
                </Tooltip>
              );
            })
          )}
        </div>
        <div className="text-base">
          {singabilityScore !== null ? singabilityScore : '-'}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-georgia mb-6">{program.title} - Results</h1>
        
        {program.elementIds && program.elementIds.length > 0 && (
          <div className="mb-8">
            <div className="grid items-center gap-4 text-sm px-2 py-1 border-b border-gray-700 text-gray-400 font-medium" style={{ gridTemplateColumns: '300px 1fr 120px' }}>
              <div>Song/Speech</div>
              <div>Quality Votes</div>
              <div>Singability</div>
            </div>
            {program.elementIds.map(renderSongRow)}
          </div>
        )}

        {subPrograms.map((subProgram) => (
          <div key={subProgram.id} className="mb-8">
            <h2 className="font-georgia text-xl text-center my-8">{subProgram.title}</h2>
            <div className="grid items-center gap-4 text-sm px-2 py-1 border-b border-gray-700 text-gray-400 font-medium" style={{ gridTemplateColumns: '300px 1fr 120px' }}>
              <div>Song/Speech</div>
              <div>Quality Votes</div>
              <div>Singability</div>
            </div>
            {subProgram.elementIds && subProgram.elementIds.map(renderSongRow)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeedbackResults;
