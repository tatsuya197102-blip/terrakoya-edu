'use client';
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SubmissionsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/courses');
  }, []);
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
      <p className="text-gray-400">コースページへ移動中...</p>
    </div>
  );
}
