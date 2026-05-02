'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTranslation } from 'react-i18next';

interface ShowcaseItem {
  id: string;
  titleJa: string;
  titleEn: string;
  titleAr: string;
  category: string;
  rating: number;
}

const JMC_WORKS = [
  { title: 'Production I.G 共同制作', desc: '資本業務提携によるアニメ制作', icon: '🎬', color: 'from-red-600 to-red-800' },
  { title: 'ベトナム・エジプトスタジオ', desc: '海外3拠点での制作体制', icon: '🌍', color: 'from-green-600 to-green-800' },
  { title: 'アラビア語ローカライズ', desc: 'エジプト市場向け漫画翻訳', icon: '📖', color: 'from-blue-600 to-blue-800' },
];

export default function ShowcasePage() {
  const { i18n } = useTranslation();
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const lang = i18n.language;

  useEffect(() => {
    const fetchShowcase = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'showcase'));
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ShowcaseItem[];
        setItems(data);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchShowcase();
  }, []);

  const filtered = filter === 'all' ? items : items.filter(i => i.category === filter);

  const getTitle = (item: ShowcaseItem) => {
    if (lang === 'ar') return item.titleAr;
    if (lang === 'en') return item.titleEn;
    return item.titleJa;
  };

  const t = {
    heading: lang === 'ar' ? 'عالم المانجا والأنيمي الياباني' : lang === 'en' ? 'Japanese Manga & Anime World' : '日本漫画・アニメの世界へようこそ',
    sub1: lang === 'ar' ? 'اكتشف أعمال الفنانين اليابانيين' : lang === 'en' ? 'Discover talented Japanese creators' : '日本の才能あるクリエイターを発見',
    all: lang === 'ar' ? 'الكل' : lang === 'en' ? 'All' : 'すべて',
    manga: lang === 'ar' ? 'المانجا' : lang === 'en' ? 'Manga' : '漫画',
    anime: lang === 'ar' ? 'الأنيمي' : lang === 'en' ? 'Anime' : 'アニメ',
    loading: lang === 'ar' ? 'جاري التحميل...' : lang === 'en' ? 'Loading...' : '作品を読み込み中...',
    noResults: lang === 'ar' ? 'لا توجد أعمال' : lang === 'en' ? 'No works found' : '該当する作品がありません',
    partner: lang === 'ar' ? 'هل تريد الشراكة معنا؟' : lang === 'en' ? 'Interested in a partnership?' : 'パートナーシップについてご関心がありますか？',
    contact: lang === 'ar' ? 'تواصل معنا' : lang === 'en' ? 'Contact Us' : 'お問い合わせ',
    jmcTitle: lang === 'ar' ? 'خدمات J-MANGA CREATE' : lang === 'en' ? 'J-MANGA CREATE Services' : 'J-MANGA CREATE の制作実績',
    jmcSub: lang === 'ar' ? 'شريكك في إنتاج الأنيمي والمانجا' : lang === 'en' ? 'Your anime & manga production partner' : 'アニメ・漫画制作のパートナー',
    featured: lang === 'ar' ? 'أعمال مميزة' : lang === 'en' ? 'Featured Works' : 'おすすめ作品',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin text-5xl mb-4">🎨</div>
          <p className="text-gray-400">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900 py-16 px-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-blue-300 text-sm tracking-widest mb-4">TERRAKOYA SHOWCASE</p>
          <h1 className="text-5xl font-bold mb-4">{t.heading}</h1>
          <p className="text-gray-300 text-lg">{t.sub1}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-2 text-center">{t.jmcTitle}</h2>
          <p className="text-gray-400 text-center mb-8">{t.jmcSub}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {JMC_WORKS.map((work, i) => (
              <div key={i} className={`bg-gradient-to-br ${work.color} p-6 rounded-2xl text-center hover:scale-105 transition-transform`}>
                <span className="text-4xl block mb-3">{work.icon}</span>
                <h3 className="text-lg font-bold mb-2">{work.title}</h3>
                <p className="text-sm opacity-80">{work.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6 text-center">{t.featured}</h2>

        <div className="flex gap-3 mb-10 justify-center">
          {[
            { value: 'all', label: t.all, emoji: '🌟' },
            { value: 'manga', label: t.manga, emoji: '📖' },
            { value: 'anime', label: t.anime, emoji: '🎬' },
          ].map(cat => (
            <button
              key={cat.value}
              onClick={() => setFilter(cat.value)}
              className={`px-6 py-3 rounded-full font-medium transition ${
                filter === cat.value
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(item => (
            <div key={item.id} className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
              <div className="h-48 bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center group-hover:from-blue-900 group-hover:to-purple-900 transition-all duration-300">
                <span className="text-6xl">{item.category === 'manga' ? '📖' : '🎬'}</span>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-white mb-2">{getTitle(item)}</h3>
                <div className="flex items-center justify-between mt-4">
                  <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                    item.category === 'manga'
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                      : 'bg-purple-600/20 text-purple-400 border border-purple-600/30'
                  }`}>
                    {item.category === 'manga' ? '📖 ' + t.manga : '🎬 ' + t.anime}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400 text-lg">{'★'.repeat(Math.floor(item.rating))}</span>
                    <span className="text-gray-400 text-sm">{item.rating}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">🔍</p>
            <p className="text-gray-400 text-lg">{t.noResults}</p>
          </div>
        )}

        <div className="mt-20 text-center border-t border-slate-800 pt-12">
          <p className="text-gray-400 mb-4">{t.partner}</p>
          <a href="/contact" className="inline-block bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-full font-bold transition shadow-lg shadow-blue-600/20">
            {t.contact} →
          </a>
        </div>
      </div>
    </div>
  );
}