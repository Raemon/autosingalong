import { Suspense } from 'react';
import AdminFeedbackPage from './AdminFeedbackPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400">Loading...</div>}>
      <AdminFeedbackPage />
    </Suspense>
  );
}


