import { getVersionById } from '../../../../lib/songsRepository';
import VersionContent from '../../VersionContent';
import { notFound } from 'next/navigation';


const PrintPage = async ({ params }: { params: Promise<{ versionId: string }> }) => {
  const { versionId } = await params;
  const version = await getVersionById(versionId);

  if (!version) {
    notFound();
  }

  return (
    <div className="p-8 w-full max-w-4xl mx-auto bg-red-500">
      <VersionContent version={version} print />
    </div>
  );
};

export default PrintPage;

