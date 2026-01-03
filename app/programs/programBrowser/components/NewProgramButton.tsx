'use client';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/contexts/UserContext';
import type { Program } from '../../types';
import Tooltip from '@/app/components/Tooltip';

export const handleCreateProgram = async (createdBy: string, onProgramCreated?: (program: Program) => void, onSelect?: (id: string) => void) => {
  const title = typeof window !== 'undefined' ? window.prompt('Program title') : null;
  const trimmedTitle = (title ?? '').trim();
  if (!trimmedTitle) {
    return;
  }
  try {
    const response = await fetch('/api/programs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: trimmedTitle, createdBy }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create program');
    }
    if (data.program?.id) {
      onProgramCreated?.(data.program);
      onSelect?.(data.program.id);
    }
    return data.program;
  } catch (err) {
    console.error('Failed to create program:', err);
    if (typeof window !== 'undefined') {
      window.alert(err instanceof Error ? err.message : 'Failed to create program');
    }
  }
};

const NewProgramButton = ({onProgramCreated, className}: {onProgramCreated?: (program: Program) => void, className?: string}) => {
  const { userName, canEdit } = useUser();
  const router = useRouter();
  const canCreate = userName && canEdit;

  const button = (
    <button
      className={`text-sm text-nowrap border border-gray-500 rounded-sm px-2 py-1 text-gray-400 ${!canCreate ? '' : 'opacity-50'}`}
      onClick={async () => {
        if (!canCreate) return;
        const program = await handleCreateProgram(userName, onProgramCreated);
        if (program?.id) {
          router.push(`/programs/${program.id}`);
        }
      }}
    >+ Program</button>
  );

  if (canCreate) {
    return button;
  }

  return (
    <Tooltip content="You must be logged in to create a program">
      {button}
    </Tooltip>
  );
};

export default NewProgramButton;