'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

const COURSES: Record<string, { title: string; titleEn: string }> = {
  'manga-basics': { title: '漫画基礎講座', titleEn: 'Manga Basics' },
  'digital-illust': { title: 'デジタルイラスト入門', titleEn: 'Digital Illustration' },
  'story-making': { title: 'ストーリー作り', titleEn: 'Story Making' },
  'animation-basics': { title: 'アニメーション基礎', titleEn: 'Animation Basics' },
};

export default function CertificatePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get('course') || '';
  const course = COURSES[courseId];
  const [userName, setUserName] = useState('');
  const [completedDate, setCompletedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) { router.push('/login'); return; }
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setUserName(snap.data().displayName || user.displayName || 'Learner');
      } else {
        setUserName(user.displayName || 'Learner');
      }
      setCompletedDate(new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, 297, 210, 'F');
      pdf.setDrawColor(59, 130, 246);
      pdf.setLineWidth(2);
      pdf.rect(8, 8, 281, 194);
      pdf.setLineWidth(0.5);
      pdf.rect(12, 12, 273, 186);

      pdf.setTextColor(59, 130, 246);
      pdf.setFontSize(12);
      pdf.text('CERTIFICATE OF COMPLETION', 148.5, 35, { align: 'center' });

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(28);
      pdf.text('Certificate of Achievement', 148.5, 50, { align: 'center' });

      pdf.setDrawColor(59, 130, 246);
      pdf.setLineWidth(0.5);
      pdf.line(80, 58, 217, 58);

      pdf.setTextColor(156, 163, 175);
      pdf.setFontSize(11);
      pdf.text('This is to certify that', 148.5, 72, { align: 'center' });

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(26);
      const displayName = userName || 'Learner';
      pdf.text(displayName, 148.5, 90, { align: 'center' });

      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(0.3);
      const nameWidth = pdf.getTextWidth(displayName);
      pdf.line(148.5 - nameWidth / 2 - 10, 94, 148.5 + nameWidth / 2 + 10, 94);

      pdf.setTextColor(156, 163, 175);
      pdf.setFontSize(11);
      pdf.text('has successfully completed the course', 148.5, 108, { align: 'center' });

      pdf.setTextColor(96, 165, 250);
      pdf.setFontSize(20);
      pdf.text(course?.titleEn || courseId, 148.5, 123, { align: 'center' });

      pdf.setTextColor(156, 163, 175);
      pdf.setFontSize(10);
      pdf.text('Date: ' + completedDate, 148.5, 140, { align: 'center' });

      pdf.setDrawColor(59, 130, 246);
      pdf.line(80, 150, 217, 150);

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.text('TERRAKOYA', 148.5, 165, { align: 'center' });

      pdf.setFontSize(8);
      pdf.setTextColor(75, 85, 99);
      pdf.text('Online Learning Platform for Manga & Anime Creators', 148.5, 175, { align: 'center' });
      pdf.text('terrakoya-edu.vercel.app', 148.5, 182, { align: 'center' });

      pdf.save('TERRAKOYA_certificate_' + courseId + '.pdf');
    } catch (e) {
      console.error('PDF error:', e);
      alert('PDF generation error: ' + e);
    }
    setDownloading(false);
  };

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>;

  if (!course) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white gap-4">
      <p>Course not found</p>
      <Link href="/courses" className="text-blue-400 hover:underline">Back to courses</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <Link href={'/courses/' + courseId} className="text-blue-400 hover:underline text-sm mb-6 block">← コースに戻る</Link>
        <h1 className="text-2xl font-bold mb-8 text-center">🏆 修了証明書</h1>
        <div className="bg-gray-900 border-2 border-blue-600 rounded-2xl p-12 mb-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'repeating-linear-gradient(45deg, #3b82f6 0, #3b82f6 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px'}}></div>
          <div className="relative z-10">
            <p className="text-blue-400 text-xs tracking-widest mb-1">CERTIFICATE OF COMPLETION</p>
            <p className="text-gray-400 text-xs mb-6">修了証明書</p>
            <div className="w-16 h-0.5 bg-blue-500 mx-auto mb-6"></div>
            <p className="text-gray-400 text-sm mb-2">以下の方が修了したことを証明します</p>
            <p className="text-3xl font-bold mb-1">{userName}</p>
            <div className="w-48 h-0.5 bg-white mx-auto mb-4"></div>
            <p className="text-gray-400 text-sm mb-3">修了コース</p>
            <p className="text-xl font-bold text-blue-400 mb-1">{course.title}</p>
            <p className="text-sm text-gray-500 mb-4">{course.titleEn}</p>
            <p className="text-gray-500 text-sm mb-8">{completedDate}</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">⛩️</span>
              <span className="font-bold text-lg">TERRAKOYA</span>
            </div>
          </div>
        </div>
        <div className="text-center">
          <button onClick={handleDownload} disabled={downloading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-8 py-3 rounded-xl font-bold text-lg transition-colors">
            {downloading ? 'Generating...' : '📄 PDFをダウンロード'}
          </button>
          <p className="text-gray-500 text-sm mt-3">※ PDFは英語ベースで出力されます（文字化け防止）</p>
        </div>
      </div>
    </div>
  );
}