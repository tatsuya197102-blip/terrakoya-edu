'use client';

import { useEffect, useState } from 'react';
import ClientLayout from './client-layout';
import Navbar from '@/components/Navbar';
import { ToastProvider } from '@/components/ToastProvider';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <ClientLayout>
      <ToastProvider>
        <Navbar />
        {children}
      </ToastProvider>
    </ClientLayout>
  );
}