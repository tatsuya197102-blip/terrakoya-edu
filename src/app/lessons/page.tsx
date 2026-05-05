'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Lesson {
  id: number;
  title: Record<string, string>;
  desc: Record<string, string>;
  category: Record<string, string>;
  duration: string;
  pages: string;
  videoJa: string;
  videoAr: string;
  icon: string;
}

const LESSONS: Lesson[] = [
  { id: 1,  title: { ja: 'キャラクターデザインの描き方①', en: 'Character Design ①', ar: 'رسم تصميم الشخصيات ١' }, desc: { ja: '顔の基本形、目・髪の描き方を学びます。', en: 'Learn basic face shapes, eyes and hair.', ar: 'تعلم الشكل الأساسي للوجه ورسم العيون والشعر.' }, category: { ja: 'キャラクター', en: 'Character', ar: 'الشخصيات' }, duration: '45min', pages: 'P8-19',  videoJa: 'q_CF5Ws6qOs', videoAr: 'Ur_Uz7yrtTM', icon: '🎨' },
  { id: 2,  title: { ja: 'キャラクターデザインの描き方②', en: 'Character Design ②', ar: 'رسم تصميم الشخصيات ٢' }, desc: { ja: '体の描き方、男女の違いを学びます。', en: 'Learn body drawing and gender differences.', ar: 'تعلم رسم الجسم والفرق بين الذكور والإناث.' }, category: { ja: 'キャラクター', en: 'Character', ar: 'الشخصيات' }, duration: '45min', pages: 'P8-19',  videoJa: 'd6pgowwMk_E', videoAr: 'lKzolPKLceQ', icon: '🎨' },
  { id: 3,  title: { ja: 'キャラクターデザインの描き方③', en: 'Character Design ③', ar: 'رسم تصميم الشخصيات ٣' }, desc: { ja: '手・足の描き方、ポージングを学びます。', en: 'Learn hands, feet and posing.', ar: 'تعلم رسم اليدين والقدمين والوضعيات.' }, category: { ja: 'キャラクター', en: 'Character', ar: 'الشخصيات' }, duration: '45min', pages: 'P8-19',  videoJa: '8kiThrEhRJE', videoAr: 'jSlRv--hy9w', icon: '🎨' },
  { id: 4,  title: { ja: 'キャラクターデザインの描き方④', en: 'Character Design ④', ar: 'رسم تصميم الشخصيات ٤' }, desc: { ja: 'キャラクターを描いてみよう！実践編。', en: "Let's draw characters! Practice edition.", ar: 'لنرسم الشخصيات! الجزء العملي.' }, category: { ja: 'キャラクター', en: 'Character', ar: 'الشخصيات' }, duration: '45min', pages: 'P8-19',  videoJa: 'UjgqIKjCzDI', videoAr: 'NPNPOtnCI3E', icon: '🎨' },
  { id: 5,  title: { ja: 'キャラクターデザイン（講座）', en: 'Character Design (Lecture)', ar: 'تصميم الشخصيات (محاضرة)' }, desc: { ja: '浜田ブリトニー先生によるキャラクターデザイン講座。', en: 'Character design lecture by instructor.', ar: 'محاضرة تصميم الشخصيات مع المعلمة.' }, category: { ja: 'キャラクター', en: 'Character', ar: 'الشخصيات' }, duration: '45min', pages: 'P8-19',  videoJa: 'lNTfzORJ390', videoAr: 'PoJ4-Vip6sU', icon: '🎓' },
  { id: 6,  title: { ja: '喜怒哀楽〜感情表現を知ろう', en: 'Emotional Expressions', ar: 'التعبير عن المشاعر' }, desc: { ja: '4つの感情表現を描き分ける方法。', en: 'How to draw 4 types of emotions.', ar: 'تعلم رسم أربعة تعبيرات عاطفية.' }, category: { ja: '表現技法', en: 'Techniques', ar: 'تقنيات التعبير' }, duration: '20min', pages: 'P20-23', videoJa: '7zfUsllB7Lo', videoAr: '7oYAunpuq9Y', icon: '😊' },
  { id: 7,  title: { ja: '効果線の活用', en: 'Effect Lines', ar: 'خطوط التأثير' }, desc: { ja: '流線・集中線など効果線の描き方。', en: 'Speed lines, focus lines and more.', ar: 'تعلم رسم خطوط التأثير.' }, category: { ja: '表現技法', en: 'Techniques', ar: 'تقنيات التعبير' }, duration: '15min', pages: 'P24-25', videoJa: 'NvaIP7T15qQ', videoAr: 'fSJTKUGFEZ8', icon: '💫' },
  { id: 8,  title: { ja: '描き文字を使おう', en: 'Sound Effects', ar: 'المؤثرات الصوتية' }, desc: { ja: 'バン！ドン！など描き文字の使い方。', en: 'How to use manga sound effects.', ar: 'تعلم استخدام المؤثرات الصوتية المرسومة.' }, category: { ja: '表現技法', en: 'Techniques', ar: 'تقنيات التعبير' }, duration: '15min', pages: 'P26-27', videoJa: 'NvaIP7T15qQ', videoAr: 'fSJTKUGFEZ8', icon: '💥' },
  { id: 9,  title: { ja: '背景を描こう', en: 'Drawing Backgrounds', ar: 'رسم الخلفيات' }, desc: { ja: 'パースの基本（一点透視図法など）。', en: 'Perspective basics (1-point perspective etc.)', ar: 'تعلم أساسيات المنظور.' }, category: { ja: '背景・構図', en: 'Backgrounds', ar: 'الخلفيات والتكوين' }, duration: '30min', pages: 'P28-35', videoJa: 'dS6qdOL7QMo', videoAr: 'Rr2rlAGX0UQ', icon: '🏙️' },
  { id: 10, title: { ja: '起承転結とコマ割り', en: 'Story Structure & Panels', ar: 'البنية الدرامية وتقسيم اللوحات' }, desc: { ja: 'ストーリーの基本構造とコマ割り。', en: 'Story structure basics and panel layout.', ar: 'تعلم البنية الأساسية للقصة.' }, category: { ja: 'ストーリー', en: 'Story', ar: 'القصة' }, duration: '30min', pages: 'P36-43', videoJa: 'qGroRIqDCSA', videoAr: 'CtuyK2yF4XE', icon: '📐' },
  { id: 11, title: { ja: 'コマ割り（講座）', en: 'Panel Layout (Lecture)', ar: 'تقسيم اللوحات (محاضرة)' }, desc: { ja: '浜田ブリトニー先生によるコマ割り講座。', en: 'Panel layout lecture by instructor.', ar: 'محاضرة تقسيم اللوحات مع المعلمة.' }, category: { ja: 'ストーリー', en: 'Story', ar: 'القصة' }, duration: '30min', pages: 'P36-43', videoJa: 'cCCda4FKI78', videoAr: '8zvzNxbMbYA', icon: '🎓' },
  { id: 12, title: { ja: '4コマ漫画を描いてみよう', en: 'Drawing 4-Koma Manga', ar: 'رسم مانغا 4 لوحات' }, desc: { ja: '起承転結を4コマで表現する。', en: 'Express a story in 4 panels.', ar: 'تعلم التعبير عن القصة في 4 لوحات.' }, category: { ja: 'ストーリー', en: 'Story', ar: 'القصة' }, duration: '25min', pages: 'P44-47', videoJa: '_Jm9hf8y2BM', videoAr: 'y6yebS0WXZw', icon: '📝' },
  { id: 13, title: { ja: 'パラパラ漫画・アニメーション', en: 'Flipbook Animation', ar: 'رسوم متحركة بالورق' }, desc: { ja: 'アニメーションの基本原理を学ぶ。', en: 'Learn the basic principles of animation.', ar: 'تعلم المبادئ الأساسية للرسوم المتحركة.' }, category: { ja: 'アニメーション', en: 'Animation', ar: 'الرسوم المتحركة' }, duration: '25min', pages: 'P48-53', videoJa: 'a2Pk92FbYVY', videoAr: '1AOKDO_5dTk', icon: '🎬' },
  { id: 14, title: { ja: 'CLIP STUDIO DEBUT', en: 'CLIP STUDIO DEBUT', ar: 'CLIP STUDIO DEBUT' }, desc: { ja: 'デジタル作画ソフトの基本ツール。', en: 'Basic tools of digital drawing software.', ar: 'تعلم استخدام الأدوات الأساسية.' }, category: { ja: 'デジタル', en: 'Digital', ar: 'الرقمي' }, duration: '30min', pages: 'P60-65', videoJa: '', videoAr: '', icon: '🖥️' },
  { id: 15, title: { ja: '漫画の塗り方①　白黒編', en: 'Coloring Manga ① B&W', ar: 'تلوين المانغا ① الأبيض والأسود' }, desc: { ja: 'ベタ・トーン・ハッチングなどアナログ黒白表現を学ぼう。', en: 'Learn analog B&W techniques: solid fills, tones and hatching.', ar: 'تعلم أساليب الأبيض والأسود: التعبئة والظلال والتظليل.' }, category: { ja: '表現技法', en: 'Techniques', ar: 'تقنيات التعبير' }, duration: '40min', pages: '', videoJa: '', videoAr: '', icon: '🖊️' },
  { id: 16, title: { ja: '漫画の塗り方②　カラー編', en: 'Coloring Manga ② Color', ar: 'تلوين المانغا ② الألوان' }, desc: { ja: '色鉛筆・マーカーを使ったカラー技法を学ぼう。', en: 'Learn coloring techniques using colored pencils and markers.', ar: 'تعلم تقنيات التلوين باستخدام الأقلام الملونة والماركر.' }, category: { ja: '表現技法', en: 'Techniques', ar: 'تقنيات التعبير' }, duration: '40min', pages: '', videoJa: '', videoAr: '', icon: '🎨' },
  { id: 17, title: { ja: 'Webtoon入門　縦スクロール漫画', en: 'Intro to Webtoon', ar: 'مقدمة إلى ويب تون' }, desc: { ja: 'スマホ向け縦読みのコマ割りと構成法を学ぼう。', en: 'Learn vertical scroll panel layout for smartphone reading.', ar: 'تعلم تقسيم اللوحات العمودي للقراءة على الهاتف.' }, category: { ja: 'ストーリー', en: 'Story', ar: 'القصة' }, duration: '35min', pages: '', videoJa: '', videoAr: '', icon: '📱' },
  { id: 18, title: { ja: 'アニメの仕組みを知ろう', en: 'How Animation Works', ar: 'كيف يعمل الأنيمي' }, desc: { ja: '1秒24コマの原理・中割り・原画の役割を学ぼう。', en: 'Learn about 24fps principles, in-betweening and key animation.', ar: 'تعلم مبدأ 24 إطاراً في الثانية والرسم الوسيط والإطارات الرئيسية.' }, category: { ja: 'アニメーション', en: 'Animation', ar: 'الرسوم المتحركة' }, duration: '45min', pages: '', videoJa: '', videoAr: '', icon: '🎬' },
  { id: 19, title: { ja: '原画を描いてみよう', en: 'Draw Key Animation', ar: 'ارسم الإطارات الرئيسية' }, desc: { ja: '動きのキーポーズを紙に描く実践をしよう。', en: 'Practice drawing key poses for movement on paper.', ar: 'تدرب على رسم الأوضاع الرئيسية للحركة على الورق.' }, category: { ja: 'アニメーション', en: 'Animation', ar: 'الرسوم المتحركة' }, duration: '45min', pages: '', videoJa: '', videoAr: '', icon: '✏️' },
  { id: 20, title: { ja: 'アニメ背景の描き方', en: 'Drawing Anime Backgrounds', ar: 'رسم خلفيات الأنيمي' }, desc: { ja: '空・草原・部屋など場面別のアナログ背景を描こう。', en: 'Draw analog backgrounds for sky, field, room and more.', ar: 'ارسم خلفيات يدوية للسماء والحقل والغرفة وغيرها.' }, category: { ja: '背景・構図', en: 'Backgrounds', ar: 'الخلفيات والتكوين' }, duration: '40min', pages: '', videoJa: '', videoAr: '', icon: '🏞️' },
  { id: 21, title: { ja: 'キャラクターに衣装をつけよう', en: 'Dress Up Your Character', ar: 'ألبس شخصيتك' }, desc: { ja: '制服・和服・アラブ衣装など多文化デザインを学ぼう。', en: 'Design multicultural costumes: uniforms, kimono, Arabic dress and more.', ar: 'صمم أزياء متعددة الثقافات: الزي المدرسي والكيمونو والزي العربي.' }, category: { ja: 'キャラクター', en: 'Character', ar: 'الشخصيات' }, duration: '40min', pages: '', videoJa: '', videoAr: '', icon: '👘' },
  { id: 22, title: { ja: 'オリジナルキャラクターを作ろう', en: 'Create Your Original Character', ar: 'أنشئ شخصيتك الأصلية' }, desc: { ja: '設定シート・性格・バックストーリーの作り方を学ぼう。', en: 'Learn to create a character sheet, personality and backstory.', ar: 'تعلم إنشاء ورقة الشخصية والشخصية والقصة الخلفية.' }, category: { ja: 'キャラクター', en: 'Character', ar: 'الشخصيات' }, duration: '45min', pages: '', videoJa: '', videoAr: '', icon: '⭐' },
  { id: 23, title: { ja: 'ペンタブ入門（デジタル体験）', en: 'Intro to Pen Tablet', ar: 'مقدمة إلى القلم الرقمي' }, desc: { ja: 'ペンタブの持ち方・線の引き方・基本操作を学ぼう。', en: 'Learn how to hold and use a pen tablet for basic digital drawing.', ar: 'تعلم كيفية الإمساك بالقلم الرقمي واستخدامه للرسم الأساسي.' }, category: { ja: 'デジタル', en: 'Digital', ar: 'الرقمي' }, duration: '35min', pages: '', videoJa: '', videoAr: '', icon: '🖱️' },
  { id: 24, title: { ja: 'CLIP STUDIO基礎②　色塗り編', en: 'CLIP STUDIO ② Coloring', ar: 'CLIP STUDIO ② التلوين' }, desc: { ja: 'アニメ塗り・グラデーション実践に挑戦しよう。', en: 'Practice anime-style coloring and gradients in CLIP STUDIO.', ar: 'تدرب على التلوين بأسلوب الأنيمي والتدرج اللوني في CLIP STUDIO.' }, category: { ja: 'デジタル', en: 'Digital', ar: 'الرقمي' }, duration: '40min', pages: '', videoJa: '', videoAr: '', icon: '🖌️' },
];

