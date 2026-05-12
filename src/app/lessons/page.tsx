'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type LangText = { ja: string; en: string; ar: string };

interface Lesson {
  id: number;
  title: LangText;
  desc: LangText;
  categoryKey: 'character' | 'technique' | 'background' | 'story' | 'animation' | 'digital';
  durationMinutes: number;
  pageRange: string;
  videoJa: string;
  videoEn?: string;
  videoAr: string;
  icon: string;
}

const LESSONS: Lesson[] = [
  {
    id: 1,
    title: {
      ja: 'キャラクターデザインの描き方①',
      en: 'How to Draw Character Design (1)',
      ar: 'كيفية رسم تصميم الشخصيات ١',
    },
    desc: {
      ja: '顔の基本形、目・髪の描き方を学びます。',
      en: 'Learn the basic shape of the face and how to draw eyes and hair.',
      ar: 'تعلم الشكل الأساسي للوجه ورسم العيون والشعر.',
    },
    categoryKey: 'character', durationMinutes: 45, pageRange: '8-19',
    videoJa: 'q_CF5Ws6qOs', videoAr: 'Ur_Uz7yrtTM', icon: '🎨',
  },
  {
    id: 2,
    title: {
      ja: 'キャラクターデザインの描き方②',
      en: 'How to Draw Character Design (2)',
      ar: 'كيفية رسم تصميم الشخصيات ٢',
    },
    desc: {
      ja: '体の描き方、男女の違いを学びます。',
      en: 'Learn how to draw the body and gender differences.',
      ar: 'تعلم رسم الجسم والفرق بين الذكور والإناث.',
    },
    categoryKey: 'character', durationMinutes: 45, pageRange: '8-19',
    videoJa: 'd6pgowwMk_E', videoAr: 'lKzolPKLceQ', icon: '🎨',
  },
  {
    id: 3,
    title: {
      ja: 'キャラクターデザインの描き方③',
      en: 'How to Draw Character Design (3)',
      ar: 'كيفية رسم تصميم الشخصيات ٣',
    },
    desc: {
      ja: '手・足の描き方、ポージングを学びます。',
      en: 'Learn how to draw hands, feet, and posing.',
      ar: 'تعلم رسم اليدين والقدمين والوضعيات.',
    },
    categoryKey: 'character', durationMinutes: 45, pageRange: '8-19',
    videoJa: '8kiThrEhRJE', videoAr: 'jSlRv--hy9w', icon: '🎨',
  },
  {
    id: 4,
    title: {
      ja: 'キャラクターデザインの描き方④',
      en: 'How to Draw Character Design (4)',
      ar: 'كيفية رسم تصميم الشخصيات ٤',
    },
    desc: {
      ja: 'キャラクターを描いてみよう！実践編。',
      en: "Let's draw characters! Practical edition.",
      ar: 'لنرسم الشخصيات! الجزء العملي.',
    },
    categoryKey: 'character', durationMinutes: 45, pageRange: '8-19',
    videoJa: 'UjgqIKjCzDI', videoAr: 'NPNPOtnCI3E', icon: '🎨',
  },
  {
    id: 5,
    title: {
      ja: 'キャラクターデザインの描き方（講座）',
      en: 'Character Design Lecture',
      ar: 'كيفية رسم تصميم الشخصيات (محاضرة)',
    },
    desc: {
      ja: '浜田ブリトニー先生によるキャラクターデザイン講座。',
      en: 'Character design lecture by Brittany Hamada.',
      ar: 'محاضرة تصميم الشخصيات مع المعلمة.',
    },
    categoryKey: 'character', durationMinutes: 45, pageRange: '8-19',
    videoJa: 'lNTfzORJ390', videoAr: 'PoJ4-Vip6sU', icon: '🎓',
  },
  {
    id: 6,
    title: {
      ja: '喜怒哀楽〜感情表現を知ろう',
      en: 'Expressing Emotions: Joy, Anger, Sadness, Happiness',
      ar: 'تعلم التعبير عن المشاعر',
    },
    desc: {
      ja: '喜び・怒り・哀しみ・楽しみの4つの感情表現を描き分ける方法。',
      en: 'How to draw four emotional expressions: joy, anger, sadness, and happiness.',
      ar: 'تعلم رسم أربعة تعبيرات عاطفية: الفرح والغضب والحزن والسعادة.',
    },
    categoryKey: 'technique', durationMinutes: 20, pageRange: '20-23',
    videoJa: '7zfUsllB7Lo', videoAr: '7oYAunpuq9Y', icon: '😊',
  },
  {
    id: 7,
    title: {
      ja: '効果線の活用',
      en: 'Using Effect Lines',
      ar: 'استخدام خطوط التأثير',
    },
    desc: {
      ja: '流線、カケアミ、集中線など、マンガの表現力を高める効果線の描き方。',
      en: 'How to draw effect lines like speed lines, hatching, and focus lines.',
      ar: 'تعلم رسم خطوط التأثير مثل خطوط السرعة والتظليل المتقاطع.',
    },
    categoryKey: 'technique', durationMinutes: 15, pageRange: '24-25',
    videoJa: 'NvaIP7T15qQ', videoAr: 'fSJTKUGFEZ8', icon: '💫',
  },
  {
    id: 8,
    title: {
      ja: '描き文字を使おう',
      en: 'Using Onomatopoeia',
      ar: 'استخدام المؤثرات الصوتية',
    },
    desc: {
      ja: 'バン！ドン！など、描き文字（オノマトペ）の使い方。',
      en: 'How to use drawn sound effects like Bang! and Boom!',
      ar: 'تعلم استخدام المؤثرات الصوتية المرسومة.',
    },
    categoryKey: 'technique', durationMinutes: 15, pageRange: '26-27',
    videoJa: 'NvaIP7T15qQ', videoAr: 'fSJTKUGFEZ8', icon: '💥',
  },
  {
    id: 9,
    title: {
      ja: '背景を描こう',
      en: "Let's Draw Backgrounds",
      ar: 'لنرسم الخلفيات',
    },
    desc: {
      ja: 'アイレベル、消失点、一点透視図法など、パースの基本を学びます。',
      en: 'Learn perspective basics: eye level, vanishing point, one-point perspective.',
      ar: 'تعلم أساسيات المنظور مثل مستوى العين ونقطة التلاشي.',
    },
    categoryKey: 'background', durationMinutes: 30, pageRange: '28-35',
    videoJa: 'dS6qdOL7QMo', videoAr: 'Rr2rlAGX0UQ', icon: '🏙️',
  },
  {
    id: 10,
    title: {
      ja: '起承転結って何？コマ割りを知ろう',
      en: 'What is Story Structure? Learning Panel Layout',
      ar: 'ما هي البنية الدرامية؟ تعلم تقسيم اللوحات',
    },
    desc: {
      ja: 'ストーリーの基本構造とコマ割りのテクニック。',
      en: 'Basic story structure and panel layout techniques.',
      ar: 'تعلم البنية الأساسية للقصة وتقنيات تقسيم اللوحات.',
    },
    categoryKey: 'story', durationMinutes: 30, pageRange: '36-43',
    videoJa: 'qGroRIqDCSA', videoAr: 'CtuyK2yF4XE', icon: '📐',
  },
  {
    id: 11,
    title: {
      ja: '起承転結って何？コマ割りを知ろう（講座）',
      en: 'Story Structure & Panel Layout (Lecture)',
      ar: 'البنية الدرامية وتقسيم اللوحات (محاضرة)',
    },
    desc: {
      ja: '浜田ブリトニー先生による起承転結・コマ割り講座。',
      en: 'Lecture on story structure and panel layout.',
      ar: 'محاضرة البنية الدرامية وتقسيم اللوحات مع المعلمة.',
    },
    categoryKey: 'story', durationMinutes: 30, pageRange: '36-43',
    videoJa: 'cCCda4FKI78', videoAr: '8zvzNxbMbYA', icon: '🎓',
  },
  {
    id: 12,
    title: {
      ja: '4コマ漫画を描いてみよう',
      en: "Let's Draw a 4-Panel Manga",
      ar: 'لنرسم مانجا من 4 لوحات',
    },
    desc: {
      ja: '起承転結を4コマで表現し、オリジナル4コマ漫画を描きます。',
      en: 'Express story structure in 4 panels and create an original 4-panel manga.',
      ar: 'تعلم التعبير عن البنية الدرامية في 4 لوحات.',
    },
    categoryKey: 'story', durationMinutes: 25, pageRange: '44-47',
    videoJa: '_Jm9hf8y2BM', videoAr: 'y6yebS0WXZw', icon: '📝',
  },
  {
    id: 13,
    title: {
      ja: 'キャラクターが動く仕組み・パラパラ漫画',
      en: 'How Characters Move: Flipbook Animation',
      ar: 'آلية حركة الشخصيات - رسوم متحركة بالورق',
    },
    desc: {
      ja: 'アニメーションの基本原理を学び、パラパラ漫画を作ります。',
      en: 'Learn the basic principles of animation and create a flipbook.',
      ar: 'تعلم المبادئ الأساسية للرسوم المتحركة واصنع كتاب قلب.',
    },
    categoryKey: 'animation', durationMinutes: 25, pageRange: '48-53',
    videoJa: 'a2Pk92FbYVY', videoAr: '1AOKDO_5dTk', icon: '🎬',
  },
  {
    id: 14,
    title: {
      ja: 'CLIP STUDIO DEBUTの楽しみ方',
      en: 'How to Enjoy CLIP STUDIO DEBUT',
      ar: 'كيفية الاستمتاع بـ CLIP STUDIO DEBUT',
    },
    desc: {
      ja: 'デジタル作画ソフトの基本ツールの使い方を学びます。（これから作成）',
      en: 'Learn how to use the basic tools of digital drawing software. (Coming soon)',
      ar: 'تعلم استخدام الأدوات الأساسية لبرنامج الرسم الرقمي. (قيد الإعداد)',
    },
    categoryKey: 'digital', durationMinutes: 30, pageRange: '60-65',
    videoJa: '', videoAr: '', icon: '🖥️',
  },
];

