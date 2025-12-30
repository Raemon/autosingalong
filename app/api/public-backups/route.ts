import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

export type PublicBackupInfo = {
  filename: string;
  size: number;
  lastModified: Date;
  downloadUrl: string;
};

const getPublicB2Client = (): S3Client => {
  const region = process.env.B2_REGION;
  const keyId = process.env.B2_PUBLIC_APPLICATION_KEY_ID;
  const applicationKey = process.env.B2_PUBLIC_APPLICATION_KEY;
  if (!region || !keyId || !applicationKey) {
    throw new Error('Public B2 credentials not configured. Set B2_REGION, B2_PUBLIC_APPLICATION_KEY_ID, and B2_PUBLIC_APPLICATION_KEY.');
  }
  return new S3Client({
    region,
    endpoint: `https://s3.${region}.backblazeb2.com`,
    credentials: { accessKeyId: keyId, secretAccessKey: applicationKey },
  });
};

export async function GET() {
  try {
    const client = getPublicB2Client();
    const bucketName = 'secularsolstice-public';
    const region = process.env.B2_REGION;
    
    const response = await client.send(new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'backups/',
    }));
    
    const backups: PublicBackupInfo[] = (response.Contents || [])
      .filter(obj => obj.Key && obj.Size !== undefined && obj.LastModified && obj.Key !== 'backups/')
      .map(obj => {
        const filename = obj.Key!.replace('backups/', '');
        return {
          filename,
          size: obj.Size!,
          lastModified: obj.LastModified!,
          downloadUrl: `https://f${region?.split('-').pop() || '005'}.backblazeb2.com/file/${bucketName}/backups/${filename}`,
        };
      })
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
    
    return NextResponse.json({ backups });
  } catch (error) {
    console.error('Failed to list public backups:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
