'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface School {
  id: string;
  nameJa: string;
  city: string;
  studentCount: number;
}

export default function TeacherDashboard() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const schoolsSnap = await getDocs(collection(db, 'schools'));
        const schoolsData = schoolsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as School[];
        setSchools(schoolsData);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalStudents = schools.reduce((sum, s) => sum + (s.studentCount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">教師ダッシュボード</h1>
        <p className="text-gray-400 mb-10">EJS・大学連携管理システム</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl">
            <p className="text-blue-200 text-sm mb-1">総学生数</p>
            <p className="text-4xl font-bold">{totalStudents}</p>
            <p className="text-blue-300 text-xs mt-2">3校合計</p>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-2xl">
            <p className="text-green-200 text-sm mb-1">登録スクール</p>
            <p className="text-4xl font-bold">{schools.length}</p>
            <p className="text-green-300 text-xs mt-2">EJS + 大学</p>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-2xl">
            <p className="text-purple-200 text-sm mb-1">平均完了率</p>
            <p className="text-4xl font-bold">68%</p>
            <div className="w-full bg-purple-900 rounded-full h-2 mt-3">
              <div className="bg-white h-2 rounded-full" style={{width: '68%'}}></div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-600 to-orange-800 p-6 rounded-2xl">
            <p className="text-orange-200 text-sm mb-1">提出課題</p>
            <p className="text-4xl font-bold">24</p>
            <p className="text-orange-300 text-xs mt-2">今月 +8件</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h2 className="text-2xl font-bold mb-6">登録スクール</h2>
              <div className="space-y-4">
                {schools.map(school => (
                  <div key={school.id} className="bg-slate-800 rounded-xl p-5 flex items-center justify-between hover:bg-slate-700 transition">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-xl">
                        {school.city === 'Cairo' ? '🏛️' : school.city === 'Giza' ? '🔺' : '🎓'}
                      </div>
                      <div>
                        <p className="font-bold text-lg">{school.nameJa}</p>
                        <p className="text-gray-400 text-sm">{school.city}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{school.studentCount}</p>
                      <p className="text-gray-400 text-xs">学生</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h3 className="text-xl font-bold mb-4">最近の課題</h3>
              <div className="space-y-3">
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <p className="font-medium">マンガ基礎 - 第3課</p>
                  <p className="text-xs text-gray-400">期限: 2026/05/15</p>
                  <p className="text-xs text-green-400 mt-1">8/12 提出済み</p>
                </div>
                <div className="border-l-4 border-yellow-500 pl-4 py-2">
                  <p className="font-medium">デジタルアート入門</p>
                  <p className="text-xs text-gray-400">期限: 2026/05/20</p>
                  <p className="text-xs text-yellow-400 mt-1">3/12 提出済み</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4 py-2">
                  <p className="font-medium">キャラクターデザイン</p>
                  <p className="text-xs text-gray-400">期限: 2026/05/25</p>
                  <p className="text-xs text-gray-500 mt-1">0/12 提出済み</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h3 className="text-xl font-bold mb-4">お知らせ</h3>
              <div className="space-y-3">
                <div className="bg-slate-800 p-3 rounded-lg">
                  <p className="text-sm font-medium">📢 夏季教師研修のお知らせ</p>
                  <p className="text-xs text-gray-400 mt-1">2026/07/01 - カイロにて</p>
                </div>
                <div className="bg-slate-800 p-3 rounded-lg">
                  <p className="text-sm font-medium">📚 新教材「漫画テクニック」追加</p>
                  <p className="text-xs text-gray-400 mt-1">2026/05/01</p>
                </div>
                <div className="bg-slate-800 p-3 rounded-lg">
                  <p className="text-sm font-medium">🏆 第1回 漫画コンテスト開催決定</p>
                  <p className="text-xs text-gray-400 mt-1">2026/09/15 - ヘルワン大学</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}