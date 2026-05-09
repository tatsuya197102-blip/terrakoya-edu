'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const THEMES = [
  { id: 'school',     labelJa: '🏫 学校の日常',       labelEn: '🏫 School Life',       labelAr: '🏫 الحياة المدرسية' },
  { id: 'adventure',  labelJa: '⚔️ 冒険',             labelEn: '⚔️ Adventure',         labelAr: '⚔️ مغامرة' },
  { id: 'funny',      labelJa: '😂 おもしろ',          labelEn: '😂 Comedy',            labelAr: '😂 مضحك' },
  { id: 'friendship', labelJa: '🤝 友情',             labelEn: '🤝 Friendship',         labelAr: '🤝 صداقة' },
  { id: 'egypt',      labelJa: '🏛️ エジプトの冒険',   labelEn: '🏛️ Egypt Adventure',  labelAr: '🏛️ مغامرة مصرية' },
  { id: 'ramadan',    labelJa: '🌙 ラマダン',          labelEn: '🌙 Ramadan',           labelAr: '🌙 رمضان' },
  { id: 'nile',       labelJa: '🌊 ナイル川の旅',     labelEn: '🌊 Nile River Journey', labelAr: '🌊 رحلة النيل' },
  { id: 'market',     labelJa: '🛒 にぎやかなスーク', labelEn: '🛒 Bustling Souk',     labelAr: '🛒 السوق الصاخب' },
  { id: 'japan_egypt',labelJa: '🇯🇵🇪🇬 日本とエジプト', labelEn: '🇯🇵🇪🇬 Japan & Egypt', labelAr: '🇯🇵🇪🇬 اليابان ومصر' },
  { id: 'free',       labelJa: '✨ 自由テーマ',        labelEn: '✨ Free Theme',         labelAr: '✨ موضوع حر' },
];

interface Story {
  title: string;
  panels: { panel: number; scene: string; dialogue: string }[];
}

