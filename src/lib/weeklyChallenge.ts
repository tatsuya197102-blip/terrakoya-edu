// 週次チャレンジ定義
// 毎週月曜自動切替（週番号ベース）

export interface WeeklyChallenge {
  id: string;
  week: number;
  theme: { ja: string; en: string; ar: string };
  description: { ja: string; en: string; ar: string };
  hint: { ja: string; en: string; ar: string };
  icon: string;
  xpReward: number;
}

export const WEEKLY_CHALLENGES: WeeklyChallenge[] = [
  {
    id: 'wc-01', week: 1, icon: '😊',
    theme: { ja: '笑顔のキャラクター', en: 'Smiling Character', ar: 'شخصية مبتسمة' },
    description: { ja: '笑顔が素敵なオリジナルキャラクターを描こう！', en: 'Draw an original character with a beautiful smile!', ar: 'ارسم شخصية أصلية بابتسامة جميلة!' },
    hint: { ja: '目を細めて、口角を上げると笑顔に見えるよ', en: 'Narrow the eyes and raise the corners of the mouth', ar: 'ضيّق العيون وارفع زوايا الفم للحصول على ابتسامة' },
    xpReward: 40,
  },
  {
    id: 'wc-02', week: 2, icon: '🏛️',
    theme: { ja: 'ピラミッドの冒険', en: 'Pyramid Adventure', ar: 'مغامرة الأهرامات' },
    description: { ja: 'ピラミッドを探検するキャラクターを描こう！', en: 'Draw a character exploring the Pyramids!', ar: 'ارسم شخصية تستكشف الأهرامات!' },
    hint: { ja: 'ピラミッドは三角形！背景に砂漠も描いてみよう', en: 'Pyramids are triangles! Try drawing a desert background too', ar: 'الأهرامات مثلثات! جرب رسم خلفية صحراوية أيضاً' },
    xpReward: 40,
  },
  {
    id: 'wc-03', week: 3, icon: '🌙',
    theme: { ja: 'ラマダンの夜', en: 'Ramadan Night', ar: 'ليلة رمضان' },
    description: { ja: 'ラマダンの温かい夜の風景を描こう！', en: 'Draw a warm Ramadan night scene!', ar: 'ارسم مشهد ليلة رمضان الدافئة!' },
    hint: { ja: '三日月とランタン（ファヌース）を描いてみよう', en: 'Try drawing a crescent moon and lanterns (Fanous)', ar: 'جرب رسم الهلال والفوانيس' },
    xpReward: 40,
  },
  {
    id: 'wc-04', week: 4, icon: '🤝',
    theme: { ja: '友達との一コマ', en: 'A Moment with Friends', ar: 'لحظة مع الأصدقاء' },
    description: { ja: '友達と過ごした楽しいシーンを描こう！', en: 'Draw a fun scene with your friends!', ar: 'ارسم مشهداً ممتعاً مع أصدقائك!' },
    hint: { ja: '2人以上のキャラクターに挑戦してみよう', en: 'Try drawing 2 or more characters together', ar: 'جرب رسم شخصيتين أو أكثر معاً' },
    xpReward: 40,
  },
  {
    id: 'wc-05', week: 5, icon: '🌊',
    theme: { ja: 'ナイル川の風景', en: 'Nile River Scene', ar: 'مشهد نهر النيل' },
    description: { ja: 'ナイル川のある風景や生き物を描こう！', en: 'Draw a scene or creature from the Nile River!', ar: 'ارسم مشهداً أو مخلوقاً من نهر النيل!' },
    hint: { ja: '水を描くコツは水平な線を波線にすること', en: 'The trick to drawing water is making horizontal lines wavy', ar: 'سر رسم الماء هو جعل الخطوط الأفقية متموجة' },
    xpReward: 40,
  },
  {
    id: 'wc-06', week: 6, icon: '🎭',
    theme: { ja: 'キャラクターの怒り顔', en: 'Angry Character Expression', ar: 'تعبير الشخصية الغاضبة' },
    description: { ja: 'いろんな怒り顔に挑戦してみよう！', en: 'Try drawing different angry expressions!', ar: 'جرب رسم تعبيرات غاضبة مختلفة!' },
    hint: { ja: '眉毛をV字に、目を細くすると怒り顔になるよ', en: 'V-shaped eyebrows and narrowed eyes make an angry face', ar: 'الحواجب على شكل V والعيون الضيقة تصنع وجهاً غاضباً' },
    xpReward: 40,
  },
  {
    id: 'wc-07', week: 7, icon: '🏃',
    theme: { ja: '走るキャラクター', en: 'Running Character', ar: 'شخصية تركض' },
    description: { ja: '全力で走るキャラクターを描こう！', en: 'Draw a character running at full speed!', ar: 'ارسم شخصية تركض بكل قوتها!' },
    hint: { ja: '足を大きく開いて、腕を前後に振ると走って見えるよ', en: 'Spread the legs wide and swing the arms back and forth', ar: 'افرد الساقين واهزّ الذراعين للأمام والخلف' },
    xpReward: 40,
  },
  {
    id: 'wc-08', week: 8, icon: '🏠',
    theme: { ja: '私の家・部屋', en: 'My Home / Room', ar: 'بيتي / غرفتي' },
    description: { ja: '自分の家や部屋をマンガ風に描こう！', en: 'Draw your home or room in manga style!', ar: 'ارسم بيتك أو غرفتك بأسلوب المانغا!' },
    hint: { ja: '一点透視で描くと部屋っぽく見えるよ', en: 'Using one-point perspective makes it look like a room', ar: 'استخدام المنظور أحادي النقطة يجعله يبدو كغرفة' },
    xpReward: 40,
  },
  {
    id: 'wc-09', week: 9, icon: '🐪',
    theme: { ja: 'エジプトの動物', en: 'Egyptian Animals', ar: 'حيوانات مصر' },
    description: { ja: 'ラクダ・猫・カバなどエジプトの動物を描こう！', en: 'Draw Egyptian animals like camels, cats, or hippos!', ar: 'ارسم حيوانات مصرية كالجمل والقطة وفرس النهر!' },
    hint: { ja: '丸や四角などの基本形から始めると描きやすいよ', en: 'Starting from basic shapes like circles and squares makes it easier', ar: 'البدء من أشكال أساسية كالدوائر والمربعات يسهّل الرسم' },
    xpReward: 40,
  },
  {
    id: 'wc-10', week: 10, icon: '🌟',
    theme: { ja: 'オリジナルヒーロー', en: 'Original Hero', ar: 'بطل أصلي' },
    description: { ja: '自分だけのオリジナルヒーローを作ろう！', en: 'Create your very own original hero!', ar: 'ابتكر بطلك الأصلي الخاص!' },
    hint: { ja: '必殺技や衣装も考えてみよう', en: 'Think about their special move and costume too', ar: 'فكّر في حركتهم الخاصة وزيّهم أيضاً' },
    xpReward: 50,
  },
  {
    id: 'wc-11', week: 11, icon: '🍽️',
    theme: { ja: '好きな食べ物', en: 'Favorite Food', ar: 'طعامك المفضل' },
    description: { ja: '大好きな食べ物を美味しそうに描こう！', en: 'Draw your favorite food in a delicious way!', ar: 'ارسم طعامك المفضل بشكل شهي!' },
    hint: { ja: 'コシャリ・寿司・ピザ…何でもOK！湯気を描くともっと美味しそう', en: 'Koshary, sushi, pizza... anything! Steam makes food look delicious', ar: 'الكشري والسوشي والبيتزا... أي شيء! البخار يجعل الطعام يبدو شهياً' },
    xpReward: 40,
  },
  {
    id: 'wc-12', week: 12, icon: '💪',
    theme: { ja: '4コマチャレンジ', en: '4-Koma Challenge', ar: 'تحدي 4 لوحات' },
    description: { ja: 'テーマ自由で4コマ漫画を描いてみよう！', en: 'Draw a 4-koma manga with any theme you like!', ar: 'ارسم مانغا من 4 لوحات بأي موضوع تريد!' },
    hint: { ja: '起承転結を意識して、最後にオチをつけよう', en: 'Think about setup-development-turn-punchline structure', ar: 'فكر في هيكل البداية-التطور-التحول-الخاتمة' },
    xpReward: 60,
  },
];

// 今週のチャレンジを取得（週番号ベース）
export function getCurrentChallenge(): WeeklyChallenge {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.floor((now.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const idx = weekNum % WEEKLY_CHALLENGES.length;
  return WEEKLY_CHALLENGES[idx];
}

// 今週の締め切り（日曜23:59）
export function getWeekDeadline(): Date {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + daysUntilSunday);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}
