'use client';

import { useState } from 'react';
import useCombinedChangelogProgressiveLoad from '@/app/hooks/useCombinedChangelogProgressiveLoad';
import SongChangelogItem from './SongChangelogItem';
import ProgramChangelogItem from './ProgramChangelogItem';

const ChangelogPage = () => {
  const [hideImport, setHideImport] = useState(true);
  const { items, loading, loadingMore, error, hasMore, loadMore } = useCombinedChangelogProgressiveLoad(
    hideImport ? 'secularsolstice-import' : undefined
  );

  if (loading) return <div className="p-4 text-gray-400">Loading changelog...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-5xl text-center my-12 font-georgia text-gray-200">Changelog</h1>
      <label className="flex justify-center items-center gap-2 text-sm text-gray-400 mb-4 cursor-pointer">
        <input type="checkbox" checked={hideImport} onChange={(e) => setHideImport(e.target.checked)} className="accent-gray-500" />
        Hide secularsolstice-import
      </label>
      <div className="space-y-1 max-w-full">
        {items.map((item) => {
          if (item.type === 'song') {
            return <SongChangelogItem key={`s-${item.data.id}`} version={item.data} showType />;
          } else {
            return <ProgramChangelogItem key={`p-${item.data.id}`} version={item.data} showType />;
          }
        })}
        {loadingMore && <span className="text-xs text-gray-500">loading...</span>}
        {hasMore && !loadingMore && (
          <button onClick={loadMore} className="text-xs text-gray-500 hover:text-gray-300 mt-2">load more...</button>
        )}
      </div>
    </div>
  );
};

export default ChangelogPage;
