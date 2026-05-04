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

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) { router.push('/login'); return; }
      setEmail(user.email || '');
      setPhotoURL(user.photoURL || '');
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) setDisplayName(snap.data().displayName || user.displayName || '');
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
          <button onClick={handleSave} disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 py-3 rounded-lg font-medium transition-colors">
            {saved ? t('profile.saved') : saving ? t('common.loading') : t('profile.saveBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
