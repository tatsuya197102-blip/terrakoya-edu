import type { Metadata } from 'next';
import './globals.css';
import ClientLayout from './client-layout';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'TERRAKOYA 寺子屋',
  description: '漫画・アニメクリエイターのためのオンライン学習プラットフォーム',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientLayout>
          <Navbar />
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}