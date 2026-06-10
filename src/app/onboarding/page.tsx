'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type UserRole } from '@/context/AuthContext';
import { setSelfSelectedRole, claimInviteCode } from '@/lib/firestore-roles';

// === 一時的に「生徒」のみ表示する設定 (個人情報配慮のため) ===
// 復活させる時は SHOW_ALL_ROLES を true にするだけ
const SHOW_ALL_ROLES = false;

const ROLE_HOME_PATH: Record<UserRole, string> = {
  teacher: '/teacher/dashboard',
  parent: '/parent',
  student: '/dashboard',
  other: '/dashboard',
};

const LABELS: Record<UserRole, { ja: string; en: string; ar: string; desc: string }> = {
  teacher: { ja: '先生', en: 'Teacher', ar: 'المعلم', desc: '招待コードが必要' },
  parent: { ja: '保護者', en: 'Parent', ar: 'ولي الأمر', desc: '招待コードが必要' },
  student: { ja: '生徒', en: 'Student', ar: 'الطالب', desc: '誰でも登録可' },
  other: { ja: 'その他', en: 'Other', ar: 'آخر', desc: '見学のみ' },
};

export default function OnboardingPage() {
  const router = useRouter();
  const { user, role, loading, userDocLoading } = useAuth();
  const [step, setStep] = useState<'select' | 'code'>('select');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !userDocLoading && role) {
      router.replace(ROLE_HOME_PATH[role]);
    }
  }, [loading, userDocLoading, role, router]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading || userDocLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  async function handlePickRole(r: UserRole) {
    setError(null);
    setSelectedRole(r);
    if (r === 'teacher' || r === 'parent') {
      setStep('code');
      return;
    }
    setSubmitting(true);
    try {
      await setSelfSelectedRole(user!.uid, r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
      setSubmitting(false);
    }
  }

  async function handleSubmitCode() {
    if (!selectedRole || !code.trim()) return;
    setSubmitting(true);
    setError(null);
    const result = await claimInviteCode({ uid: user!.uid, code });
    if (result.ok) {
      if (result.role !== selectedRole) {
        setError(`このコードは「${LABELS[result.role].ja}」用です`);
        setSubmitting(false);
        return;
      }
    } else {
      setError(result.reason);
      setSubmitting(false);
    }
  }

  // 表示するロール一覧 (フラグで切替)
  const visibleRoles: UserRole[] = SHOW_ALL_ROLES
    ? (Object.keys(LABELS) as UserRole[])
    : ['student'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8">
        {step === 'select' && (
          <>
            <h1 className="text-2xl font-bold mb-2 text-gray-900">
              ようこそ / Welcome / <span dir="rtl">مرحباً</span>
            </h1>
            <p className="text-gray-600 mb-6 text-sm">
              TERRAKOYA はマンガ・アニメを学ぶオンライン学校です<br />
              An online school for manga &amp; anime creators<br />
              <span dir="rtl">منصة تعلم المانجا والأنمي عبر الإنترنت</span>
            </p>
            <div className={visibleRoles.length === 1 ? '' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
              {visibleRoles.map((r) => (
                <button
                  key={r}
                  type="button"
                  disabled={submitting}
                  onClick={() => handlePickRole(r)}
                  className={
                    visibleRoles.length === 1
                      ? 'w-full bg-emerald-600 text-white rounded-xl py-4 font-bold text-lg hover:bg-emerald-700 transition disabled:opacity-50'
                      : 'text-left border-2 border-gray-200 rounded-xl p-5 hover:border-emerald-500 hover:bg-emerald-50 transition disabled:opacity-50'
                  }
                >
                  {visibleRoles.length === 1 ? (
                    <span>
                      {submitting ? '登録中…' : `${LABELS[r].ja}として始める / Start as ${LABELS[r].en}`}
                    </span>
                  ) : (
                    <>
                      <div className="font-bold text-lg text-gray-900">{LABELS[r].ja}</div>
                      <div className="text-sm text-gray-500">
                        {LABELS[r].en} / <span dir="rtl">{LABELS[r].ar}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-2">{LABELS[r].desc}</div>
                    </>
                  )}
                </button>
              ))}
            </div>
            {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
          </>
        )}

        {step === 'code' && selectedRole && (
          <>
            <button
              type="button"
              onClick={() => { setStep('select'); setCode(''); setError(null); }}
              className="text-sm text-gray-500 mb-4 hover:underline"
            >
              ← 戻る
            </button>
            <h1 className="text-2xl font-bold mb-2 text-gray-900">
              {LABELS[selectedRole].ja}用の招待コード
            </h1>
            <p className="text-gray-600 mb-6 text-sm">
              担当者から配布されたコードを入力してください
            </p>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="TEAC-GEN-XXXXXX"
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 font-mono uppercase text-gray-900 focus:border-emerald-500 outline-none"
              disabled={submitting}
              autoFocus
            />
            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
            <button
              type="button"
              onClick={handleSubmitCode}
              disabled={submitting || !code.trim()}
              className="w-full mt-4 bg-emerald-600 text-white rounded-lg py-3 font-bold hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? '確認中…' : 'コードを確認'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
