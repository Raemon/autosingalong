import ProgramBrowser from '../../programBrowser/ProgramBrowser';

type ProgramVersionPageProps = {
  params: Promise<{
    programId: string;
    versionId: string;
  }>;
};

const ProgramVersionPage = async ({ params }: ProgramVersionPageProps) => {
  const { programId, versionId } = await params;
  return <ProgramBrowser initialProgramId={programId} initialVersionId={versionId} />;
};

export default ProgramVersionPage;

