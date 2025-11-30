import { getVersionById } from '../../../../lib/songsRepository';
import VersionContent from '../../VersionContent';
import { notFound } from 'next/navigation';

type PrintPageProps = {
  params: Promise<{
    versionId: string;
  }>;
};

const PrintPage = async ({ params }: PrintPageProps) => {
  const { versionId } = await params;
  const version = await getVersionById(versionId);

  if (!version) {
    notFound();
  }

  return (
    <div className="p-8">
      <VersionContent version={version} />
    </div>
  );
};

export default PrintPage;

