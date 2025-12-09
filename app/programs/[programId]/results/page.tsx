import FeedbackResults from './FeedbackResults';

type ResultsPageProps = {
  params: Promise<{
    programId: string;
  }>;
};

const ResultsPage = async ({ params }: ResultsPageProps) => {
  const { programId } = await params;
  return <FeedbackResults programId={programId} />;
};

export default ResultsPage;
