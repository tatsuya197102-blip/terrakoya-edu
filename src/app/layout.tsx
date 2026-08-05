// MARKER: TERRAKOYA_EDU_LAYOUT_V2
// メタ情報の修正(2026-08-05): description が PRO 向けの
// 'Online Learning Platform for Manga & Anime Creators' のままだったため、
// EDU(学校向け・子供向け・無料)の実態に合わせて差し替えた。
// 教育省・学校関係者が検索したときの見え方に直結する部分。
import type { Metadata } from 'next';
import './globals.css';
import ClientWrapper from './client-wrapper';

export const metadata: Metadata = {
  title: 'TERRAKOYA — まなぶ・うたう・えをかく',
  description:
    'TERRAKOYA is a free online classroom where children learn manga and anime creation. Lessons, drawing, singing and 4-panel manga — available in Japanese, English and Arabic. No ads, no fees.',
  applicationName: 'TERRAKOYA',
  keywords: [
    'TERRAKOYA',
    'manga for kids',
    'anime lessons',
    'free education',
    'أطفال',
    'مانغا',
    'こども',
    'まんが',
  ],
  openGraph: {
    title: 'TERRAKOYA — まなぶ・うたう・えをかく',
    description:
      'A free online classroom where children learn manga and anime creation. Japanese, English and Arabic. No ads, no fees.',
    siteName: 'TERRAKOYA',
    type: 'website',
  },
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
