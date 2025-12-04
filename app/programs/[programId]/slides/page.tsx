'use client';

import { useEffect, useState } from 'react';
import ProgramSlides from './ProgramSlides';

type ProgramSlidesPageProps = {
  params: Promise<{
    programId: string;
  }>;
};

const ProgramSlidesPage = ({ params }: ProgramSlidesPageProps) => {
  const [programId, setProgramId] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ programId }) => {
      setProgramId(programId);
    });
  }, [params]);

  if (!programId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return <ProgramSlides programId={programId} />;
};

export default ProgramSlidesPage;