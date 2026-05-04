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
  { title: 'アニメ制作事業', desc: '日本・海外スタジオでのアニメ制作', icon: '🎬', color: 'from-red-600 to-red-800' },
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
    heading: ({'ar':'عالم المانجا والأنيمي الياباني','en':'Japanese Manga & Anime World','ja':'日本漫画・アニメの世界へようこそ','zh':'日本漫画与动漫世界','hi':'जापानी मंगा और एनीमे की दुनिया','vi':'Thế giới Manga & Anime Nhật Bản','es':'El mundo del Manga y Anime japonés'}[lang as string] || 'Japanese Manga & Anime World'),
    sub1: ({'ar':'اكتشف أعمال الفنانين اليابانيين','en':'Discover talented Japanese creators','ja':'日本の才能あるクリエイターを発見','zh':'发现日本才华横溢的创作者','hi':'प्रतिभाशाली जापानी क्रिएटर खोजें','vi':'Khám phá các nhà sáng tạo Nhật Bản','es':'Descubre creadores japoneses talentosos'}[lang as string] || 'Discover talented Japanese creators'),
    all: ({'ar':'الكل','en':'All','ja':'すべて','zh':'全部','hi':'सभी','vi':'Tất cả','es':'Todos'}[lang as string] || 'All'),
    manga: ({'ar':'المانجا','en':'Manga','ja':'漫画','zh':'漫画','hi':'मंगा','vi':'Manga','es':'Manga'}[lang as string] || 'Manga'),
    anime: ({'ar':'الأنيمي','en':'Anime','ja':'アニメ','zh':'动漫','hi':'एनिमे','vi':'Anime','es':'Anime'}[lang as string] || 'Anime'),
    loading: ({'ar':'جاري التحميل...','en':'Loading...','ja':'作品を読み込み中...','zh':'加载中...','hi':'लोड हो रहा है...','vi':'Đang tải...','es':'Cargando...'}[lang as string] || 'Loading...'),
    noResults: ({'ar':'لا توجد أعمال','en':'No works found','ja':'該当する作品がありません','zh':'没有找到作品','hi':'कोई काम नहीं मिला','vi':'Không tìm thấy tác phẩm','es':'No se encontraron obras'}[lang as string] || 'No works found'),
    partner: ({'ar':'هل تريد الشراكة معنا؟','en':'Interested in a partnership?','ja':'パートナーシップについてご関心がありますか？','zh':'对合作感兴趣吗？','hi':'साझेदारी में रुचि है?','vi':'Quan tâm đến hợp tác?','es':'¿Interesado en una asociación?'}[lang as string] || 'Interested in a partnership?'),
    contact: ({'ar':'تواصل معنا','en':'Contact Us','ja':'お問い合わせ','zh':'联系我们','hi':'हमसे संपर्क करें','vi':'Liên hệ chúng tôi','es':'Contáctanos'}[lang as string] || 'Contact Us'),
    jmcTitle: ({'ar':'خدمات J-MANGA CREATE','en':'J-MANGA CREATE Services','ja':'J-MANGA CREATE の制作実績','zh':'J-MANGA CREATE 服务','hi':'J-MANGA CREATE सेवाएं','vi':'Dịch vụ J-MANGA CREATE','es':'Servicios de J-MANGA CREATE'}[lang as string] || 'J-MANGA CREATE Services'),
    jmcSub: ({'ar':'شريكك في إنتاج الأنيمي والمانجا','en':'Your anime & manga production partner','ja':'アニメ・漫画制作のパートナー','zh':'您的动漫制作伙伴','hi':'आपका एनीमे और मंगा प्रोडक्शन पार्टनर','vi':'Đối tác sản xuất anime và manga của bạn','es':'Tu socio de producción de anime y manga'}[lang as string] || 'Your anime & manga production partner'),
    featured: ({'ar':'أعمال مميزة','en':'Featured Works','ja':'おすすめ作品','zh':'精选作品','hi':'विशेष रचनाएं','vi':'Tác phẩm nổi bật','es':'Obras destacadas'}[lang as string] || 'Featured Works'),
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