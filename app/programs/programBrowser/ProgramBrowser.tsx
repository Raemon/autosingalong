'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import VersionDetailPanel from '../../songs/VersionDetailPanel';
import { useUser } from '../../contexts/UserContext';
import useSongVersionPanel from '../../hooks/useSongVersionPanel';
import type { Program, VersionOption } from '../types';
import type { SongVersion } from '../../songs/types';
import { detectFileType } from '@/lib/lyricsExtractor';
import { generateChordmarkRenderedContent } from '../../chordmark-converter/clientRenderUtils';
import ProgramSelector from './components/ProgramSelector';
import ProgramStructurePanel from './ProgramStructurePanel';

type ProgramBrowserProps = {
  initialProgramId?: string;
  initialVersionId?: string;
};

const ProgramBrowser = ({ initialProgramId, initialVersionId }: ProgramBrowserProps) => {
  const { userName } = useUser();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [versions, setVersions] = useState<VersionOption[]>([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);
  const [isLoadingVersions, setIsLoadingVersions] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(initialProgramId ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const hasHydratedInitialVersion = useRef(false);

  const {
    selectedVersion,
    previousVersions,
    isExpandedPreviousVersions,
    isCreatingVersion,
    newVersionForm,
    selectVersionById,
    clearSelection,
    togglePreviousVersions,
    startEditingVersion,
    cancelEditing,
    updateForm,
  } = useSongVersionPanel();

  const loadPrograms = useCallback(async () => {
    setIsLoadingPrograms(true);
    try {
      const response = await fetch('/api/programs');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load programs');
      }
      const data = await response.json();
      setPrograms(data.programs || []);
      setDataError(null);
    } catch (err) {
      console.error('Failed to load programs:', err);
      setDataError(err instanceof Error ? err.message : 'Failed to load programs');
    } finally {
      setIsLoadingPrograms(false);
    }
  }, []);

  const loadVersionOptions = useCallback(async () => {
    setIsLoadingVersions(true);
    try {
      const response = await fetch('/api/song-versions');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load song versions');
      }
      const data = await response.json();
      setVersions(data.versions || []);
      setDataError(null);
    } catch (err) {
      console.error('Failed to load song versions:', err);
      setDataError(err instanceof Error ? err.message : 'Failed to load song versions');
    } finally {
      setIsLoadingVersions(false);
    }
  }, []);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  useEffect(() => {
    loadVersionOptions();
  }, [loadVersionOptions]);

  const loading = isLoadingPrograms || isLoadingVersions;

  const programMap = useMemo(() => {
    const map: Record<string, Program> = {};
    programs.forEach((program) => {
      map[program.id] = program;
    });
    return map;
  }, [programs]);

  const versionMap = useMemo(() => {
    const map: Record<string, VersionOption> = {};
    versions.forEach((version) => {
      map[version.id] = version;
    });
    return map;
  }, [versions]);

  const selectedProgram = selectedProgramId ? programMap[selectedProgramId] ?? null : null;

  useEffect(() => {
    if (!selectedProgramId && programs.length > 0) {
      setSelectedProgramId(programs[0].id);
    }
  }, [programs, selectedProgramId]);

  const handleProgramSelect = (programId: string | null) => {
    if (selectedProgramId === programId) {
      return;
    }
    setSelectedProgramId(programId);
    clearSelection();
    setPanelError(null);
    if (typeof window !== 'undefined') {
      if (programId) {
        window.history.pushState(null, '', `/programs/${programId}`);
      } else {
        window.history.pushState(null, '', '/programs');
      }
    }
  };

  const handleVersionClick = useCallback(
    async (versionId: string, options?: { skipUrlUpdate?: boolean }) => {
      if (!versionId) {
        return;
      }

      if (selectedVersion?.id === versionId) {
        clearSelection();
        setPanelError(null);
        if (!options?.skipUrlUpdate && typeof window !== 'undefined') {
          const basePath = selectedProgramId ? `/programs/${selectedProgramId}` : '/programs';
          window.history.pushState(null, '', basePath);
        }
        return;
      }

      setPanelError(null);
      await selectVersionById(versionId, {
        onError: (message) => setPanelError(message),
      });

      if (!options?.skipUrlUpdate && typeof window !== 'undefined') {
        const basePath = selectedProgramId ? `/programs/${selectedProgramId}` : '/programs';
        window.history.pushState(null, '', `${basePath}/${versionId}`);
      }
    },
    [clearSelection, selectVersionById, selectedProgramId, selectedVersion?.id],
  );

  const handleClosePanel = () => {
    clearSelection();
    setPanelError(null);
    if (typeof window !== 'undefined') {
      const basePath = selectedProgramId ? `/programs/${selectedProgramId}` : '/programs';
      window.history.pushState(null, '', basePath);
    }
  };

  const handleCreateVersionClick = () => {
    if (selectedVersion) {
      startEditingVersion(selectedVersion);
    }
  };

  const handleCancelCreateVersion = () => {
    cancelEditing();
    setPanelError(null);
  };

  const handleFormChange = (updates: Partial<typeof newVersionForm>) => {
    setPanelError(null);
    updateForm(updates);
  };

  const handleSubmitVersion = async () => {
    if (!selectedVersion) {
      return;
    }

    if (!newVersionForm.label.trim()) {
      setPanelError('Label is required');
      return;
    }

    if (!userName || userName.trim().length < 3) {
      setPanelError('Please set your username (at least 3 characters) before creating versions');
      return;
    }

    setIsSubmitting(true);
    setPanelError(null);

    try {
      const songId = selectedVersion.songId;
      if (!songId) {
        throw new Error('Could not determine song ID for this version');
      }

      const fileType = detectFileType(newVersionForm.label, newVersionForm.content);
      const renderedContent =
        fileType === 'chordmark' && newVersionForm.content
          ? generateChordmarkRenderedContent(newVersionForm.content)
          : undefined;

      const response = await fetch('/api/songs/versions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          songId,
          label: newVersionForm.label,
          content: newVersionForm.content || null,
          audioUrl: newVersionForm.audioUrl || null,
          bpm: newVersionForm.bpm || null,
          previousVersionId: selectedVersion.id,
          createdBy: userName,
          renderedContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create version');
      }

      const data = await response.json();
      cancelEditing();
      await loadVersionOptions();
      await selectVersionById(data.version.id as string);

      if (typeof window !== 'undefined') {
        const basePath = selectedProgramId ? `/programs/${selectedProgramId}` : '/programs';
        window.history.pushState(null, '', `${basePath}/${data.version.id}`);
      }
    } catch (err) {
      console.error('Error creating version:', err);
      setPanelError(err instanceof Error ? err.message : 'Failed to create version');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveVersion = async () => {
    if (!selectedVersion) {
      return;
    }

    if (typeof window !== 'undefined' && !window.confirm('Delete this version?')) {
      return;
    }

    setIsArchiving(true);
    setPanelError(null);

    try {
      const response = await fetch(`/api/songs/versions/${selectedVersion.id}/archive`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete version');
      }

      await loadVersionOptions();
      handleClosePanel();
    } catch (err) {
      console.error('Error deleting version:', err);
      setPanelError(err instanceof Error ? err.message : 'Failed to delete version');
    } finally {
      setIsArchiving(false);
    }
  };

  const containsVersion = useCallback(
    (program: Program | null, targetVersionId: string, visited: Set<string>): boolean => {
      if (!program || visited.has(program.id)) {
        return false;
      }
      if (program.elementIds.includes(targetVersionId)) {
        return true;
      }
      visited.add(program.id);
      const found = program.programIds.some((childId) =>
        containsVersion(programMap[childId] ?? null, targetVersionId, visited),
      );
      visited.delete(program.id);
      return found;
    },
    [programMap],
  );

  useEffect(() => {
    if (!initialVersionId || hasHydratedInitialVersion.current) {
      return;
    }
    if (!programs.length) {
      return;
    }

    hasHydratedInitialVersion.current = true;

    if (!selectedProgramId && initialProgramId && programMap[initialProgramId]) {
      setSelectedProgramId(initialProgramId);
    } else if (!selectedProgramId) {
      const programWithVersion = programs.find((program) =>
        containsVersion(program, initialVersionId, new Set()),
      );
      if (programWithVersion) {
        setSelectedProgramId(programWithVersion.id);
      }
    }

    handleVersionClick(initialVersionId, { skipUrlUpdate: true });
  }, [
    containsVersion,
    handleVersionClick,
    initialProgramId,
    initialVersionId,
    programMap,
    programs,
    selectedProgramId,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-gray-400">Loading programs...</p>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-red-600">Error: {dataError}</p>
        </div>
      </div>
    );
  }

  if (!programs.length) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-gray-400">No programs yet.</p>
        </div>
      </div>
    );
  }

  const activeSongTitle =
    (selectedVersion && versionMap[selectedVersion.id]?.songTitle) || selectedVersion?.label || '';

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto flex flex-col gap-4">
        <div className="flex gap-4 justify-center">
          <div>
            <ProgramSelector
              programs={programs}
              selectedProgramId={selectedProgramId}
              onSelect={handleProgramSelect}
            />
            <ProgramStructurePanel
              program={selectedProgram}
              programMap={programMap}
              versions={versions}
              versionMap={versionMap}
              selectedVersionId={selectedVersion?.id}
              onVersionClick={(versionId) => handleVersionClick(versionId)}
            />
          </div>
          {selectedVersion && (
            <div className="flex-3 flex-grow">
              <VersionDetailPanel
                songTitle={activeSongTitle.replace(/_/g, ' ')}
                version={selectedVersion}
                previousVersions={previousVersions}
                isExpandedPreviousVersions={isExpandedPreviousVersions}
                isCreatingVersion={isCreatingVersion}
                newVersionForm={newVersionForm}
                isSubmitting={isSubmitting}
                isArchiving={isArchiving}
                error={panelError}
                onClose={handleClosePanel}
                onTogglePreviousVersions={togglePreviousVersions}
                onVersionClick={(version: SongVersion) => handleVersionClick(version.id)}
                onCreateVersionClick={handleCreateVersionClick}
                onCancelCreateVersion={handleCancelCreateVersion}
                onFormChange={handleFormChange}
                onSubmitVersion={handleSubmitVersion}
                onArchiveVersion={handleArchiveVersion}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgramBrowser;

