'use client';

import Link from 'next/link';

const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-950 text-gray-200 p-8 text-center">
      <h1 className="text-4xl font-semibold">Page not found</h1>
      <p className="max-w-md text-gray-400">
        The page you are looking for doesn&apos;t exist or may have been moved. Check the URL and try again.
      </p>
      <Link
        href="/"
        className="rounded-full border border-gray-600 px-6 py-2 text-sm uppercase tracking-wide text-gray-100 transition hover:border-white hover:text-white"
      >
        Back to home
      </Link>
    </div>
  );
};

export default NotFoundPage;

