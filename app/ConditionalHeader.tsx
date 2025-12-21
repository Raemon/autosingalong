'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Header from './Header';

const ConditionalHeader = () => {
  const pathname = usePathname();
  console.log(pathname);
  const isScriptPage = pathname?.match(/\/programs\/[^/]+\/script/);

  useEffect(() => {
    if (isScriptPage) {
      document.body.classList.add('bg-white', 'text-black');
      document.body.classList.remove('bg-[#11101b]', 'text-gray-100');
    } else {
      document.body.classList.remove('bg-white', 'text-black');
      document.body.classList.add('bg-[#11101b]', 'text-gray-100');
    }
  }, [isScriptPage]);

  // const hideHeader = pathname.includes('/feedback') || pathname?.includes('/results');
  // if (hideHeader) return null;
  return <Header />;
};

export default ConditionalHeader;
