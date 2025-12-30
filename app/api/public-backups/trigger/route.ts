import { NextResponse } from 'next/server';

export async function POST() {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return NextResponse.json({ error: 'GITHUB_TOKEN not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(
      'https://api.github.com/repos/Raemon/autosingalong/actions/workflows/public-backup.yml/dispatches',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref: 'main' }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API error:', response.status, errorText);
      return NextResponse.json({ error: `GitHub API error: ${response.status}` }, { status: response.status });
    }

    return NextResponse.json({ success: true, message: 'Public backup workflow triggered' });
  } catch (error) {
    console.error('Failed to trigger public backup:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
