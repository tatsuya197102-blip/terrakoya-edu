// ゲーミフィケーション定数・ユーティリティ

export const XP_REWARDS = {
  login:          5,
  submission:     20,
  contestEntry:   30,
  vote:           5,
  streak3:        15,
  streak7:        50,
  streak30:       200,
} as const;

export const LEVELS = [
  { lv: 1,  minXP: 0,    ja: '✏️ 見習いクリエイター', en: '✏️ Beginner Creator',     ar: '✏️ مبدع مبتدئ' },
  { lv: 2,  minXP: 100,  ja: '🎨 お絵かきキッズ',       en: '🎨 Art Kid',              ar: '🎨 فنان صغير' },
  { lv: 3,  minXP: 300,  ja: '📖 ストーリーキッズ',     en: '📖 Story Kid',            ar: '📖 راوي القصص' },
  { lv: 4,  minXP: 600,  ja: '⭐ マンガスター',          en: '⭐ Manga Star',           ar: '⭐ نجم المانغا' },
  { lv: 5,  minXP: 1000, ja: '🎬 アニメアーティスト',   en: '🎬 Anime Artist',         ar: '🎬 فنان الأنيمي' },
  { lv: 6,  minXP: 1500, ja: '🏆 キャラクターマスター', en: '🏆 Character Master',     ar: '🏆 ماستر الشخصيات' },
  { lv: 7,  minXP: 2200, ja: '🌟 クリエイタープロ',     en: '🌟 Creator Pro',          ar: '🌟 مبدع محترف' },
  { lv: 8,  minXP: 3000, ja: '🎭 アニメ監督',           en: '🎭 Anime Director',       ar: '🎭 مخرج الأنيمي' },
  { lv: 9,  minXP: 4000, ja: '👑 レジェンド',           en: '👑 Legend',               ar: '👑 أسطورة' },
  { lv: 10, minXP: 5500, ja: '🔥 TERRAKOYAマスター',   en: '🔥 TERRAKOYA Master',     ar: '🔥 ماستر تيراكويا' },
] as const;

export const BADGES = [
  { id: 'first_login',     ja: '🌅 はじめの一歩',     en: '🌅 First Step',        ar: '🌅 الخطوة الأولى',    desc_ja: '初めてログイン',         xp: 0 },
  { id: 'first_post',      ja: '🎨 初投稿！',          en: '🎨 First Post!',       ar: '🎨 أول مشاركة!',      desc_ja: '初めて作品を投稿',       xp: 20 },
  { id: 'streak3',         ja: '🔥 3日連続',           en: '🔥 3-Day Streak',      ar: '🔥 3 أيام متتالية',   desc_ja: '3日連続ログイン',        xp: 15 },
  { id: 'streak7',         ja: '⚡ 1週間連続',         en: '⚡ 7-Day Streak',      ar: '⚡ أسبوع متتالي',     desc_ja: '7日連続ログイン',        xp: 50 },
  { id: 'streak30',        ja: '👑 30日連続',          en: '👑 30-Day Streak',     ar: '👑 شهر متتالي',       desc_ja: '30日連続ログイン',       xp: 200 },
  { id: 'contest_entry',   ja: '🏆 コンテスト参加',   en: '🏆 Contest Entry',     ar: '🏆 مشارك المسابقة',   desc_ja: 'コンテストに応募',       xp: 30 },
  { id: 'contest_winner',  ja: '🥇 コンテスト1位',    en: '🥇 Contest Winner',    ar: '🥇 فائز بالمسابقة',   desc_ja: 'コンテストで1位獲得',    xp: 100 },
  { id: 'posts5',          ja: '📚 投稿5回',           en: '📚 5 Posts',           ar: '📚 5 مشاركات',        desc_ja: '5回作品を投稿',          xp: 50 },
  { id: 'posts10',         ja: '🌟 投稿10回',          en: '🌟 10 Posts',          ar: '🌟 10 مشاركات',       desc_ja: '10回作品を投稿',         xp: 100 },
  { id: 'voter',           ja: '👍 応援団',            en: '👍 Supporter',         ar: '👍 داعم',             desc_ja: '10回投票する',           xp: 20 },
  { id: 'level5',          ja: '🎬 アニメアーティスト', en: '🎬 Anime Artist',     ar: '🎬 فنان الأنيمي',     desc_ja: 'レベル5に到達',          xp: 0 },
  { id: 'level10',         ja: '🔥 マスター達成',      en: '🔥 Master Achieved',   ar: '🔥 تحقيق الماستر',    desc_ja: 'レベル10に到達',         xp: 0 },
] as const;

export type BadgeId = typeof BADGES[number]['id'];

export function getLevelInfo(xp: number, lang: string = 'ja') {
  let currentIdx = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) { currentIdx = i; break; }
  }
  const nextIdx = Math.min(currentIdx + 1, LEVELS.length - 1);
  const current = LEVELS[currentIdx];
  const next = LEVELS[nextIdx];
  const isMax = currentIdx === LEVELS.length - 1;
  const progressXP = xp - current.minXP;
  const neededXP = isMax ? 0 : next.minXP - current.minXP;
  const progressPct = isMax ? 100 : Math.min(100, Math.round((progressXP / neededXP) * 100));
  const title = lang === 'ar' ? current.ar : lang === 'en' ? current.en : current.ja;
  const nextTitle = lang === 'ar' ? next.ar : lang === 'en' ? next.en : next.ja;
  return { lv: current.lv, title, nextTitle, progressXP, neededXP, progressPct, isMax, totalXP: xp };
}

export function getBadgeLabel(badge: typeof BADGES[number], lang: string) {
  return lang === 'ar' ? badge.ar : lang === 'en' ? badge.en : badge.ja;
}
