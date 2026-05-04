'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';
import { useTranslation } from 'react-i18next';

const COURSES: Record<string, {
  title: Record<string,string>;
  lessons: { id: string; title: Record<string,string>; duration: string; free: boolean; description: Record<string,string>; videoUrl?: string }[];
}> = {
  'manga-basics': {
    title: { ja: '漫画基礎講座', en: 'Manga Basics', ar: 'أساسيات المانغا' },
    lessons: [
      { id: 'l1', title: { ja: 'キャラクターの描き方基礎', en: 'Character Drawing Basics', ar: 'أساسيات رسم الشخصيات' }, duration: '30min', free: true, description: { ja: 'キャラクターの基本的な描き方を学びます。', en: 'Learn the basics of character drawing.', ar: 'تعلم أساسيات رسم الشخصيات.' }, videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      { id: 'l2', title: { ja: '顔・表情の描き方', en: 'Drawing Faces & Expressions', ar: 'رسم الوجوه والتعبيرات' }, duration: '25min', free: true, description: { ja: '喜怒哀楽の表情を自然に描くコツを学びます。', en: 'Tips for naturally drawing facial expressions.', ar: 'نصائح لرسم تعبيرات الوجه بشكل طبيعي.' } },
      { id: 'l3', title: { ja: '体・ポーズの描き方', en: 'Drawing Bodies & Poses', ar: 'رسم الأجساد والأوضاع' }, duration: '35min', free: false, description: { ja: '動きのあるポーズの描き方を学びます。', en: 'Learn to draw dynamic poses.', ar: 'تعلم رسم الأوضاع الحيوية.' } },
      { id: 'l4', title: { ja: '背景の描き方入門', en: 'Introduction to Backgrounds', ar: 'مقدمة في رسم الخلفيات' }, duration: '40min', free: false, description: { ja: 'キャラクターを引き立てる背景を学びます。', en: 'Learn backgrounds that enhance your characters.', ar: 'تعلم الخلفيات التي تبرز شخصياتك.' } },
      { id: 'l5', title: { ja: 'コマ割りの基礎', en: 'Panel Layout Basics', ar: 'أساسيات تقسيم اللوحات' }, duration: '30min', free: false, description: { ja: '読者を引き込むコマ割りを学びます。', en: 'Learn panel layouts that draw readers in.', ar: 'تعلم تقسيم اللوحات الذي يجذب القراء.' } },
    ],
  },
  'digital-illust': {
    title: { ja: 'デジタルイラスト入門', en: 'Digital Illustration', ar: 'الرسم الرقمي' },
    lessons: [
      { id: 'l1', title: { ja: 'CLIPSTUDIOの基本操作', en: 'CLIPSTUDIO Basics', ar: 'أساسيات CLIPSTUDIO' }, duration: '20min', free: true, description: { ja: 'CLIPSTUDIOの基本を学びます。', en: 'Learn the basics of CLIPSTUDIO.', ar: 'تعلم أساسيات CLIPSTUDIO.' } },
      { id: 'l2', title: { ja: 'レイヤーの使い方', en: 'Using Layers', ar: 'استخدام الطبقات' }, duration: '25min', free: true, description: { ja: 'レイヤーの概念を学びます。', en: 'Learn the concept of layers.', ar: 'تعلم مفهوم الطبقات.' } },
      { id: 'l3', title: { ja: 'ブラシツールの活用', en: 'Brush Tools', ar: 'أدوات الفرشاة' }, duration: '30min', free: false, description: { ja: 'ブラシの使い分けを学びます。', en: 'Learn how to use different brushes.', ar: 'تعلم استخدام أنواع الفرشاة.' } },
      { id: 'l4', title: { ja: '色塗りの基礎', en: 'Coloring Basics', ar: 'أساسيات التلوين' }, duration: '35min', free: false, description: { ja: 'アニメ塗りの基本を学びます。', en: 'Learn anime-style coloring basics.', ar: 'تعلم أساسيات التلوين على غرار الأنيمي.' } },
    ],
  },
  'story-making': {
    title: { ja: 'ストーリー作り', en: 'Story Creation', ar: 'كتابة القصص' },
    lessons: [
      { id: 'l1', title: { ja: 'ストーリーの基本構造', en: 'Story Structure', ar: 'بنية القصة' }, duration: '30min', free: true, description: { ja: '起承転結の基本を学びます。', en: 'Learn the basics of story structure.', ar: 'تعلم أساسيات بنية القصة.' } },
      { id: 'l2', title: { ja: 'キャラクター設定の作り方', en: 'Character Profiles', ar: 'ملفات الشخصيات' }, duration: '35min', free: false, description: { ja: 'キャラクター設定を学びます。', en: 'Learn character development.', ar: 'تعلم تطوير الشخصيات.' } },
      { id: 'l3', title: { ja: '起承転結の組み立て方', en: '4-Act Structure', ar: 'هيكل 4 فصول' }, duration: '40min', free: false, description: { ja: 'ストーリー展開を学びます。', en: 'Learn story progression.', ar: 'تعلم تطور القصة.' } },
    ],
  },
  'animation-basics': {
    title: { ja: 'アニメーション基礎', en: 'Animation Basics', ar: 'أساسيات الرسوم المتحركة' },
    lessons: [
      { id: 'l1', title: { ja: 'アニメーションの原理', en: 'Animation Principles', ar: 'مبادئ الرسوم المتحركة' }, duration: '25min', free: true, description: { ja: '12の原則を学びます。', en: 'Learn the 12 principles.', ar: 'تعلم المبادئ الـ 12.' } },
      { id: 'l2', title: { ja: '動きのタイミングと間', en: 'Timing & Spacing', ar: 'التوقيت والتباعد' }, duration: '30min', free: false, description: { ja: 'タイミングを学びます。', en: 'Learn timing.', ar: 'تعلم التوقيت.' } },
      { id: 'l3', title: { ja: 'ウォークサイクルの作り方', en: 'Walk Cycle', ar: 'دورة المشي' }, duration: '45min', free: false, description: { ja: 'ウォークサイクルを学びます。', en: 'Learn walk cycles.', ar: 'تعلم دورات المشي.' } },
      { id: 'l4', title: { ja: '表情アニメーション', en: 'Facial Animation', ar: 'تحريك الوجه' }, duration: '35min', free: false, description: { ja: '表情アニメーションを学びます。', en: 'Learn facial animation.', ar: 'تعلم تحريك تعبيرات الوجه.' } },
    ],
  },
};

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'ja' | 'en' | 'ar';
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;
  const course = COURSES[courseId];
  const lessonIndex = course?.lessons.findIndex(l => l.id === lessonId) ?? -1;
  const lesson = course?.lessons[lessonIndex];
  const [completed, setCompleted] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) { router.push('/login'); return; }
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setEnrolled((data.enrolledCourses || []).includes(courseId));
        const cl = data.completedLessons?.[courseId] || [];
        setCompletedLessons(cl);
        setCompleted(cl.includes(lessonId));
        setProgress(Math.round((cl.length / (course?.lessons.length || 1)) * 100));
      }
      setLoading(false);
    });
    return () => unsub();
  }, [courseId, lessonId]);

  const handleComplete = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const ref = doc(db, 'users', user.uid);
    const today = new Date().toISOString().split('T')[0];
    const snap = await getDoc(ref);
    const data = snap.data() || {};
    const currentCompleted = [...(data.completedLessons?.[courseId] || [])];
    const activityDates = [...(data.activityDates || [])];
    if (!currentCompleted.includes(lessonId)) currentCompleted.push(lessonId);
    if (!activityDates.includes(today)) activityDates.push(today);
    const newProgress = Math.round((currentCompleted.length / (course?.lessons.length || 1)) * 100);
    await updateDoc(ref, { [`completedLessons.${courseId}`]: currentCompleted, activityDates, lastAccessedAt: serverTimestamp() });
    setCompleted(true);
    setCompletedLessons(currentCompleted);
    setProgress(newProgress);
    showToast(`${t('courses.completed')} ${newProgress}%`, 'success');
    if (newProgress === 100) {
      setTimeout(() => { showToast('🎉 ' + t('courses.courseComplete'), 'success'); setTimeout(() => router.push(`/certificate?course=${courseId}`), 2000); }, 500);
    }
  };

  const prevLesson = lessonIndex > 0 ? course?.lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < (course?.lessons.length ?? 0) - 1 ? course?.lessons[lessonIndex + 1] : null;

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">{t('common.loading')}</div>;
  if (!lesson || !course) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white gap-4">
      <p>{t('courses.notFound')}</p>
      <Link href="/courses" className="text-blue-400 hover:underline">{t('courses.backToList')}</Link>
    </div>
  );
  if (!lesson.free && !enrolled) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white gap-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <p className="text-2xl">🔒</p>
      <p>{t('courses.locked')}</p>
      <Link href={`/courses/${courseId}`} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors">{t('courses.goToCourse')}</Link>
    </div>
  );

  const courseTitle = course.title[lang] || course.title.ja;
  const lessonTitle = lesson.title[lang] || lesson.title.ja;
  const lessonDesc = lesson.description[lang] || lesson.description.ja;

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <Link href={`/courses/${courseId}`} className="text-blue-400 hover:underline text-sm">← {courseTitle}</Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{progress}%</span>
          <div className="w-32 h-2 bg-gray-700 rounded-full">
            <div className="h-2 bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-gray-800 rounded-xl mb-6 relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
          {lesson.videoUrl ? (
            <iframe width="100%" height="100%" src={lesson.videoUrl} title={lessonTitle}
              frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ display: 'block' }} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">▶️</div>
                <p className="text-gray-400">{t('courses.videoLoading')}</p>
                <p className="text-gray-500 text-sm mt-2">{lesson.duration}</p>
              </div>
            </div>
          )}
          {completed && <div className="absolute top-3 right-3 bg-green-600 text-white text-xs px-2 py-1 rounded-full z-10">{t('courses.completed')}</div>}
        </div>

        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <p className="text-gray-400 text-sm mb-1">{t('courses.lessonOf', { current: lessonIndex + 1, total: course.lessons.length })}</p>
            <h1 className="text-2xl font-bold mb-2">{lessonTitle}</h1>
            <p className="text-gray-400">{lessonDesc}</p>
          </div>
          <div className="ml-4">
            {!completed ? (
              <button onClick={handleComplete} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
                {t('courses.complete')}
              </button>
            ) : (
              <span className="text-green-400 text-sm font-medium">{t('courses.completed')}</span>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 mb-6">
          <h3 className="font-bold mb-3 text-sm text-gray-400">{courseTitle}</h3>
          <div className="space-y-2">
            {course.lessons.map((l, i) => (
              <Link key={l.id} href={`/courses/${courseId}/lessons/${l.id}`}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${l.id === lessonId ? 'bg-blue-700' : 'hover:bg-gray-700'}`}>
                <span className="text-sm w-5 text-center">{completedLessons.includes(l.id) ? '✅' : i + 1}</span>
                <span className="text-sm flex-1">{l.title[lang] || l.title.ja}</span>
                <span className="text-xs text-gray-400">{l.duration}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold mb-1 text-sm text-gray-400">{t('courses.submitAssignment')}</h3>
              <p className="text-xs text-gray-500">{t('courses.submitAssignmentNote')}</p>
            </div>
            <Link href={`/courses/${courseId}/assignment`}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
              {t('courses.submitAssignment')}
            </Link>
          </div>
        </div>

        <div className="flex justify-between gap-4">
          {prevLesson ? (
            <Link href={`/courses/${courseId}/lessons/${prevLesson.id}`} className="flex-1 bg-gray-800 hover:bg-gray-700 rounded-xl p-4 transition-colors">
              <p className="text-gray-400 text-xs mb-1">{t('courses.prevLesson')}</p>
              <p className="font-medium text-sm">{prevLesson.title[lang] || prevLesson.title.ja}</p>
            </Link>
          ) : <div className="flex-1" />}
          {nextLesson ? (
            <Link href={`/courses/${courseId}/lessons/${nextLesson.id}`} className="flex-1 bg-blue-700 hover:bg-blue-600 rounded-xl p-4 transition-colors text-right">
              <p className="text-gray-300 text-xs mb-1">{t('courses.nextLesson')}</p>
              <p className="font-medium text-sm">{nextLesson.title[lang] || nextLesson.title.ja}</p>
            </Link>
          ) : (
            <Link href={`/courses/${courseId}`} className="flex-1 bg-green-700 hover:bg-green-600 rounded-xl p-4 transition-colors text-right">
              <p className="text-gray-300 text-xs mb-1">{t('courses.courseComplete')}</p>
              <p className="font-medium text-sm">{t('courses.backToCourseBtn')}</p>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
