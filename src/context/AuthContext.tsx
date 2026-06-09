'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthChange } from '@/lib/auth';
import { saveUserProfile } from '@/lib/firestore';
import { db } from '@/lib/firebase';

export const USER_ROLES = ['teacher', 'parent', 'student', 'other'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole | null;
  schoolId?: string;
  studentLinkUid?: string;
  inviteCodeUsed?: string;
  roleVerifiedAt?: number;
  // 以下、既存スキーマ互換のため任意
  enrolledCourses?: string[];
  completedLessons?: Record<string, number[]>;
  activityDates?: string[];
  favorites?: string[];
  createdAt?: unknown;
  lastLoginAt?: unknown;
  lastAccessedAt?: unknown;
}

interface AuthContextType {
  user: User | null;
  userDoc: UserDoc | null;
  role: UserRole | null;
  loading: boolean;       // 認証状態の判定中
  userDocLoading: boolean; // users/{uid} 取得中
  needsOnboarding: boolean; // ログイン済みかつ role が未設定
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userDoc: null,
  role: null,
  loading: true,
  userDocLoading: true,
  needsOnboarding: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [userDocLoading, setUserDocLoading] = useState(true);

  // 認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthChange(async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        // 既存のプロフィール保存 (role: null を含むよう既に修正済み)
        await saveUserProfile(fbUser);
      } else {
        setUserDoc(null);
        setUserDocLoading(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // users/{uid} の購読 (onSnapshot で role 変更を即反映)
  useEffect(() => {
    if (!user) {
      setUserDoc(null);
      setUserDocLoading(false);
      return;
    }
    setUserDocLoading(true);
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        setUserDoc(snap.data() as UserDoc);
      } else {
        setUserDoc(null);
      }
      setUserDocLoading(false);
    });
    return () => unsub();
  }, [user]);

  const role = userDoc?.role ?? null;
  const ready = !loading && !userDocLoading;
  const needsOnboarding = ready && !!user && !!userDoc && role === null;

  return (
    <AuthContext.Provider
      value={{ user, userDoc, role, loading, userDocLoading, needsOnboarding }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
