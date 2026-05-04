'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Lesson {
  id: number;
  titleJa: string;
  titleAr: string;
  descJa: string;
  descAr: string;
  category: string;
  duration: string;
  pages: string;
  videoJa: string;
  videoAr: string;
  icon: string;
}

const LESSONS: Lesson[] = [
  { id: 1, titleJa: 'キャラクターデザインの描き方①', titleAr: 'كيفية رسم تصميم الشخصيات ١', descJa: '顔の基本形、目・髪の描き方を学びます。', descAr: 'تعلم الشكل الأساسي للوجه ورسم العيون والشعر.', category: 'キャラクター', duration: '45分', pages: 'P8-19', videoJa: 'q_CF5Ws6qOs', videoAr: 'Ur_Uz7yrtTM', icon: '🎨' },
  { id: 2, titleJa: 'キャラクターデザインの描き方②', titleAr: 'كيفية رسم تصميم الشخصيات ٢', descJa: '体の描き方、男女の違いを学びます。', descAr: 'تعلم رسم الجسم والفرق بين الذكور والإناث.', category: 'キャラクター', duration: '45分', pages: 'P8-19', videoJa: 'd6pgowwMk_E', videoAr: 'lKzolPKLceQ', icon: '🎨' },
  { id: 3, titleJa: 'キャラクターデザインの描き方③', titleAr: 'كيفية رسم تصميم الشخصيات ٣', descJa: '手・足の描き方、ポージングを学びます。', descAr: 'تعلم رسم اليدين والقدمين والوضعيات.', category: 'キャラクター', duration: '45分', pages: 'P8-19', videoJa: '8kiThrEhRJE', videoAr: 'jSlRv--hy9w', icon: '🎨' },
  { id: 4, titleJa: 'キャラクターデザインの描き方④', titleAr: 'كيفية رسم تصميم الشخصيات ٤', descJa: 'キャラクターを描いてみよう！実践編。', descAr: 'لنرسم الشخصيات! الجزء العملي.', category: 'キャラクター', duration: '45分', pages: 'P8-19', videoJa: 'UjgqIKjCzDI', videoAr: 'NPNPOtnCI3E', icon: '🎨' },
  { id: 5, titleJa: 'キャラクターデザインの描き方（講座）', titleAr: 'كيفية رسم تصميم الشخصيات (محاضرة)', descJa: '浜田ブリトニー先生によるキャラクターデザイン講座。', descAr: 'محاضرة تصميم الشخصيات مع المعلمة.', category: 'キャラクター', duration: '45分', pages: 'P8-19', videoJa: 'lNTfzORJ390', videoAr: 'PoJ4-Vip6sU', icon: '🎓' },
  { id: 6, titleJa: '喜怒哀楽〜感情表現を知ろう', titleAr: 'تعلم التعبير عن المشاعر', descJa: '喜び・怒り・哀しみ・楽しみの4つの感情表現を描き分ける方法。', descAr: 'تعلم رسم أربعة تعبيرات عاطفية: الفرح والغضب والحزن والسعادة.', category: '表現技法', duration: '20分', pages: 'P20-23', videoJa: '7zfUsllB7Lo', videoAr: '7oYAunpuq9Y', icon: '😊' },
  { id: 7, titleJa: '効果線の活用', titleAr: 'استخدام خطوط التأثير', descJa: '流線、カケアミ、集中線など、マンガの表現力を高める効果線の描き方。', descAr: 'تعلم رسم خطوط التأثير مثل خطوط السرعة والتظليل المتقاطع.', category: '表現技法', duration: '15分', pages: 'P24-25', videoJa: 'NvaIP7T15qQ', videoAr: 'fSJTKUGFEZ8', icon: '💫' },
  { id: 8, titleJa: '描き文字を使おう', titleAr: 'استخدام المؤثرات الصوتية', descJa: 'バン！ドン！など、描き文字（オノマトペ）の使い方。', descAr: 'تعلم استخدام المؤثرات الصوتية المرسومة.', category: '表現技法', duration: '15分', pages: 'P26-27', videoJa: 'NvaIP7T15qQ', videoAr: 'fSJTKUGFEZ8', icon: '💥' },
  { id: 9, titleJa: '背景を描こう', titleAr: 'لنرسم الخلفيات', descJa: 'アイレベル、消失点、一点透視図法など、パースの基本を学びます。', descAr: 'تعلم أساسيات المنظور مثل مستوى العين ونقطة التلاشي.', category: '背景・構図', duration: '30分', pages: 'P28-35', videoJa: 'dS6qdOL7QMo', videoAr: 'Rr2rlAGX0UQ', icon: '🏙️' },
  { id: 10, titleJa: '起承転結って何？コマ割りを知ろう', titleAr: 'ما هي البنية الدرامية؟ تعلم تقسيم اللوحات', descJa: 'ストーリーの基本構造とコマ割りのテクニック。', descAr: 'تعلم البنية الأساسية للقصة وتقنيات تقسيم اللوحات.', category: 'ストーリー', duration: '30分', pages: 'P36-43', videoJa: 'qGroRIqDCSA', videoAr: 'CtuyK2yF4XE', icon: '📐' },
  { id: 11, titleJa: '起承転結って何？コマ割りを知ろう（講座）', titleAr: 'البنية الدرامية وتقسيم اللوحات (محاضرة)', descJa: '浜田ブリトニー先生による起承転結・コマ割り講座。', descAr: 'محاضرة البنية الدرامية وتقسيم اللوحات مع المعلمة.', category: 'ストーリー', duration: '30分', pages: 'P36-43', videoJa: 'cCCda4FKI78', videoAr: '8zvzNxbMbYA', icon: '🎓' },
  { id: 12, titleJa: '4コマ漫画を描いてみよう', titleAr: 'لنرسم مانجا من 4 لوحات', descJa: '起承転結を4コマで表現し、オリジナル4コマ漫画を描きます。', descAr: 'تعلم التعبير عن البنية الدرامية في 4 لوحات.', category: 'ストーリー', duration: '25分', pages: 'P44-47', videoJa: '_Jm9hf8y2BM', videoAr: 'y6yebS0WXZw', icon: '📝' },
  { id: 13, titleJa: '4コマ漫画を描いてみよう（講座）', titleAr: 'لنرسم مانجا من 4 لوحات (محاضرة)', descJa: '浜田ブリトニー先生による4コマ漫画の講座。', descAr: 'محاضرة مانجا من 4 لوحات مع المعلمة.', category: 'ストーリー', duration: '25分', pages: 'P44-47', videoJa: 'cCCda4FKI78', videoAr: '8zvzNxbMbYA', icon: '🎓' },
  { id: 14, titleJa: 'キャラクターが動く仕組み・パラパラ漫画', titleAr: 'آلية حركة الشخصيات - رسوم متحركة بالورق', descJa: 'アニメーションの基本原理を学び、パラパラ漫画を作ります。', descAr: 'تعلم المبادئ الأساسية للرسوم المتحركة واصنع كتاب قلب.', category: 'アニメーション', duration: '25分', pages: 'P48-53', videoJa: 'a2Pk92FbYVY', videoAr: '1AOKDO_5dTk', icon: '🎬' },
  { id: 15, titleJa: 'CLIP STUDIO DEBUTの楽しみ方', titleAr: 'كيفية الاستمتاع بـ CLIP STUDIO DEBUT', descJa: 'デジタル作画ソフトの基本ツールの使い方を学びます。（これから作成）', descAr: 'تعلم استخدام الأدوات الأساسية لبرنامج الرسم الرقمي. (قيد الإعداد)', category: 'デジタル', duration: '30分', pages: 'P60-65', videoJa: '', videoAr: '', icon: '🖥️' },
];

