'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// 認証チェック不要のパブリックパス
const PUBLIC_PATHS = ['/', '/login', '/register', '/onboarding'];
const PUBLIC_PREFIXES = ['/api/'];

function isPublicPath(pathname: string | null): boolean {
  if (!pathname) return true;
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

/**
 * AuthGate:
 *  - role 未設定のユーザーを /onboarding に自動遷移
 *  - 既存の login 強制 (各ページが自前で行っている) には干渉しない
 *  - パブリックページ (/, /login, /register, /onboarding) は素通り
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, userDocLoading, user, needsOnboarding } = useAuth();

  useEffect(() => {
    if (loading || userDocLoading) return;
    if (isPublicPath(pathname)) return;
    if (!user) return; // 未ログインは各ページに任せる
    if (needsOnboarding) {
      router.replace('/onboarding');
    }
  }, [loading, userDocLoading, user, needsOnboarding, pathname, router]);

  return <>{children}</>;
}
