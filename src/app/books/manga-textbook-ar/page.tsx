import Link from "next/link";

export const metadata = {
  title: "マンガの教科書(アラビア語版)閲覧版 | TERRAKOYA",
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
            <h1 className="text-base sm:text-lg font-bold">
              マンガの教科書(アラビア語版)
            </h1>
            <p className="text-xs text-gray-400">
              لنرسم المانجا! ダイジェスト版・全{TOTAL_PAGES}ページ
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/books/manga-textbook-ar/digest.pdf"
              download
              className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 transition"
            >
              PDF
            </a>
            <Link
              href="/courses"
              className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
            >
              戻る
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
              alt={`ページ ${i + 1} / ${TOTAL_PAGES}`}
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