export default function LessonsPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Lesson | null>(null);

  const cats = ['all', 'キャラクター', '表現技法', '背景・構図', 'ストーリー', 'アニメーション', 'デジタル'];
  const filtered = filter === 'all' ? LESSONS : LESSONS.filter(l => l.category === filter);
  const getTitle = (l: Lesson) => lang === 'ar' ? l.titleAr : l.titleJa;
  const getDesc = (l: Lesson) => lang === 'ar' ? l.descAr : l.descJa;
  const getVideo = (l: Lesson) => lang === 'ar' ? l.videoAr : l.videoJa;

  if (selected) {
    return (
      <div className="min-h-screen bg-slate-950 text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-4xl mx-auto px-8 py-8">
          <button onClick={() => setSelected(null)} className="text-blue-400 hover:underline mb-6 block">
            ← {lang === 'ar' ? 'العودة للقائمة' : 'レッスン一覧に戻る'}
          </button>
          <div className="mb-6">
            <span className="text-4xl mr-3">{selected.icon}</span>
            <h1 className="text-3xl font-bold inline">{getTitle(selected)}</h1>
          </div>
          <div className="flex gap-4 mb-6 text-sm text-gray-400">
            <span className="bg-slate-800 px-3 py-1 rounded-full">⏱️ {selected.duration}</span>
            <span className="bg-slate-800 px-3 py-1 rounded-full">📖 {selected.pages}</span>
            <span className="bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full">{selected.category}</span>
          </div>
          <div className="aspect-video rounded-2xl overflow-hidden mb-8 bg-black">
            {getVideo(selected) ? (
              <iframe src={'https://www.youtube.com/embed/' + getVideo(selected)} title={getTitle(selected)} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-900">
                <div className="text-center">
                  <p className="text-6xl mb-4">🎬</p>
                  <p className="text-gray-400 text-lg">{lang === 'ar' ? 'الفيديو قيد الإعداد' : '動画準備中'}</p>
                </div>
              </div>
            )}
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold mb-3">{lang === 'ar' ? 'وصف الدرس' : 'レッスン内容'}</h2>
            <p className="text-gray-300 leading-relaxed">{getDesc(selected)}</p>
          </div>
          <div className="flex gap-4">
            <a href="/submissions" className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold transition flex-1 text-center">
              {lang === 'ar' ? 'تقديم الواجب' : '📤 この課題を提出する'}
            </a>
            {selected.id < LESSONS.length && (
              <button onClick={() => setSelected(LESSONS[LESSONS.findIndex(l => l.id === selected.id) + 1])} className="bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-xl font-bold transition">
                {lang === 'ar' ? 'الدرس التالي ←' : '次のレッスン →'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-gradient-to-r from-pink-900 via-purple-900 to-blue-900 py-16 px-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-pink-300 text-sm tracking-widest mb-4">TERRAKOYA LESSONS</p>
          <h1 className="text-4xl font-bold mb-4">{lang === 'ar' ? 'دروس المانجا' : 'マンガの教科書 - レッスン動画'}</h1>
          <p className="text-gray-300 text-lg">{lang === 'ar' ? 'تعلم رسم المانجا خطوة بخطوة' : 'YouTube動画でステップバイステップで学ぼう'}</p>
          <p className="text-gray-400 mt-2">{lang === 'ar' ? '١٥ درس' : '全15レッスン'}</p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="flex gap-2 mb-10 justify-center flex-wrap">
          {cats.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} className={`px-4 py-2 rounded-full text-sm font-medium transition ${filter === cat ? 'bg-blue-600 text-white' : 'bg-slate-800 text-gray-300 hover:bg-slate-700'}`}>
              {cat === 'all' ? (lang === 'ar' ? 'الكل' : 'すべて') : cat}
            </button>
          ))}
        </div>
        <div className="space-y-4">
          {filtered.map(lesson => (
            <div key={lesson.id} onClick={() => setSelected(lesson)} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-2xl group-hover:bg-blue-900 transition">{lesson.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-blue-400 text-sm font-bold">Lesson {lesson.id}</span>
                    <span className="bg-slate-800 text-gray-400 text-xs px-2 py-0.5 rounded">{lesson.category}</span>
                    {!lesson.videoJa && <span className="bg-yellow-900/50 text-yellow-300 text-xs px-2 py-0.5 rounded">動画準備中</span>}
                  </div>
                  <h3 className="text-lg font-bold group-hover:text-blue-300 transition">{getTitle(lesson)}</h3>
                  <p className="text-gray-400 text-sm mt-1">{getDesc(lesson)}</p>
                </div>
                <div className="text-right hidden md:block">
                  <p className="text-gray-400 text-sm">⏱️ {lesson.duration}</p>
                  <p className="text-gray-500 text-xs">📖 {lesson.pages}</p>
                </div>
                <div className="text-blue-400 text-xl">→</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}