export default function LessonsPage() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'ja') as 'ja' | 'en' | 'ar';
  const isRtl = lang === 'ar';
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Lesson | null>(null);

  const categoryKeys: Array<'all' | Lesson['categoryKey']> = ['all', 'character', 'technique', 'background', 'story', 'animation', 'digital'];

  const filtered = filter === 'all' ? LESSONS : LESSONS.filter(l => l.categoryKey === filter);
  const getTitle = (l: Lesson) => l.title[lang] || l.title.ja;
  const getDesc = (l: Lesson) => l.desc[lang] || l.desc.ja;
  const getVideo = (l: Lesson) => {
    if (lang === 'ar' && l.videoAr) return l.videoAr;
    if (lang === 'en' && l.videoEn) return l.videoEn;
    return l.videoJa;
  };
  const getCategoryLabel = (key: 'all' | Lesson['categoryKey']) => t(`lessons.categories.${key}`);
  const arrowForward = isRtl ? '←' : '→';
  const arrowBackward = isRtl ? '→' : '←';

  if (selected) {
    return (
      <div className="min-h-screen bg-slate-950 text-white" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="max-w-4xl mx-auto px-8 py-8">
          <button onClick={() => setSelected(null)} className="text-blue-400 hover:underline mb-6 block">
            {arrowBackward} {t('lessons.backToList').replace('←', '').replace('→', '').trim()}
          </button>
          <div className="mb-6">
            <span className="text-4xl me-3">{selected.icon}</span>
            <h1 className="text-3xl font-bold inline">{getTitle(selected)}</h1>
          </div>
          <div className="flex gap-4 mb-6 text-sm text-gray-400 flex-wrap">
            <span className="bg-slate-800 px-3 py-1 rounded-full">
              ⏱️ {t('lessons.duration_minutes', { count: selected.durationMinutes })}
            </span>
            <span className="bg-slate-800 px-3 py-1 rounded-full">
              📖 {t('lessons.pages', { range: selected.pageRange })}
            </span>
            <span className="bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full">
              {getCategoryLabel(selected.categoryKey)}
            </span>
          </div>
          <div className="aspect-video rounded-2xl overflow-hidden mb-8 bg-black">
            {getVideo(selected) ? (
              <iframe
                src={'https://www.youtube.com/embed/' + getVideo(selected)}
                title={getTitle(selected)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-900">
                <div className="text-center">
                  <p className="text-6xl mb-4">🎬</p>
                  <p className="text-gray-400 text-lg">{t('lessons.videoComingSoon')}</p>
                </div>
              </div>
            )}
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold mb-3">{t('lessons.lessonContent')}</h2>
            <p className="text-gray-300 leading-relaxed">{getDesc(selected)}</p>
          </div>
          <div className="flex gap-4 flex-wrap">
            <a href="/submissions" className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold transition flex-1 text-center">
              {t('lessons.submitAssignment')}
            </a>
            {selected.id < LESSONS.length && (
              <button
                onClick={() => setSelected(LESSONS[LESSONS.findIndex(l => l.id === selected.id) + 1])}
                className="bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-xl font-bold transition"
              >
                {t('lessons.nextLesson').replace('→', arrowForward).replace('←', arrowForward)}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-gradient-to-r from-pink-900 via-purple-900 to-blue-900 py-16 px-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-pink-300 text-sm tracking-widest mb-4">TERRAKOYA LESSONS</p>
          <h1 className="text-4xl font-bold mb-4">{t('lessons.pageHeading')}</h1>
          <p className="text-gray-300 text-lg">{t('lessons.pageSubtitle')}</p>
          <p className="text-gray-400 mt-2">{t('lessons.totalCount', { count: LESSONS.length })}</p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="flex gap-2 mb-10 justify-center flex-wrap">
          {categoryKeys.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${filter === cat ? 'bg-blue-600 text-white' : 'bg-slate-800 text-gray-300 hover:bg-slate-700'}`}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>
        <div className="space-y-4">
          {filtered.map(lesson => (
            <div
              key={lesson.id}
              onClick={() => setSelected(lesson)}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-2xl group-hover:bg-blue-900 transition">
                  {lesson.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="text-blue-400 text-sm font-bold">
                      {t('lessons.lessonNumber', { num: lesson.id })}
                    </span>
                    <span className="bg-slate-800 text-gray-400 text-xs px-2 py-0.5 rounded">
                      {getCategoryLabel(lesson.categoryKey)}
                    </span>
                    {!lesson.videoJa && (
                      <span className="bg-yellow-900/50 text-yellow-300 text-xs px-2 py-0.5 rounded">
                        {t('lessons.videoPreparation')}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold group-hover:text-blue-300 transition">{getTitle(lesson)}</h3>
                  <p className="text-gray-400 text-sm mt-1">{getDesc(lesson)}</p>
                </div>
                <div className="text-end hidden md:block">
                  <p className="text-gray-400 text-sm">⏱️ {t('lessons.duration_minutes', { count: lesson.durationMinutes })}</p>
                  <p className="text-gray-500 text-xs">📖 {t('lessons.pages', { range: lesson.pageRange })}</p>
                </div>
                <div className="text-blue-400 text-xl">{arrowForward}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
