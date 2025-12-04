import VersionDiffPage from './VersionDiffPage';

type VersionDiffPageProps = {
  params: Promise<{
    oldVersionId: string;
    newVersionId: string;
  }>;
};

const Page = async ({ params }: VersionDiffPageProps) => {
  const { oldVersionId, newVersionId } = await params;
  return <VersionDiffPage oldVersionId={oldVersionId} newVersionId={newVersionId} />;
};

export default Page;