export default function Auto4MangaPage() {
  const { i18n, t: tr } = useTranslation();
  const lang = i18n.language as 'ja' | 'en' | 'ar';
  const [characterName, setCharacterName] = useState('');
  const [theme, setTheme] = useState('');
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [submitMsg, setSubmitMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { useT } = { useT: null }; // dummy
  const tl = {
    title: tr('manga4.title'),
    sub: tr('manga4.subtitle'),
    charName: tr('manga4.characterName'),
    charPlaceholder: ({'ar':'مثال: سارة، يوسف','en':'e.g. Sakura, Taro','ja':'例: タロウ、サクラ','zh':'例：小明、小花','hi':'जैसे: सकुरा, तारो','vi':'Vd: Sakura, Taro','es':'Ej: Sakura, Taro'} as Record<string,string>)[lang] || 'e.g. Sakura, Taro',
    selectTheme: tr('manga4.theme'),
    generate: tr('manga4.generate'),
    generating: tr('manga4.generating'),
    panel: ({'ar':'اللوحة','en':'Panel','ja':'コマ','zh':'格','hi':'पैनल','vi':'Panel','es':'Panel'} as Record<string,string>)[lang] || 'Panel',
    scene: ({'ar':'المشهد','en':'Scene','ja':'場面','zh':'场景','hi':'दृश्य','vi':'Cảnh','es':'Escena'} as Record<string,string>)[lang] || 'Scene',
    dialogue: ({'ar':'الحوار','en':'Dialogue','ja':'セリフ','zh':'对话','hi':'संवाद','vi':'Đối thoại','es':'Diálogo'} as Record<string,string>)[lang] || 'Dialogue',
    useThis: tr('manga4.useThis'),
    draw: tr('manga4.draw'),
    back: tr('manga4.back'),
    ki: ({'ar':'البداية','en':'Setup','ja':'起','zh':'起','hi':'शुरुआत','vi':'Mở đầu','es':'Inicio'} as Record<string,string>)[lang] || 'Setup',
    sho: ({'ar':'التطور','en':'Build','ja':'承','zh':'承','hi':'विकास','vi':'Phát triển','es':'Desarrollo'} as Record<string,string>)[lang] || 'Build',
    ten: ({'ar':'التحول','en':'Turn','ja':'転','zh':'转','hi':'मोड़','vi':'Chuyển biến','es':'Giro'} as Record<string,string>)[lang] || 'Turn',
    ketsu: ({'ar':'النهاية','en':'Payoff','ja':'結','zh':'结','hi':'समाप्ति','vi':'Kết thúc','es':'Desenlace'} as Record<string,string>)[lang] || 'Payoff',
    download: tr('manga4.download'),
    tips: tr('manga4.tips'),
  };
  const t = tl;

  const panelLabels = [t.ki, t.sho, t.ten, t.ketsu];

  const generateStories = async () => {
    if (!characterName || !theme) return;
    setLoading(true);
    setStories([]);
    setSelectedStory(null);

    try {
      const response = await fetch('/api/generate-4manga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterName, theme, lang }),
      });
      const data = await response.json();
      setStories(data.stories || []);
    } catch (err) {
      console.error('Error:', err);
      const fallbackStories = generateFallbackStories(characterName, theme);
      setStories(fallbackStories);
    }
    setLoading(false);
  };

  const generateFallbackStories = (name: string, themeId: string): Story[] => {
    // 言語別フォールバックストーリー
    if (lang === 'en') {
      const en: Record<string, Story[]> = {
        school: [
          { title: `${name}'s Lunch Time`, panels: [
            { panel:1, scene:`${name} is excited about lunch`, dialogue:'I wonder what lunch is today?' },
            { panel:2, scene:'Sees the menu and is surprised', dialogue:'Curry! My favorite!' },
            { panel:3, scene:'Tries to get seconds but...', dialogue:'None left!?' },
            { panel:4, scene:'A friend shares their portion', dialogue:`Friend: Here, have half! / ${name}: Thank you!` },
          ]},
          { title: `${name} Forgot Something`, panels: [
            { panel:1, scene:`${name} heads to school cheerfully`, dialogue:'What a nice day!' },
            { panel:2, scene:'Class begins', dialogue:"Open your textbooks, please..." },
            { panel:3, scene:'No textbook!', dialogue:'Oh no! I forgot my textbook!' },
            { panel:4, scene:'A classmate shares theirs', dialogue:`Classmate: Let's share! / ${name}: You're a lifesaver!` },
          ]},
          { title: `${name}'s PE Class`, panels: [
            { panel:1, scene:`${name} does warm-up exercises eagerly`, dialogue:"Let's go! Soccer time!" },
            { panel:2, scene:'Tries to kick the ball', dialogue:'Here I go!' },
            { panel:3, scene:'Misses and falls', dialogue:'Oops!' },
            { panel:4, scene:'Everyone laughs and has fun', dialogue:"Haha! One more time!" },
          ]},
        ],
        adventure: [
          { title: `${name}'s Treasure Hunt`, panels: [
            { panel:1, scene:`${name} finds an old map`, dialogue:"This is... a treasure map!" },
            { panel:2, scene:'Sets off on the adventure', dialogue:"Let's go!" },
            { panel:3, scene:'Discovers a huge cave', dialogue:'Is the treasure in here...?' },
            { panel:4, scene:'The treasure chest holds photos of friends', dialogue:'The real treasure was friendship!' },
          ]},
          { title: `${name} and the Dragon`, panels: [
            { panel:1, scene:`${name} finds a mysterious egg in the forest`, dialogue:"What's this egg?" },
            { panel:2, scene:'A dragon hatches from the egg', dialogue:`Dragon: Squeak! / ${name}: So cute!` },
            { panel:3, scene:'The dragon breathes fire — oh no!', dialogue:`${name}: Whoa, it's hot!` },
            { panel:4, scene:'They become best friends', dialogue:`${name}: Your name is Blaze!` },
          ]},
          { title: `${name}'s Flying Adventure`, panels: [
            { panel:1, scene:`${name} finds a flying broom`, dialogue:'Can this thing really fly?' },
            { panel:2, scene:'Takes off into the sky', dialogue:'Amazing! The sky is so close!' },
            { panel:3, scene:'Discovers a kingdom above the clouds', dialogue:'A kingdom up here!?' },
            { panel:4, scene:'Makes friends with the kingdom folk', dialogue:'Come visit again!' },
          ]},
        ],
        funny: [
          { title: `${name}'s Big Sneeze`, panels: [
            { panel:1, scene:`${name} is about to sneeze`, dialogue:'Ah... ah...' },
            { panel:2, scene:'Everyone braces for impact', dialogue:"Here it comes!" },
            { panel:3, scene:'A massive sneeze!', dialogue:'ACHOO!!' },
            { panel:4, scene:"The teacher's wig flies off", dialogue:"Uh oh, teacher's wig...!" },
          ]},
          { title: `${name}'s Funny Face`, panels: [
            { panel:1, scene:`${name} practices funny faces in the mirror`, dialogue:"I'm gonna win the funny face contest!" },
            { panel:2, scene:'Tries many expressions', dialogue:'Hmm, I need something even better...' },
            { panel:3, scene:'Nails the perfect funny face', dialogue:'This is it! Perfect!' },
            { panel:4, scene:'The face gets stuck', dialogue:"Wait... it won't go back!?" },
          ]},
          { title: `${name} Walks the Dog`, panels: [
            { panel:1, scene:`${name} sets out for a dog walk`, dialogue:"Let's go for a walk!" },
            { panel:2, scene:'The dog spots a cat and bolts', dialogue:'Whoa! Wait!' },
            { panel:3, scene:'Gets dragged through the whole town', dialogue:'Someone help me!!' },
            { panel:4, scene:'The dog and cat end up best friends', dialogue:"...Well, at least they're friends now." },
          ]},
        ],
        friendship: [
          { title: `${name} and the New Student`, panels: [
            { panel:1, scene:'A new student arrives', dialogue:'Umm, nice to meet you...' },
            { panel:2, scene:`${name} invites them to lunch`, dialogue:"Let's have lunch together!" },
            { panel:3, scene:'They discover they love manga', dialogue:`New student: You like manga? Me too!` },
            { panel:4, scene:'They become best friends', dialogue:"Let's be friends!" },
          ]},
          { title: `${name} Cheers Up a Friend`, panels: [
            { panel:1, scene:'A friend is upset about a bad test score', dialogue:"I give up..." },
            { panel:2, scene:`${name} suggests studying together`, dialogue:"Let's study together!" },
            { panel:3, scene:'Daily after-school study sessions', dialogue:`${name}: Here's how! / Friend: I get it now!` },
            { panel:4, scene:'Friend scores high on the next test', dialogue:`Friend: 90 points! Thank you!` },
          ]},
          { title: `${name}'s Fight and Make Up`, panels: [
            { panel:1, scene:'A small argument with a friend', dialogue:"I'm done with you!" },
            { panel:2, scene:'Awkward silence between them', dialogue:'...' },
            { panel:3, scene:"It starts raining and friend has no umbrella", dialogue:'Oh...' },
            { panel:4, scene:`${name} shares their umbrella`, dialogue:`${name}: Let's walk home together. / Friend: ...Yeah!` },
          ]},
        ],
        free: [
          { title: `${name}'s Dream`, panels: [
            { panel:1, scene:`${name} flies through the sky in a dream`, dialogue:"Wow, I'm flying!" },
            { panel:2, scene:'Finds a mountain of cake in the dream', dialogue:'All-you-can-eat!' },
            { panel:3, scene:'The alarm goes off', dialogue:'RING RING RING!' },
            { panel:4, scene:'Wakes up with drool on the pillow', dialogue:'...Just a dream. But it tasted so good!' },
          ]},
          { title: `${name}'s Time Machine`, panels: [
            { panel:1, scene:`${name} finds a time machine in the closet`, dialogue:"No way... is this real?" },
            { panel:2, scene:'Lands in the age of dinosaurs', dialogue:'Real dinosaurs!!' },
            { panel:3, scene:'Gets chased by a dinosaur', dialogue:'Run!!' },
            { panel:4, scene:'Returns home safely', dialogue:'Home sweet home...' },
          ]},
          { title: `${name}'s Magic Pen`, panels: [
            { panel:1, scene:`${name} picks up a glowing pen`, dialogue:'What is this pen?' },
            { panel:2, scene:'Everything drawn comes to life', dialogue:`Drew a cake and it's real!` },
            { panel:3, scene:'Gets cocky and draws a lion', dialogue:`Lion: ROAR! / ${name}: Ahhh!` },
            { panel:4, scene:'Erases it with a magic eraser', dialogue:'...The eraser was magic too!' },
          ]},
        ],
      };
      return en[themeId] || en.free;
    }

    if (lang === 'ar') {
      const ar: Record<string, Story[]> = {
        school: [
          { title: `وقت الغداء مع ${name}`, panels: [
            { panel:1, scene:`${name} يتطلع للغداء بفارغ الصبر`, dialogue:'يا ترى ماذا يوجد في الغداء اليوم؟' },
            { panel:2, scene:'يرى القائمة ويتفاجأ', dialogue:'كاري! أحبه جداً!' },
            { panel:3, scene:'يحاول أخذ المزيد لكن...', dialogue:'لم يبقَ شيء!؟' },
            { panel:4, scene:'صديق يشاركه نصيبه', dialogue:`صديق: خذ نصفي! / ${name}: شكراً لك!` },
          ]},
          { title: `${name} ينسى أشياءه`, panels: [
            { panel:1, scene:`${name} يذهب للمدرسة بسعادة`, dialogue:'يوم جميل!' },
            { panel:2, scene:'يبدأ الدرس', dialogue:'افتحوا كتبكم...' },
            { panel:3, scene:'لا كتاب!', dialogue:'أوه لا! نسيت كتابي!' },
            { panel:4, scene:'زميل يشاركه كتابه', dialogue:`زميل: تعال نشترك! / ${name}: أنقذتني!` },
          ]},
          { title: `حصة التربية البدنية مع ${name}`, panels: [
            { panel:1, scene:`${name} يتحمس للحصة`, dialogue:'رائع! كرة القدم اليوم!' },
            { panel:2, scene:'يحاول ركل الكرة', dialogue:'هيا!' },
            { panel:3, scene:'يخطئ ويقع', dialogue:'آه!' },
            { panel:4, scene:'الجميع يضحك ويستمتع', dialogue:'هاها! مرة ثانية!' },
          ]},
        ],
        adventure: [
          { title: `${name} يبحث عن الكنز`, panels: [
            { panel:1, scene:`${name} يجد خريطة قديمة`, dialogue:'هذه... خريطة كنز!' },
            { panel:2, scene:'ينطلق في المغامرة', dialogue:'هيا ننطلق!' },
            { panel:3, scene:'يكتشف كهفاً ضخماً', dialogue:'هل الكنز هنا؟' },
            { panel:4, scene:'الكنز هو صور الأصدقاء', dialogue:'الكنز الحقيقي هو الصداقة!' },
          ]},
          { title: `${name} والتنين`, panels: [
            { panel:1, scene:`${name} يجد بيضة غريبة في الغابة`, dialogue:'ما هذه البيضة؟' },
            { panel:2, scene:'تنين يفقس من البيضة', dialogue:`تنين: صرير! / ${name}: كم هو لطيف!` },
            { panel:3, scene:'التنين يتنفس ناراً', dialogue:`${name}: واو! حار جداً!` },
            { panel:4, scene:'يصبحان أصدقاء مقربين', dialogue:`${name}: اسمك لهيب!` },
          ]},
          { title: `مغامرة ${name} الطائرة`, panels: [
            { panel:1, scene:`${name} يجد مكنسة طائرة`, dialogue:'هل يمكن أن تطير هذه؟' },
            { panel:2, scene:'يحلق في السماء', dialogue:'رائع! السماء قريبة جداً!' },
            { panel:3, scene:'يكتشف مملكة فوق الغيوم', dialogue:'مملكة هنا!؟' },
            { panel:4, scene:'يصادق أهل المملكة', dialogue:'تعال مرة أخرى!' },
          ]},
        ],
        funny: [
          { title: `عطسة ${name} الكبيرة`, panels: [
            { panel:1, scene:`${name} على وشك العطس`, dialogue:'آه... آه...' },
            { panel:2, scene:'الجميع يستعد', dialogue:'إنها قادمة!' },
            { panel:3, scene:'عطسة هائلة!', dialogue:'آتشووو!!' },
            { panel:4, scene:'شعر المعلم يطير', dialogue:'يا إلهي، شعر المعلم!!' },
          ]},
          { title: `وجوه ${name} المضحكة`, panels: [
            { panel:1, scene:`${name} يتدرب أمام المرآة`, dialogue:'سأفوز بمسابقة الوجوه المضحكة!' },
            { panel:2, scene:'يجرب تعبيرات مختلفة', dialogue:'أحتاج شيئاً أفضل...' },
            { panel:3, scene:'يجد الوجه المثالي!', dialogue:'هذا هو! مثالي!' },
            { panel:4, scene:'وجهه لا يعود لطبيعته', dialogue:'مهلاً... لا يعود!؟' },
          ]},
          { title: `${name} يمشي الكلب`, panels: [
            { panel:1, scene:`${name} يخرج لتمشية الكلب`, dialogue:'هيا نتمشى!' },
            { panel:2, scene:'الكلب يرى قطة ويجري', dialogue:'مهلاً! انتظر!' },
            { panel:3, scene:'يُسحب عبر المدينة', dialogue:'أنقذوني!!' },
            { panel:4, scene:'الكلب والقطة يصبحان أصدقاء', dialogue:'...على الأقل هما أصدقاء الآن.' },
          ]},
        ],
        friendship: [
          { title: `${name} والطالب الجديد`, panels: [
            { panel:1, scene:'يصل طالب جديد', dialogue:'أهلاً... سعيد بلقائكم...' },
            { panel:2, scene:`${name} يدعوه للغداء`, dialogue:'تعال نتغدى معاً!' },
            { panel:3, scene:'يكتشفان أنهما يحبان المانغا', dialogue:`طالب جديد: تحب المانغا؟ أنا أيضاً!` },
            { panel:4, scene:'يصبحان أصدقاء مقربين', dialogue:'لنكن أصدقاء!' },
          ]},
          { title: `${name} يشجع صديقه`, panels: [
            { panel:1, scene:'صديق محبط من درجته المنخفضة', dialogue:'استسلمت...' },
            { panel:2, scene:`${name} يقترح الدراسة معاً`, dialogue:'لندرس معاً!' },
            { panel:3, scene:'يتدربان يومياً بعد المدرسة', dialogue:`${name}: هكذا! / صديق: فهمت الآن!` },
            { panel:4, scene:'الصديق يحصل على درجة عالية', dialogue:`صديق: 90 نقطة! شكراً!` },
          ]},
          { title: `${name} والمصالحة`, panels: [
            { panel:1, scene:'خلاف صغير مع صديق', dialogue:'لا أريد التحدث إليك!' },
            { panel:2, scene:'أجواء متوترة بينهما', dialogue:'...' },
            { panel:3, scene:'يبدأ المطر والصديق بلا مظلة', dialogue:'أوه...' },
            { panel:4, scene:`${name} يشاركه المظلة`, dialogue:`${name}: هيا نمشي معاً. / صديق: ...نعم!` },
          ]},
        ],
        free: [
          { title: `حلم ${name}`, panels: [
            { panel:1, scene:`${name} يطير في السماء في حلم`, dialogue:'رائع، أنا أطير!' },
            { panel:2, scene:'يجد جبلاً من الحلوى في الحلم', dialogue:'أكل بلا حدود!' },
            { panel:3, scene:'يرن المنبه', dialogue:'رن رن رن!' },
            { panel:4, scene:'يستيقظ وفمه يسيل', dialogue:'...كان حلماً. كان لذيذاً جداً!' },
          ]},
          { title: `آلة الزمن مع ${name}`, panels: [
            { panel:1, scene:`${name} يجد آلة زمن في الخزانة`, dialogue:'لا يصدق... هل هذه حقيقية؟' },
            { panel:2, scene:'ينتقل إلى عصر الديناصورات', dialogue:'ديناصورات حقيقية!!' },
            { panel:3, scene:'ديناصور يطارده', dialogue:'اجري!!' },
            { panel:4, scene:'يعود سالماً', dialogue:'الحياة العصرية أفضل...' },
          ]},
          { title: `قلم ${name} السحري`, panels: [
            { panel:1, scene:`${name} يجد قلماً متوهجاً`, dialogue:'ما هذا القلم؟' },
            { panel:2, scene:'كل ما يرسمه يتحول لحقيقة', dialogue:'رسمت كعكة وأصبحت حقيقية!' },
            { panel:3, scene:'يرسم أسداً بثقة زائدة', dialogue:`أسد: زئير! / ${name}: آه!` },
            { panel:4, scene:'يمحوه بالممحاة السحرية', dialogue:'...الممحاة سحرية أيضاً!' },
          ]},
        ],
      };
      return ar[themeId] || ar.free;
    }

    // 日本語フォールバック
    const themeStories: Record<string, Story[]> = {
      school: [
        { title: `${name}の給食タイム`, panels: [
          { panel: 1, scene: `${name}が給食を楽しみにしている`, dialogue: '今日の給食はなんだろう？' },
          { panel: 2, scene: 'メニューを見て驚く', dialogue: 'え！カレーだ！大好き！' },
          { panel: 3, scene: 'おかわりしようとしたら...', dialogue: 'もう無い！？' },
          { panel: 4, scene: '友達が分けてくれる', dialogue: `友達：半分あげるよ！ / ${name}：ありがとう！` },
        ]},
        { title: `${name}の忘れ物`, panels: [
          { panel: 1, scene: `${name}が元気に登校`, dialogue: '今日もいい天気！' },
          { panel: 2, scene: '授業が始まる', dialogue: 'では教科書を開いて...' },
          { panel: 3, scene: '教科書がない！', dialogue: 'あれ！？教科書忘れた！' },
          { panel: 4, scene: '隣の席の子が見せてくれる', dialogue: `クラスメート：一緒に見よう！ / ${name}：助かった〜！` },
        ]},
        { title: `${name}の体育の時間`, panels: [
          { panel: 1, scene: `${name}が張り切って準備体操`, dialogue: 'よし！今日はサッカーだ！' },
          { panel: 2, scene: 'ボールを蹴ろうとする', dialogue: 'いくぞー！' },
          { panel: 3, scene: '空振りして転ぶ', dialogue: 'あっ！' },
          { panel: 4, scene: 'みんなで笑って楽しい', dialogue: 'あはは！もう一回！' },
        ]},
      ],
      adventure: [
        { title: `${name}の宝探し`, panels: [
          { panel: 1, scene: `${name}が古い地図を見つける`, dialogue: 'この地図は...宝の地図だ！' },
          { panel: 2, scene: '冒険に出発', dialogue: '出発だ！' },
          { panel: 3, scene: '大きな洞窟を発見', dialogue: 'ここに宝があるのか...？' },
          { panel: 4, scene: '宝箱を開けると友達の写真', dialogue: '本当の宝は友達だった！' },
        ]},
        { title: `${name}とドラゴン`, panels: [
          { panel: 1, scene: `${name}が森で不思議な卵を見つける`, dialogue: 'なんだこの卵？' },
          { panel: 2, scene: '卵からドラゴンが生まれる', dialogue: `ドラゴン：ピィー！ / ${name}：か、可愛い！` },
          { panel: 3, scene: 'ドラゴンが火を吹いて大変', dialogue: `${name}：うわぁ！熱い！` },
          { panel: 4, scene: 'ドラゴンと仲良くなる', dialogue: `${name}：お前の名前はヒノ！` },
        ]},
        { title: `${name}の空飛ぶ冒険`, panels: [
          { panel: 1, scene: `${name}が空飛ぶ箒を見つける`, dialogue: 'これ...飛べるの？' },
          { panel: 2, scene: '空を飛ぶ', dialogue: 'すごい！空が近い！' },
          { panel: 3, scene: '雲の上に王国がある', dialogue: 'こんな所に！？' },
          { panel: 4, scene: '王国の人と友達になる', dialogue: 'また遊びに来てね！' },
        ]},
      ],
      funny: [
        { title: `${name}のくしゃみ`, panels: [
          { panel: 1, scene: `${name}がくしゃみをしそう`, dialogue: 'は...は...' },
          { panel: 2, scene: '周りの人が構える', dialogue: 'くるぞ！' },
          { panel: 3, scene: '大きなくしゃみ！', dialogue: 'はっくしょーん！！' },
          { panel: 4, scene: 'カツラが飛ぶ', dialogue: 'あ、先生のカツラが...' },
        ]},
        { title: `${name}の変顔`, panels: [
          { panel: 1, scene: `${name}が鏡の前で変顔の練習`, dialogue: '変顔コンテストで優勝するぞ！' },
          { panel: 2, scene: 'いろんな変顔を試す', dialogue: 'うーん、もっとすごいの...' },
          { panel: 3, scene: '最高の変顔ができた！', dialogue: 'これだ！完璧！' },
          { panel: 4, scene: '顔が戻らなくなった', dialogue: 'あれ？...戻らない！？' },
        ]},
        { title: `${name}の犬の散歩`, panels: [
          { panel: 1, scene: `${name}が犬の散歩に出発`, dialogue: 'お散歩行こう！' },
          { panel: 2, scene: '犬が猫を見つけて走り出す', dialogue: 'わっ！待って！' },
          { panel: 3, scene: '引きずられて街中を爆走', dialogue: 'だ、誰か助けてー！' },
          { panel: 4, scene: '猫と犬が仲良くなってる', dialogue: '...結局仲良しかい' },
        ]},
      ],
      friendship: [
        { title: `${name}と転校生`, panels: [
          { panel: 1, scene: '新しい転校生が来る', dialogue: 'はじめまして...' },
          { panel: 2, scene: `${name}が声をかける`, dialogue: '一緒にお昼食べよう！' },
          { panel: 3, scene: '趣味が同じだと判明', dialogue: `転校生：え！マンガ好きなの？私も！` },
          { panel: 4, scene: '親友になる', dialogue: 'これからよろしくね！' },
        ]},
        { title: `${name}の応援`, panels: [
          { panel: 1, scene: '友達がテストで落ち込んでいる', dialogue: 'もうダメだ...' },
          { panel: 2, scene: `${name}が一緒に勉強を提案`, dialogue: '一緒に勉強しよう！' },
          { panel: 3, scene: '毎日放課後に特訓', dialogue: `${name}：ここはこうだよ！ / 友達：なるほど！` },
          { panel: 4, scene: '友達がテストで高得点', dialogue: `友達：90点取れた！ありがとう！` },
        ]},
        { title: `${name}とケンカ`, panels: [
          { panel: 1, scene: '些細なことで友達とケンカ', dialogue: 'もう知らない！' },
          { panel: 2, scene: 'お互い気まずい', dialogue: '...' },
          { panel: 3, scene: '雨が降ってきて友達が傘がない', dialogue: 'あっ...' },
          { panel: 4, scene: `${name}が傘を差し出す`, dialogue: `${name}：...一緒に帰ろ / 友達：うん！` },
        ]},
      ],
      egypt: [
        { title: `${name}のピラミッド探検`, panels: [
          { panel: 1, scene: `${name}がピラミッドの前に立つ`, dialogue: 'わあ！本物のピラミッドだ！' },
          { panel: 2, scene: '入口から中に入ると迷路のよう', dialogue: 'どっちに行けばいいの？' },
          { panel: 3, scene: 'ミイラのような影が現れる', dialogue: `${name}：ぎゃー！ / 影：ただの観光ガイドだよ` },
          { panel: 4, scene: '観光ガイドのおじさんだった', dialogue: 'ようこそエジプトへ！案内しますよ！' },
        ]},
        { title: `${name}とスフィンクス`, panels: [
          { panel: 1, scene: 'スフィンクスを見て感動する', dialogue: 'こんなに大きいの！' },
          { panel: 2, scene: 'スフィンクスに話しかけてみる', dialogue: `${name}：ねえ、何年ここにいるの？` },
          { panel: 3, scene: 'スフィンクスがしゃべり出す', dialogue: 'スフィンクス：4500年くらいかな' },
          { panel: 4, scene: 'みんなで記念撮影', dialogue: `${name}：また来るね！ / スフィンクス：待ってるよ！` },
        ]},
        { title: `${name}のファラオ体験`, panels: [
          { panel: 1, scene: '博物館でファラオの衣装を発見', dialogue: '着てみたい！' },
          { panel: 2, scene: 'ファラオの格好をしてみたが重くて大変', dialogue: 'こんなに重かったの！？' },
          { panel: 3, scene: '観光客に写真を求められる', dialogue: `一緒に撮って！ / わたしも！` },
          { panel: 4, scene: '人気者になって大満足', dialogue: `${name}：ファラオ最高！またやりたい！` },
        ]},
      ],
      ramadan: [
        { title: `${name}のイフタール`, panels: [
          { panel: 1, scene: '夕方、イフタールの準備をする家族', dialogue: 'もうすぐ日が沈む！' },
          { panel: 2, scene: 'アザーンが鳴り響く', dialogue: 'アッラーフ・アクバル！' },
          { panel: 3, scene: `みんなでイフタール、${name}は大喜び`, dialogue: 'やっと食べられる！いただきます！' },
          { panel: 4, scene: '家族みんなで食卓を囲む', dialogue: 'ラマダンって温かいんだね！' },
        ]},
        { title: `${name}のランタン`, panels: [
          { panel: 1, scene: 'ラマダンのランタン（ファヌース）を持つ', dialogue: 'きれい！町中がランタンだ！' },
          { panel: 2, scene: '子供たちが歌いながら歩く', dialogue: 'ワッハウィー！みんなで歌おう！' },
          { panel: 3, scene: 'お菓子をもらってうれしい', dialogue: 'カナーフェ！大好き！' },
          { panel: 4, scene: '星空の下でランタンを高く掲げる', dialogue: 'ラマダン・カリーム！' },
        ]},
        { title: `${name}の断食チャレンジ`, panels: [
          { panel: 1, scene: '夜明け前に起きてスフールを食べる', dialogue: 'まだ眠いけど起きなきゃ！' },
          { panel: 2, scene: '家族みんなで朝食', dialogue: 'お腹いっぱい食べよう！' },
          { panel: 3, scene: '昼間は元気に過ごす', dialogue: 'お腹すいたけど平気！' },
          { panel: 4, scene: '夕方まで頑張った', dialogue: `${name}：今日もやりきった！ラマダン・カリーム！` },
        ]},
      ],
      nile: [
        { title: `${name}のナイル川クルーズ`, panels: [
          { panel: 1, scene: 'ナイル川のボートに乗り込む', dialogue: 'ナイル川って広〜い！' },
          { panel: 2, scene: 'カバが顔を出してびっくり', dialogue: `${name}：うわ！ / カバ：やあ！` },
          { panel: 3, scene: '川沿いの遺跡が見えてくる', dialogue: '昔の人たちってすごい！' },
          { panel: 4, scene: '夕日がナイルを染める', dialogue: '世界一きれいな夕日だ！' },
        ]},
        { title: `${name}とナイルの魚釣り`, panels: [
          { panel: 1, scene: 'ナイル川で釣りをしている', dialogue: 'かかれ〜！' },
          { panel: 2, scene: '大きな魚がかかった！', dialogue: 'きた！重い！' },
          { panel: 3, scene: '引っ張り合いをしている', dialogue: `${name}：負けないぞ！ / 魚：負けないぞ！` },
          { panel: 4, scene: '結局魚を逃がしてしまった', dialogue: 'また来るね！（魚に向かって）' },
        ]},
        { title: `${name}とナイルの恵み`, panels: [
          { panel: 1, scene: '農家のおじさんに会う', dialogue: 'ナイルの水で野菜を育ててるんだよ' },
          { panel: 2, scene: '畑を見て驚く', dialogue: `${name}：こんなに育つの！？` },
          { panel: 3, scene: '収穫を手伝う', dialogue: 'わあ！野菜が抜けた！' },
          { panel: 4, scene: 'とれたて野菜でごはんを食べる', dialogue: 'ナイルの恵み、おいしい！' },
        ]},
      ],
      market: [
        { title: `${name}のカイロ市場`, panels: [
          { panel: 1, scene: 'ハン・ハリーリ市場に入る', dialogue: 'すごい！いろんなものが売ってる！' },
          { panel: 2, scene: '香辛料の匂いにクラクラ', dialogue: `${name}：くしゅん！スパイスが！` },
          { panel: 3, scene: '値切り交渉に挑戦', dialogue: `${name}：もう少し安くして！ / 売り手：じゃあこの値段で！` },
          { panel: 4, scene: 'お土産をたくさん買えた', dialogue: 'お土産GET！楽しかった！' },
        ]},
        { title: `${name}とコシャリ`, panels: [
          { panel: 1, scene: 'コシャリのお店の前で足が止まる', dialogue: 'なんだこのいい匂い！' },
          { panel: 2, scene: 'コシャリを注文してみる', dialogue: `${name}：これ全部乗せで！` },
          { panel: 3, scene: '一口食べて感動する', dialogue: '旨い！これが本場のコシャリか！' },
          { panel: 4, scene: 'おかわりを頼んでしまう', dialogue: `売り手：また来てね！ / ${name}：絶対来ます！` },
        ]},
        { title: `${name}の迷子`, panels: [
          { panel: 1, scene: '市場で道に迷う', dialogue: `${name}：あれ？どこだろう...` },
          { panel: 2, scene: '地元の子供に助けを求める', dialogue: 'ねえ、出口どっち？' },
          { panel: 3, scene: '子供が案内してくれる', dialogue: 'ついてきて！ / ありがとう！' },
          { panel: 4, scene: '友達になってお茶を飲む', dialogue: 'また遊ぼう！マルハバ！' },
        ]},
      ],
      japan_egypt: [
        { title: `${name}の日本×エジプト食文化`, panels: [
          { panel: 1, scene: 'エジプト人の友達が日本食を初体験', dialogue: '寿司？食べていい？' },
          { panel: 2, scene: 'わさびで大変なことに', dialogue: `友達：うわ！辛い！ / ${name}：ごめん！` },
          { panel: 3, scene: '今度は日本人がコシャリを初体験', dialogue: `${name}：これ全部混ぜるの！？` },
          { panel: 4, scene: 'お互いの食文化を認め合う', dialogue: '世界ってすごい！また交換しよう！' },
        ]},
        { title: `ピラミッドと富士山`, panels: [
          { panel: 1, scene: 'エジプト人と日本人の友達が話す', dialogue: `友達：ピラミッドって登れるの？ / ${name}：無理だよ！` },
          { panel: 2, scene: '富士山とピラミッドを描いて見せ合う', dialogue: '富士山は白い！ピラミッドは三角！' },
          { panel: 3, scene: 'どっちが大きいか調べる', dialogue: 'ピラミッドは138m、富士山は3776m！' },
          { panel: 4, scene: 'お互いの国を尊敬し合う', dialogue: 'どっちも世界遺産！すごいね！' },
        ]},
        { title: `マンガとアラブ漫画`, panels: [
          { panel: 1, scene: 'お互いに漫画を見せ合う', dialogue: `友達：アラビア語は右から読むんだよ！` },
          { panel: 2, scene: '日本語の漫画を逆から読んで混乱', dialogue: `${name}：えっ！逆！？` },
          { panel: 3, scene: '一緒に漫画を描く', dialogue: 'じゃあコラボしよう！' },
          { panel: 4, scene: '日本語×アラビア語のコラボ漫画完成', dialogue: '世界一ユニークな漫画の誕生！' },
        ]},
      ],
      free: [
        { title: `${name}の夢`, panels: [
          { panel: 1, scene: `${name}が夢の中で空を飛ぶ`, dialogue: 'わぁ！飛んでる！' },
          { panel: 2, scene: '夢の中でケーキの山を発見', dialogue: '食べ放題だ！' },
          { panel: 3, scene: '目覚ましが鳴る', dialogue: 'リリリリリ！' },
          { panel: 4, scene: '起きたらよだれがたれていた', dialogue: '...夢か。美味しかったのに' },
        ]},
        { title: `${name}のタイムマシン`, panels: [
          { panel: 1, scene: `${name}が押入れでタイムマシンを発見`, dialogue: 'これは...！' },
          { panel: 2, scene: '恐竜時代にタイムスリップ', dialogue: 'す、すごい！本物の恐竜！' },
          { panel: 3, scene: '恐竜に追いかけられる', dialogue: 'わぁぁぁ！逃げろー！' },
          { panel: 4, scene: 'なんとか帰ってきて一安心', dialogue: 'やっぱり現代が一番だ...' },
        ]},
        { title: `${name}の魔法のペン`, panels: [
          { panel: 1, scene: `${name}が光るペンを拾う`, dialogue: 'なんだこのペン？' },
          { panel: 2, scene: '描いたものが本物になる', dialogue: 'ケーキを描いたら...本物だ！' },
          { panel: 3, scene: '調子に乗ってライオンを描く', dialogue: `ライオン：ガオー！！ / ${name}：ぎゃー！` },
          { panel: 4, scene: '消しゴムで消して解決', dialogue: '...消しゴムも魔法だった！' },
        ]},
      ],
    };
    return themeStories[themeId] || themeStories.free;
  };

  const handleMangaSubmit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { auth, db } = await import('@/lib/firebase');
    const user = auth.currentUser;
    if (!user) { setSubmitMsg({'ar':'يجب تسجيل الدخول','en':'Login required','ja':'ログインが必要です','zh':'请先登录','hi':'लॉगिन आवश्यक है','vi':'Cần đăng nhập','es':'Inicio de sesión requerido'}[lang as string] || 'Login required'); return; }
    setSubmitting(true);
    setSubmitMsg(tr('manga4.submitting'));
    try {
      const base64: string = await new Promise((res) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          const MAX = 800;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
            else { width = Math.round(width * MAX / height); height = MAX; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(url);
          res(canvas.toDataURL('image/jpeg', 0.7).split(',')[1]);
        };
        img.src = url;
      });

      const { addDoc, updateDoc, doc, collection } = await import('firebase/firestore');
      const docRef = await addDoc(collection(db, 'users', user.uid, 'submissions'), {
        courseId: 'auto-4manga',
        fileName: file.name,
        fileType: 'image/jpeg',
        comment: `4コマ漫画「${selectedStory?.title || ''}」`,
        imageBase64: base64,
        submittedAt: new Date().toISOString(),
        aiFeedback: null, feedbackStatus: 'pending',
        gradeResult: null, gradingStatus: 'idle',
      });

      setSubmitMsg(tr('manga4.analyzing'));

      const res = await fetch('/api/analyze-artwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: 'auto-4manga',
          fileName: file.name,
          fileType: 'image/jpeg',
          comment: `4コマ漫画「${selectedStory?.title || ''}」`,
          imageBase64: base64,
          lang,
        }),
      });
      const data = await res.json();
      const feedback = data.feedback || ({'ar':'تعذر إنشاء التغذية الراجعة','en':'Could not generate feedback','ja':'フィードバックを生成できませんでした','zh':'无法生成反馈','hi':'फीडबैक नहीं बन सका','vi':'Không thể tạo phản hồi','es':'No se pudo generar retroalimentación'}[lang as string] || 'Could not generate feedback');

      await updateDoc(doc(db, 'users', user.uid, 'submissions', docRef.id), {
        aiFeedback: feedback, feedbackStatus: 'done',
      });

      setSubmitMsg(`✅__${feedback}`);
    } catch (err) {
      console.error(err);
      setSubmitMsg('❌ ' + ({'ar':'فشل الإرسال. حاول مجدداً','en':'Submission failed. Please try again','ja':'提出に失敗しました。もう一度お試しください','zh':'提交失败，请重试','hi':'सबमिट विफल हुआ। कृपया पुनः प्रयास करें','vi':'Gửi thất bại. Vui lòng thử lại','es':'Error al enviar. Inténtalo de nuevo'}[lang as string] || 'Submission failed. Please try again'));
    }
    setSubmitting(false);
  };

  const downloadTemplate = () => {
    const canvas = document.createElement('canvas');
    // 縦型4コマ（上から下1列、右余白にキャプション）
    const PANEL_W = 480;
    const PANEL_H = 200;
    const GAP = 12;
    const TITLE_H = 56;
    const PAD_LEFT = 20;
    const PAD_TOP = 10;
    const CAPTION_W = 160;
    const PAD_BOTTOM = 16;

    canvas.width = PAD_LEFT + PANEL_W + 16 + CAPTION_W + 16;
    canvas.height = TITLE_H + PAD_TOP + 4 * PANEL_H + 3 * GAP + PAD_BOTTOM;
    const W = canvas.width;
    const H = canvas.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 背景
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(0, 0, W, H);

    // 外枠
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, W - 2, H - 2);

    // タイトルバー
    ctx.fillStyle = '#eeeeee';
    ctx.fillRect(1, 1, W - 2, TITLE_H);
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(1, TITLE_H + 1); ctx.lineTo(W - 1, TITLE_H + 1); ctx.stroke();
    ctx.font = 'bold 22px "Hiragino Kaku Gothic ProN","Noto Sans JP",sans-serif';
    ctx.fillStyle = '#111111';
    ctx.textAlign = 'center';
    ctx.fillText(selectedStory?.title || '4コマ漫画', W / 2, TITLE_H - 14);
    ctx.textAlign = 'left';

    // テキスト折り返しヘルパー
    function wrapText(text: string, maxW: number, fontSize: number): string[] {
      ctx!.font = `${fontSize}px "Hiragino Kaku Gothic ProN","Noto Sans JP",sans-serif`;
      const lines: string[] = [];
      let line = '';
      for (const ch of text) {
        const test = line + ch;
        if (ctx!.measureText(test).width > maxW && line.length > 0) {
          lines.push(line); line = ch;
        } else { line = test; }
      }
      if (line) lines.push(line);
      return lines;
    }

    // セリフから「名前：」を分離する
    function parseDialogue(raw: string): { speaker: string; text: string } {
      const m = raw.match(/^([^：:]+)[：:](.+)$/);
      if (m) return { speaker: m[1].trim(), text: m[2].trim() };
      return { speaker: '', text: raw };
    }

    // 楕円吹き出し（セリフ折り返し対応・方向指定）
    // tailDir: 'left' = しっぽ左下, 'right' = しっぽ右下
    function drawBubble(cx2: number, cy2: number, bw: number, bh: number, rawText: string, spike: boolean, tailDir: 'left' | 'right' = 'right') {
      const ctx2 = ctx!;
      const { speaker, text } = parseDialogue(rawText);
      ctx2.save();
      if (spike) {
        const r1 = bh * 0.45, r2 = bh * 0.6, spikes = 14;
        ctx2.fillStyle = '#ffffff';
        ctx2.strokeStyle = '#333333';
        ctx2.lineWidth = 1.8;
        ctx2.beginPath();
        for (let s = 0; s < spikes * 2; s++) {
          const angle = (s / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
          const r = s % 2 === 0 ? r2 : r1;
          const px2 = cx2 + Math.cos(angle) * r * (bw / bh);
          const py2 = cy2 + Math.sin(angle) * r;
          s === 0 ? ctx2.moveTo(px2, py2) : ctx2.lineTo(px2, py2);
        }
        ctx2.closePath(); ctx2.fill(); ctx2.stroke();
      } else {
        ctx2.fillStyle = '#ffffff';
        ctx2.strokeStyle = '#333333';
        ctx2.lineWidth = 1.8;
        ctx2.beginPath();
        ctx2.ellipse(cx2, cy2, bw / 2, bh / 2, 0, 0, Math.PI * 2);
        ctx2.fill(); ctx2.stroke();
        // しっぽは吹き出し位置の反対側（コマ内側）向き
        // right位置の吹き出し → しっぽは左下、left位置 → しっぽは右下
        const sign = tailDir === 'right' ? -1 : 1;
        ctx2.fillStyle = '#ffffff';
        ctx2.beginPath();
        ctx2.moveTo(cx2 + sign * bw * 0.15, cy2 + bh * 0.38);
        ctx2.lineTo(cx2 + sign * bw * 0.4, cy2 + bh * 0.72);
        ctx2.lineTo(cx2 - sign * bw * 0.05, cy2 + bh * 0.42);
        ctx2.fill();
        ctx2.strokeStyle = '#333333'; ctx2.lineWidth = 1.5;
        ctx2.beginPath();
        ctx2.moveTo(cx2 + sign * bw * 0.15, cy2 + bh * 0.38);
        ctx2.lineTo(cx2 + sign * bw * 0.4, cy2 + bh * 0.72);
        ctx2.lineTo(cx2 - sign * bw * 0.05, cy2 + bh * 0.42);
        ctx2.stroke();
      }

      // スピーカー名ラベル（吹き出し上部）
      if (speaker) {
        ctx2.font = `bold 11px "Hiragino Kaku Gothic ProN","Noto Sans JP",sans-serif`;
        ctx2.fillStyle = '#555555';
        ctx2.textAlign = 'center';
        ctx2.fillText(`(${speaker})`, cx2, cy2 - bh / 2 - 4);
      }

      // セリフ（折り返し）
      const fontSize = 14;
      const maxTW = bw - 28;
      const lines = wrapText(text, maxTW, fontSize);
      const lineH = fontSize * 1.4;
      const totalH = lines.length * lineH;
      const startY = cy2 - totalH / 2 + fontSize * 0.6;
      ctx2.font = `bold ${fontSize}px "Hiragino Kaku Gothic ProN","Noto Sans JP",sans-serif`;
      ctx2.fillStyle = '#111111';
      ctx2.textAlign = 'center';
      lines.forEach((line, li) => {
        ctx2.fillText(`「${li === 0 ? '' : ''}${line}${li === lines.length - 1 ? '' : ''}」`.replace('「」', line).replace(/「|」/g, li === 0 && lines.length === 1 ? '' : ''), cx2, startY + li * lineH);
      });
      // 「」を1行全体に付ける
      if (lines.length === 1) {
        ctx2.fillText(`「${lines[0]}」`, cx2, startY);
      }
      ctx2.textAlign = 'left';
      ctx2.restore();
    }

    // キャプション（右外側）
    function drawCaption(panelY: number, ph: number, text: string) {
      const cx2 = PAD_LEFT + PANEL_W + 16;
      const cw = CAPTION_W;
      ctx!.fillStyle = '#ffffff';
      ctx!.strokeStyle = '#aaaaaa';
      ctx!.lineWidth = 1;
      ctx!.fillRect(cx2, panelY + 4, cw, 26);
      ctx!.strokeRect(cx2, panelY + 4, cw, 26);
      const fontSize = 11;
      const lines = wrapText(text, cw - 10, fontSize);
      ctx!.font = `${fontSize}px "Hiragino Kaku Gothic ProN","Noto Sans JP",sans-serif`;
      ctx!.fillStyle = '#555555';
      lines.slice(0, 3).forEach((line, li) => {
        ctx!.fillText(line, cx2 + 5, panelY + 18 + li * 14);
      });
    }

    // 各コマ描画
    const panelX = PAD_LEFT;
    for (let i = 0; i < 4; i++) {
      const panelY = TITLE_H + PAD_TOP + i * (PANEL_H + GAP);

      // コマ枠
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(panelX, panelY, PANEL_W, PANEL_H);
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 2;
      ctx.strokeRect(panelX, panelY, PANEL_W, PANEL_H);

      // コマ番号（左上）
      ctx.fillStyle = '#333333';
      ctx.fillRect(panelX, panelY, 26, 22);
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${i + 1}`, panelX + 7, panelY + 15);

      // セリフ吹き出し
      const p = selectedStory?.panels[i];
      const dialogue = p?.dialogue || (lang === 'ar' ? 'الحوار هنا' : lang === 'en' ? 'Dialogue here' : 'セリフ');
      const scene = p?.scene || (lang === 'ar' ? 'المشهد هنا' : lang === 'en' ? 'Scene here' : '場面');
      const isSpike = i === 2; // 3コマ目はギザギザ
      // 1・3コマ目→右側、2・4コマ目→左側
      const tailDir: 'left' | 'right' = (i % 2 === 0) ? 'right' : 'left';
      const bw = 200, bh = 86;
      const bx = tailDir === 'right'
        ? panelX + PANEL_W - bw / 2 - 20
        : panelX + bw / 2 + 20;
      const by = panelY + (isSpike ? PANEL_H - bh / 2 - 20 : bh / 2 + 18);
      drawBubble(bx, by, bw, bh, dialogue, isSpike, tailDir);

      // キャプション（右外側）
      drawCaption(panelY, PANEL_H, scene);
    }

    // クレジット
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#cccccc';
    ctx.textAlign = 'right';
    ctx.fillText('TERRAKOYA', W - 6, H - 5);
    ctx.textAlign = 'left';

    const link = document.createElement('a');
    link.download = '4koma_template.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (selectedStory) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-3xl mx-auto">
          <button onClick={() => setSelectedStory(null)} className="text-blue-400 hover:underline mb-6 block">{t.back}</button>
          <h1 className="text-3xl font-bold mb-2">{t.draw}</h1>
          <h2 className="text-xl text-blue-400 mb-8">「{selectedStory.title}」</h2>

          <div className="space-y-6 mb-8">
            {selectedStory.panels.map((panel, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full">{panelLabels[i]}</span>
                  <span className="text-gray-400 text-sm">{t.panel} {panel.panel}</span>
                </div>
                <p className="text-gray-300 mb-2">🎬 {t.scene}: {panel.scene}</p>
                <p className="text-white font-medium">💬 {t.dialogue}: 「{panel.dialogue}」</p>
                <div className="mt-4 border-2 border-dashed border-slate-700 rounded-xl h-32 flex items-center justify-center text-gray-500">
                  {({'ar':'ارسم هنا!','en':'Draw here!','ja':'ここに描こう！','zh':'在这里画！','hi':'यहाँ बनाएं!','vi':'Vẽ ở đây!','es':'¡Dibuja aquí!'}[lang as string] || 'Draw here!')}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-bold mb-3">💡 {t.tips}</h3>
            <ul className="text-gray-300 text-sm space-y-2">
              <li>・{({'ar':'ارسم تعبيرات واضحة','en':'Draw clear expressions','ja':'キャラクターの表情をしっかり描こう','zh':'画出清晰的表情','hi':'स्पष्ट भाव-भंगिमा बनाएं','vi':'Vẽ biểu cảm rõ ràng','es':'Dibuja expresiones claras'}[lang as string] || 'Draw clear expressions')}</li>
              <li>・{lang==='ar'?'اكتب الحوار في بالونات الكلام':lang==='en'?'Write dialogue in speech bubbles':'セリフは吹き出しの中に書こう'}</li>
              <li>・{({'ar':'ارسم خلفية بسيطة','en':'Add a simple background','ja':'背景も簡単でいいから描いてみよう','zh':'画个简单的背景','hi':'सरल पृष्ठभूमि जोड़ें','vi':'Thêm nền đơn giản','es':'Añade un fondo simple'}[lang as string] || 'Add a simple background')}</li>
              <li>・{lang==='ar'?'النهاية المضحكة مهمة!':lang==='en'?'The punchline in panel 4 matters!':'4コマ目のオチが大事！'}</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <button onClick={downloadTemplate} className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl font-bold transition flex-1">
              {t.download}
            </button>
            <label className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold transition flex-1 text-center cursor-pointer">
              📤 {tr('manga4.submit')}
              <input type="file" accept="image/*" className="hidden" onChange={handleMangaSubmit} />
            </label>
          </div>
          {submitMsg && (
            <div className={`mt-4 p-4 rounded-xl text-sm ${
              submitMsg.startsWith('✅__')
                ? 'bg-purple-900/50 border border-purple-700'
                : submitMsg.startsWith('❌')
                ? 'bg-red-900/50 border border-red-700 text-red-300'
                : 'bg-gray-800 border border-gray-700 text-gray-300'
            }`}>
              {submitMsg.startsWith('✅__') ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center text-xs font-bold flex-shrink-0">AI</div>
                    <p className="text-purple-300 font-medium text-xs">AI講師のフィードバック</p>
                  </div>
                  <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{submitMsg.replace('✅__', '')}</p>
                  <p className="text-gray-500 text-xs mt-3">✅ 提出完了 · 採点はコースの課題ページから</p>
                </div>
              ) : (
                <p>{submitMsg}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-gradient-to-r from-orange-900 via-red-900 to-pink-900 py-16 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-orange-300 text-sm tracking-widest mb-4">TERRAKOYA 4-KOMA MAKER</p>
          <h1 className="text-4xl font-bold mb-4">{t.title}</h1>
          <p className="text-gray-300 text-lg">{t.sub}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-8 py-12">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">{t.charName}</label>
            <input type="text" value={characterName} onChange={(e) => setCharacterName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-lg" placeholder={t.charPlaceholder} />
          </div>

          <div className="mb-8">
            <label className="block text-sm text-gray-400 mb-2">{t.selectTheme}</label>
            <div className="grid grid-cols-2 gap-3">
              {THEMES.map(th => (
                <button key={th.id} onClick={() => setTheme(th.id)} className={`p-4 rounded-xl text-left transition ${theme === th.id ? 'bg-blue-600 text-white border-2 border-blue-400' : 'bg-slate-800 text-gray-300 hover:bg-slate-700 border-2 border-transparent'}`}>
                  {(lang === 'ar' ? (th as any).labelAr : lang === 'en' ? (th as any).labelEn : (th as any).labelJa)}
                </button>
              ))}
            </div>
          </div>

          <button onClick={generateStories} disabled={loading || !characterName || !theme} className="w-full bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 disabled:opacity-50 px-6 py-4 rounded-xl font-bold text-lg transition">
            {loading ? t.generating : t.generate}
          </button>
        </div>

        {stories.length > 0 && (
          <div className="mt-10 space-y-6">
            <h2 className="text-2xl font-bold text-center mb-6">
              {({'ar':'٣ قصص مقترحة','en':'🎲 3 Story Ideas','ja':'🎲 3つのストーリー案','zh':'🎲 3个故事方案','hi':'🎲 3 कहानी विचार','vi':'🎲 3 ý tưởng câu chuyện','es':'🎲 3 ideas de historia'}[lang as string] || '🎲 3 Story Ideas')}
            </h2>
            {stories.map((story, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500 transition">
                <h3 className="text-xl font-bold mb-4">{story.title}</h3>
                <div className="space-y-2 mb-4">
                  {story.panels.map((panel, j) => (
                    <div key={j} className="flex gap-3 text-sm">
                      <span className="bg-slate-800 text-blue-400 px-2 py-0.5 rounded font-bold">{panelLabels[j]}</span>
                      <span className="text-gray-300">{panel.scene}</span>
                      <span className="text-gray-500">「{panel.dialogue}」</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setSelectedStory(story)} className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold transition">
                  {t.useThis}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}