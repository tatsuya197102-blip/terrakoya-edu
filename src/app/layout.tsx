import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TERRAKOYA',
  description: 'Online Learning Platform for Manga & Anime Creators',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}

import ClientWrapper from './client-wrapper';