// MARKER: TERRAKOYA_EDU_TEXTBOOK_AR_V2
// PDF download removed: the printed book sells at 200 EGP, so a free full PDF
// undercuts it. The 19-page digest stays viewable as a sample.
// Header switched to Arabic (this is the Arabic edition).
﻿import Link from "next/link";

export const metadata = {
  title: "لنرسم المانجا! | TERRAKOYA",
  description: "لنرسم المانجا! エジプト向けマンガ教科書のダイジェスト版(19ページ)",
};

const TOTAL_PAGES = 19;

export default function MangaTextbookArPage() {
  const pages = Array.from({ length: TOTAL_PAGES }, (_, i) =>
    `/books/manga-textbook-ar/page-${String(i + 1).padStart(2, "0")}.webp`
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="sticky top-0 z-10 bg-[#0A0A0A]/90 backdrop-blur border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 dir="rtl" className="text-base sm:text-lg font-bold">
              لنرسم المانجا!
            </h1>
            <p dir="rtl" className="text-xs text-gray-400">
              نسخة مختصرة · {TOTAL_PAGES} صفحة
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/courses"
              className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
            >
              رجوع
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-2 sm:px-4 py-4 space-y-3">
        {pages.map((src, i) => (
          <div key={src} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`صفحة ${i + 1} / ${TOTAL_PAGES}`}
              loading={i < 2 ? "eager" : "lazy"}
              className="w-full h-auto rounded-lg bg-white"
            />
            <span className="absolute bottom-2 right-2 text-[10px] px-2 py-0.5 rounded bg-black/60 text-gray-300">
              {i + 1} / {TOTAL_PAGES}
            </span>
          </div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-10 text-center text-xs text-gray-500">
        © J-MANGA CREATE Co., Ltd. — TERRAKOYA
      </div>
    </div>
  );
}

