import ProgramManager from '../ProgramManager';

type ProgramPageProps = {
  params: Promise<{
    programId: string;
  }>;
};

const ProgramPage = async ({ params }: ProgramPageProps) => {
  const { programId } = await params;
  return <ProgramManager initialProgramId={programId} />;
};

export default ProgramPage;

