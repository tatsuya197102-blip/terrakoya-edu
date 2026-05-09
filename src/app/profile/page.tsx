'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { useTranslation } from 'react-i18next';

export default function ProfilePage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [parentEmail, setParentEmail] = useState('');
  const [notifySubmission, setNotifySubmission] = useState(true);
  const [notifyLevelup, setNotifyLevelup] = useState(true);
  const [notifyStreak, setNotifyStreak] = useState(true);
  const [notifyWeekly, setNotifyWeekly] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) { router.push('/login'); return; }
      setEmail(user.email || '');
      setPhotoURL(user.photoURL || '');
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const d = snap.data();
        setDisplayName(d.displayName || user.displayName || '');
        setParentEmail(d.parentEmail || '');
        setNotifySubmission(d.notifySubmission !== false);
        setNotifyLevelup(d.notifyLevelup !== false);
        setNotifyStreak(d.notifyStreak !== false);
        setNotifyWeekly(d.notifyWeekly !== false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setSaving(true);
    await updateProfile(user, { displayName });
    await updateDoc(doc(db, 'users', user.uid), { displayName });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">{t('common.loading')}</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-gray-900 border-b border-gray-800 px-8 py-5">
        <h1 className="text-2xl font-bold">👤 {t('profile.title')}</h1>
      </div>
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="bg-gray-800 rounded-xl p-6 space-y-5">
          <div className="text-center mb-4">
            {photoURL ? (
              <img src={photoURL} alt="avatar" className="w-20 h-20 rounded-full mx-auto mb-3" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-bold mx-auto mb-3">
                {displayName?.[0] || '?'}
              </div>
            )}
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">{t('profile.displayName')}</label>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">{t('profile.email')}</label>
            <input value={email} disabled
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-400 cursor-not-allowed" />
          </div>

          {/* 保護者設定 */}
          <div className="border-t border-gray-700 pt-5">
            <h3 className="font-bold text-sm text-gray-300 mb-4 flex items-center gap-2">
              👨‍👩‍👧 {lang === 'ar' ? 'إعدادات ولي الأمر' : lang === 'en' ? 'Parent / Guardian Settings' : '保護者・先生の設定'}
            </h3>
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-1">
                {lang === 'ar' ? 'بريد ولي الأمر (اختياري)' : lang === 'en' ? 'Parent Email (optional)' : '保護者・先生のメールアドレス（任意）'}
              </label>
              <input
                value={parentEmail}
                onChange={e => setParentEmail(e.target.value)}
                type="email"
                placeholder={lang === 'ar' ? 'parent@example.com' : lang === 'en' ? 'parent@example.com' : 'parent@example.com'}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {lang === 'ar' ? 'سيتم إرسال إشعارات تقدم الطالب إلى هذا البريد' : lang === 'en' ? 'Progress notifications will be sent to this email' : '学習の進捗通知がこのメールに届きます'}
              </p>
            </div>

            {/* 通知設定 */}
            {parentEmail && (
              <div className="space-y-3">
                <p className="text-xs text-gray-400 font-medium">
                  {lang === 'ar' ? 'أنواع الإشعارات' : lang === 'en' ? 'Notification types' : '通知の種類'}
                </p>
                {[
                  { key: 'submission', state: notifySubmission, setState: setNotifySubmission,
                    label: { ja: '🎨 作品を投稿したとき', en: '🎨 When artwork is submitted', ar: '🎨 عند إرسال عمل' } },
                  { key: 'levelup', state: notifyLevelup, setState: setNotifyLevelup,
                    label: { ja: '🎉 レベルアップしたとき', en: '🎉 When leveling up', ar: '🎉 عند الارتقاء بمستوى' } },
                  { key: 'streak', state: notifyStreak, setState: setNotifyStreak,
                    label: { ja: '🔥 連続ログイン達成', en: '🔥 Streak achievement', ar: '🔥 إنجاز التسلسل' } },
                  { key: 'weekly', state: notifyWeekly, setState: setNotifyWeekly,
                    label: { ja: '📊 週間レポート（毎週日曜）', en: '📊 Weekly report (every Sunday)', ar: '📊 تقرير أسبوعي (كل أحد)' } },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                    <span className="text-sm text-gray-300">{item.label[lang as 'ja'|'en'|'ar']}</span>
                    <button onClick={() => item.setState((v: boolean) => !v)}
                      className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${item.state ? 'bg-blue-500' : 'bg-gray-600'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${item.state ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 py-3 rounded-lg font-medium transition-colors">
            {saved ? t('profile.saved') : saving ? t('common.loading') : t('profile.saveBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