export default function LessonsPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'ja' | 'en' | 'ar';
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Lesson | null>(null);

  const cats = [
    { id: 'all',       label: { ja: 'すべて',        en: 'All',        ar: 'الكل' } },
    { id: 'character', label: { ja: 'キャラクター',  en: 'Character',  ar: 'الشخصيات' } },
    { id: 'technique', label: { ja: '表現技法',      en: 'Techniques', ar: 'تقنيات' } },
    { id: 'bg',        label: { ja: '背景・構図',    en: 'Backgrounds',ar: 'الخلفيات' } },
    { id: 'story',     label: { ja: 'ストーリー',    en: 'Story',      ar: 'القصة' } },
    { id: 'animation', label: { ja: 'アニメーション',en: 'Animation',  ar: 'الرسوم المتحركة' } },
    { id: 'digital',   label: { ja: 'デジタル',      en: 'Digital',    ar: 'الرقمي' } },
  ];

  const catMap: Record<string, string[]> = {
    character: ['キャラクター'], technique: ['表現技法'],
    bg: ['背景・構図'], story: ['ストーリー'],
    animation: ['アニメーション'], digital: ['デジタル'],
  };

  const filtered = filter === 'all' ? LESSONS
    : LESSONS.filter(l => catMap[filter]?.includes(l.category.ja));

  const getVideo = (l: Lesson) => lang === 'ar' ? l.videoAr : l.videoJa;

  if (selected) {
    return (
      <div className="min-h-screen bg-slate-950 text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-4xl mx-auto px-8 py-8">
          <button onClick={() => setSelected(null)} className="text-blue-400 hover:underline mb-6 block">
            ← {{'ar':'العودة للقائمة','en':'Back to List','ja':'レッスン一覧に戻る','zh':'返回列表','hi':'सूची पर वापस','vi':'Quay lại danh sách','es':'Volver a la lista'}[lang as string] || 'Back to List'}
          </button>
          <div className="mb-6">
            <span className="text-4xl mr-3">{selected.icon}</span>
            <h1 className="text-3xl font-bold inline">{selected.title[lang] || selected.title.ja}</h1>
          </div>
          <div className="flex gap-4 mb-6 text-sm text-gray-400 flex-wrap">
            <span className="bg-slate-800 px-3 py-1 rounded-full">⏱️ {selected.duration}</span>
            <span className="bg-slate-800 px-3 py-1 rounded-full">📖 {selected.pages}</span>
            <span className="bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full">{selected.category[lang] || selected.category.ja}</span>
          </div>
          <div className="aspect-video rounded-2xl overflow-hidden mb-8 bg-black">
            {getVideo(selected) ? (
              <iframe src={'https://www.youtube.com/embed/' + getVideo(selected)}
                title={selected.title[lang] || selected.title.ja}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-900">
                <div className="text-center">
                  <p className="text-6xl mb-4">🎬</p>
                  <p className="text-gray-400 text-lg">
                    {{'ar':'الفيديو قيد الإعداد','en':'Video coming soon','ja':'動画準備中','zh':'视频即将上线','hi':'वीडियो जल्द आएगा','vi':'Video sắp ra mắt','es':'Video próximamente'}[lang as string] || 'Video coming soon'}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-3">
              {{'ar':'وصف الدرس','en':'Lesson Description','ja':'レッスン内容','zh':'课程描述','hi':'पाठ विवरण','vi':'Mô tả bài học','es':'Descripción de la lección'}[lang as string] || 'Lesson Description'}
            </h2>
            <p className="text-gray-300 leading-relaxed">{selected.desc[lang] || selected.desc.ja}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-gradient-to-r from-purple-900 via-pink-900 to-red-900 py-16 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-purple-300 text-sm tracking-widest mb-4">TERRAKOYA LESSONS</p>
          <h1 className="text-4xl font-bold mb-4">
            {{'ar':'كتاب المانغا - دروس الفيديو','en':'Manga Textbook - Video Lessons','ja':'マンガの教科書 - レッスン動画','zh':'漫画教科书 - 视频课程','hi':'मंगा पाठ्यपुस्तक - वीडियो पाठ','vi':'Sách giáo khoa Manga - Bài học video','es':'Manual de Manga - Lecciones en video'}[lang as string] || 'Manga Textbook - Video Lessons'}
          </h1>
          <p className="text-gray-300">
            {{'ar':'تعلم خطوة بخطوة مع فيديوهات يوتيوب','en':'Learn step by step with YouTube videos','ja':'YouTube動画でステップバイステップで学ぼう','zh':'通过YouTube视频一步步学习','hi':'YouTube वीडियो के साथ चरण दर चरण सीखें','vi':'Học từng bước với video YouTube','es':'Aprende paso a paso con videos de YouTube'}[lang as string] || 'Learn step by step with YouTube videos'}
          </p>
          <p className="text-purple-300 text-sm mt-2">
            {`${LESSONS.length} ${{ar:'درس',en:'lessons',ja:'レッスン'}[lang as string] || 'lessons'}`}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide" style={{scrollbarWidth:'none'}}>
          {cats.map(c => (
            <button key={c.id} onClick={() => setFilter(c.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
                filter === c.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}>
              {c.label[lang as 'ja' | 'en' | 'ar'] || c.label.ja}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map(lesson => (
            <button key={lesson.id} onClick={() => setSelected(lesson)}
              className="w-full text-left bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-blue-500 transition group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl flex-shrink-0">
                  {lesson.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs text-blue-400 font-medium">
                      Lesson {lesson.id} · {lesson.category[lang] || lesson.category.ja}
                    </span>
                  </div>
                  <h3 className="font-bold text-white group-hover:text-blue-300 transition truncate">
                    {lesson.title[lang] || lesson.title.ja}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1 truncate">{lesson.desc[lang] || lesson.desc.ja}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-500">⏱️ {lesson.duration}</p>
                  <p className="text-xs text-gray-500 mt-1">📖 {lesson.pages}</p>
                </div>
                <span className="text-blue-400 group-hover:text-blue-300 transition text-xl">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
