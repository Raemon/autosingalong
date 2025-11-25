import SongsFileList from '../SongsFileList';

type SongVersionPageProps = {
  params: {
    versionId: string;
  };
};

const SongVersionPage = ({ params }: SongVersionPageProps) => {
  return <SongsFileList initialVersionId={params.versionId} />;
};

export default SongVersionPage;


