import { Suspense } from 'react';
import { listPrograms } from '@/lib/programsRepository';
import ProgramsList from './ProgramsList';

const ProgramPage = async () => {
  const programs = await listPrograms();
  return <div className="px-4">
    <h2 className="text-5xl font-georgia mx-auto text-center my-12">Programs</h2>
    <Suspense fallback={<div className="p-8 text-gray-400 text-center">Loading programs...</div>}>
      <ProgramsList initialPrograms={programs} />
    </Suspense>
  </div>
};

export default ProgramPage;
