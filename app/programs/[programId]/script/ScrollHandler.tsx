'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export const ScrollHandler = () => {
  const searchParams = useSearchParams();

  useEffect(() => {
    const scrollTo = searchParams.get('scrollTo');
    const type = searchParams.get('type');
    
    if (scrollTo && type) {
      // Use a small timeout to ensure the DOM is fully rendered
      setTimeout(() => {
        const element = document.getElementById(`${type}-${scrollTo}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [searchParams]);

  return null;
};

