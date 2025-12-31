'use client';
import { useState, useEffect } from 'react';

const LocalDbIndicator = () => {
  const [dbId, setDbId] = useState<string | null>(null);
  const [isLocal, setIsLocal] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      setIsLocal(true);
      fetch('/api/db-id')
        .then(res => res.json())
        .then(data => setDbId(data.dbId))
        .catch(() => setDbId('error'));
    }
  }, []);

  if (!isLocal || !dbId) return null;

  return (
    <div style={{ position: 'fixed', bottom: 8, left: 8, fontSize: 11, color: '#666', zIndex: 9999, fontFamily: 'monospace' }}>
      db: {dbId}
    </div>
  );
};

export default LocalDbIndicator;
