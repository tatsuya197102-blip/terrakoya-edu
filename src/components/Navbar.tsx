'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const ADMIN_EMAIL = 'tatsuya197102@gmail.com';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [user, setUser] = useState<{ displayName: string; email: string; photoURL: string | null } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (u) {
        setUser({ displayName: u.displayName || '名無し', email: u.email || '', photoURL: u.photoURL });
        setIsAdmin(u.email === ADMIN_EMAIL);
        const q = query(collection(db, 'notifications'), where('uid', '==', u.uid), where('read', '==', false));
        const snap = await getDocs(q);
        setUnreadCount(snap.size);
      } else {
        setUser(null);
        setIsAdmin(false);
        setUnreadCount(0);
      }
    });
    return () => unsubscribe();
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
    setMenuOpen(false);
  };

  const isActive = (path: string) => pathname === path;

  if (pathname === '/' || pathname.startsWith('/auth')) return null;

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* ロゴ */}
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-white tracking-wide">TERRAKOYA</span>
        </Link>

        {/* 中央ナビ */}
        <div className="hidden md:flex items-center gap-0.5 overflow-hidden">

{[
          { href: '/dashboard',   label: t('nav.home'),      icon: '🏠' },
          { href: '/lessons',     label: t('nav.lessons'),   icon: '🎓' },
          { href: '/courses',     label: t('nav.courses'),   icon: '📚' },
          { href: '/live',        label: t('nav.live'),      icon: '📡' },
          { href: '/auto-4manga', label: t('nav.manga4'),    icon: '📖' },
          { href: '/auto-animate',label: t('nav.anime'),     icon: '🎬' },
          { href: '/contest',     label: t('nav.contest'),   icon: '🏆' },
          { href: '/gallery',     label: t('nav.gallery'),   icon: '🖼️' },
          { href: '/ai-consult',  label: t('nav.aiConsult'), icon: '🤖' },
          ].map(({ href, label, icon }) => (

            <Link key={href} href={href}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive(href) ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}>
              <span>{icon}</span><span>{label}</span>
            </Link>
          ))}
        </div>

        {/* 右側 */}
        <div className="flex items-center gap-2">
          {/* 言語切替 */}
          <LanguageSwitcher />
          {/* 通知ベル */}
          <Link href="/notifications" className="relative p-2 text-gray-400 hover:text-white transition-colors">
            🔔
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* プロフィールメニュー */}
          {user && (
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                {user.photoURL ? (
                  <img src={user.photoURL} className="w-6 h-6 rounded-full" alt="avatar" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
                    {user.displayName[0]}
                  </div>
                )}
                <span className="text-sm text-gray-300 hidden md:block">{user.displayName}</span>
                <span className="text-gray-500 text-xs">{menuOpen ? '▲' : '▼'}</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-10 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <p className="text-sm font-medium">{user.displayName}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <Link href="/profile" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors">
                      👤 {t('nav.profile')}
                    </Link>
                    <Link href="/notifications" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors">
                      🔔 {t('nav.notifications')}
                      {unreadCount > 0 && <span className="ml-auto bg-red-500 text-white text-xs px-1.5 rounded-full">{unreadCount}</span>}
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-yellow-400 hover:bg-gray-700 transition-colors">
                        🛠️ {t('nav.admin')}
                      </Link>
                    )}
                    <hr className="border-gray-700 my-1" />
                    <button onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors">
                      🚪 {t('nav.logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* モバイルナビ */}
      <div className="md:hidden border-t border-gray-800 overflow-x-auto" style={{scrollbarWidth:'none'}}>
        <div className="flex min-w-max">
          {[
            { href: '/dashboard',   label: t('nav.home'),      icon: '🏠' },
            { href: '/lessons',     label: t('nav.lessons'),   icon: '🎓' },
            { href: '/courses',     label: t('nav.courses'),   icon: '📚' },
            { href: '/live',        label: t('nav.live'),      icon: '📡' },
            { href: '/auto-4manga', label: t('nav.manga4'),    icon: '📖' },
            { href: '/auto-animate',label: t('nav.anime'),     icon: '🎬' },
            { href: '/contest',     label: t('nav.contest'),   icon: '🏆' },
            { href: '/gallery',     label: t('nav.gallery'),   icon: '🖼️' },
            { href: '/ai-consult',  label: t('nav.aiConsult'), icon: '🤖' },
          ].map(({ href, label, icon }) => (
            <Link key={href} href={href}
              className={`flex flex-col items-center px-4 py-2 text-xs transition-colors whitespace-nowrap ${
                isActive(href) ? 'text-blue-400' : 'text-gray-500'
              }`}>
              <span className="text-xl mb-0.5">{icon}</span>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}