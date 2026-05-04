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
];

export default function LessonsPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'ja' | 'en' | 'ar';
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Lesson | null>(null);

  const cats = [
    { id: 'all',       label: { ja: 'すべて',        en: 'All',        ar: 'الكل'         } },
    { id: 'character', label: { ja: 'キャラクター',  en: 'Character',  ar: 'الشخصيات'     } },
    { id: 'technique', label: { ja: '表現技法',      en: 'Techniques', ar: 'تقنيات'        } },
    { id: 'bg',        label: { ja: '背景・構図',    en: 'Backgrounds',ar: 'الخلفيات'      } },
    { id: 'story',     label: { ja: 'ストーリー',    en: 'Story',      ar: 'القصة'          } },
    { id: 'animation', label: { ja: 'アニメーション',en: 'Animation',  ar: 'الرسوم المتحركة'} },
    { id: 'digital',   label: { ja: 'デジタル',      en: 'Digital',    ar: 'الرقمي'        } },
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
            ← {lang === 'ar' ? 'العودة للقائمة' : lang === 'en' ? 'Back to List' : 'レッスン一覧に戻る'}
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
                    {lang === 'ar' ? 'الفيديو قيد الإعداد' : lang === 'en' ? 'Video coming soon' : '動画準備中'}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-3">
              {lang === 'ar' ? 'وصف الدرس' : lang === 'en' ? 'Lesson Description' : 'レッスン内容'}
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
            {lang === 'ar' ? 'كتاب المانغا - دروس الفيديو' : lang === 'en' ? 'Manga Textbook - Video Lessons' : 'マンガの教科書 - レッスン動画'}
          </h1>
          <p className="text-gray-300">
            {lang === 'ar' ? 'تعلم خطوة بخطوة مع فيديوهات يوتيوب' : lang === 'en' ? 'Learn step by step with YouTube videos' : 'YouTube動画でステップバイステップで学ぼう'}
          </p>
          <p className="text-purple-300 text-sm mt-2">
            {lang === 'ar' ? `${LESSONS.length} درساً` : lang === 'en' ? `${LESSONS.length} lessons` : `全${LESSONS.length}レッスン`}
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
