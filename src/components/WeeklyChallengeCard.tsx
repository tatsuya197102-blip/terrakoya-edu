'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getCurrentChallenge, getWeekDeadline } from '@/lib/weeklyChallenge';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function WeeklyChallengeCard() {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'ja' | 'en' | 'ar';
  const router = useRouter();
  const challenge = getCurrentChallenge();
  const [timeLeft, setTimeLeft] = useState('');
  const [joined, setJoined] = useState(false);

  // 残り時間カウントダウン
  useEffect(() => {
    const update = () => {
      const deadline = getWeekDeadline();
      const diff = deadline.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('--'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(
        lang === 'ar' ? `${d}د ${h}س ${m}د` :
        lang === 'en' ? `${d}d ${h}h ${m}m` :
        `残り${d}日${h}時間${m}分`
      );
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, [lang]);

  // 参加済みかチェック
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) return;
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      const challenges = snap.data()?.completedChallenges || [];
      setJoined(challenges.includes(challenge.id));
    });
    return () => unsub();
  }, [challenge.id]);

  const handleJoin = () => {
    // 課題提出ページに遷移（4コマメーカーへ）
    router.push('/auto-4manga');
  };

  const LABELS = {
    title:    { ja: '今週のチャレンジ', en: "This Week's Challenge", ar: 'تحدي الأسبوع' },
    deadline: { ja: '締め切り', en: 'Deadline', ar: 'الموعد النهائي' },
    reward:   { ja: 'ボーナスXP', en: 'Bonus XP', ar: 'XP إضافي' },
    hint:     { ja: 'ヒント', en: 'Hint', ar: 'تلميح' },
    join:     { ja: '参加する →', en: 'Join Now →', ar: 'انضم الآن →' },
    joined:   { ja: '✅ 参加済み！', en: '✅ Joined!', ar: '✅ انضممت!' },
  };
  const L = (key: keyof typeof LABELS) => LABELS[key][lang];

  return (
    <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/30 border border-yellow-600/40 rounded-2xl p-5 mb-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{challenge.icon}</span>
          <div>
            <p className="text-yellow-400 text-xs font-bold uppercase tracking-wide">{L('title')}</p>
            <h3 className="font-bold text-white text-lg leading-tight">
              {challenge.theme[lang]}
            </h3>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">{L('deadline')}</p>
          <p className="text-yellow-300 text-sm font-mono font-bold">{timeLeft}</p>
        </div>
      </div>

      {/* 説明 */}
      <p className="text-gray-300 text-sm mb-3 leading-relaxed">
        {challenge.description[lang]}
      </p>

      {/* ヒント */}
      <div className="bg-black/20 rounded-lg px-3 py-2 mb-4 flex items-start gap-2">
        <span className="text-yellow-400 text-xs font-bold mt-0.5">💡 {L('hint')}</span>
        <p className="text-gray-400 text-xs leading-relaxed">{challenge.hint[lang]}</p>
      </div>

      {/* フッター */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-yellow-400 text-sm font-bold">⚡ +{challenge.xpReward}</span>
          <span className="text-gray-400 text-xs">{L('reward')}</span>
        </div>
        <button
          onClick={handleJoin}
          disabled={joined}
          className={`px-5 py-2 rounded-xl text-sm font-bold transition ${
            joined
              ? 'bg-green-800 text-green-300 cursor-default'
              : 'bg-yellow-500 hover:bg-yellow-400 text-black'
          }`}>
          {joined ? L('joined') : L('join')}
        </button>
      </div>
    </div>
  );
}
