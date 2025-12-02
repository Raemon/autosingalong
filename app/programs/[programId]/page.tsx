import ProgramBrowser from '../programBrowser/ProgramBrowser';

type ProgramPageProps = {
  params: Promise<{
    programId: string;
  }>;
};

const ProgramPage = async ({ params }: ProgramPageProps) => {
  const { programId } = await params;
  return <ProgramBrowser initialProgramId={programId} />;
};

export default ProgramPage;

