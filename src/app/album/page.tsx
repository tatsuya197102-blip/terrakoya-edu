"use client";
// src/app/album/page.tsx
// TERRAKOYA-edu Phase 3-2: 学期末アルバム(印刷 / PDF保存対応)
// マーカー: TERRAKOYA_ALBUM_PAGE_V3
//
// PDF化はブラウザの印刷機能に任せる(jsPDF / Puppeteer は使わない):
//  - アラビア語の字形整形・双方向テキストをブラウザが処理するため ar が崩れない
//  - 追加ライブラリゼロ。低スペック端末でも重くならない
//  - Storage画像を canvas に載せないので CORS 制約を受けない
//  - 文字が画像にならず選択・検索できる
// 印刷時のレイアウトは下部の PRINT_CSS で制御する。

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { loadAlbum, type AlbumData, type AlbumItem, type AlbumKind } from "@/lib/album";
import { ensureEggCode } from "@/lib/eggCode";

const DICT = {
  ja: {
    title: "がっこうの おもいで",
    subtitle: "この がっきに つくった さくひん",
    loading: "よみこみちゅう...",
    needLogin: "ログインすると じぶんの アルバムが みられます",
    term: "きかん",
    hearts: "この がっきに あげた ♥",
    empty: "まだ さくひんが ありません。なにか つくってみよう!",
    total: "ぜんぶで",
    unit: "てん",
    song: "うた・ラップ",
    paint: "おえかき",
    manga4: "4コマまんが",
    assignment: "かだい",
    noImage: "(がぞうなし)",
    listen: "きく",
    save: "🖨 PDFで ほぞんする",
    saveHint: "「いんさつ」の がめんで「PDFに ほぞん」を えらんでね",
    printFooter: "TERRAKOYA がっこうの おもいで",
    eggTitle: "たまご ひきかえコード",
    eggHint: "おうちの人と いっしょに TERRAKOYA Study で つかってね",
  },
  en: {
    title: "School Memories",
    subtitle: "Works you made this term",
    loading: "Loading...",
    needLogin: "Sign in to see your album",
    term: "Term",
    hearts: "Hearts you gave this term",
    empty: "No works yet. Let's make something!",
    total: "Total",
    unit: "works",
    song: "Songs & Raps",
    paint: "Paintings",
    manga4: "4-Panel Manga",
    assignment: "Assignments",
    noImage: "(no image)",
    listen: "Listen",
    save: "🖨 Save as PDF",
    saveHint: "Choose \"Save as PDF\" in the print dialog",
    printFooter: "TERRAKOYA School Memories",
    eggTitle: "Egg redemption code",
    eggHint: "Use it in TERRAKOYA Study together with a grown-up",
  },
  ar: {
    title: "ذكريات المدرسة",
    subtitle: "أعمالك في هذا الفصل",
    loading: "جارٍ التحميل...",
    needLogin: "سجّل الدخول لرؤية ألبومك",
    term: "الفصل",
    hearts: "القلوب التي قدّمتها هذا الفصل",
    empty: "لا توجد أعمال بعد. لنصنع شيئاً!",
    total: "المجموع",
    unit: "عمل",
    song: "الأغاني والراب",
    paint: "الرسومات",
    manga4: "مانغا من ٤ لوحات",
    assignment: "الواجبات",
    noImage: "(بدون صورة)",
    listen: "استمع",
    save: "🖨 احفظ بصيغة PDF",
    saveHint: "اختر «حفظ بصيغة PDF» في نافذة الطباعة",
    printFooter: "TERRAKOYA ذكريات المدرسة",
    eggTitle: "رمز استبدال البيضة",
    eggHint: "استخدمه في TERRAKOYA Study مع أحد الوالدين",
  },
} as const;

type LangKey = keyof typeof DICT;

const KIND_ORDER: AlbumKind[] = ["song", "paint", "manga4", "assignment"];
const KIND_EMOJI: Record<AlbumKind, string> = {
  song: "🎤",
  paint: "🎨",
  manga4: "📖",
  assignment: "📝",
};

const CARD: React.CSSProperties = {
  background: "#ffffff",
  color: "#111827",
  WebkitTextFillColor: "#111827",
  borderRadius: 16,
  padding: 16,
  marginBottom: 16,
  boxShadow: "0 2px 10px rgba(0,0,0,.08)",
};

/**
 * 印刷時のレイアウト。
 *  - A4 縦・余白12mm
 *  - 表紙のあとで改ページ、作品カードは途中で切らない
 *  - 背景色と絵文字の色を印刷に反映(print-color-adjust)
 *  - 画面用の影・角丸・ボタンは落とす
 */
const PRINT_CSS = `
@media print {
  @page { size: A4 portrait; margin: 12mm; }

  html, body {
    background: #ffffff !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .tk-noprint { display: none !important; }

  .tk-album { max-width: none !important; padding: 0 !important; }

  .tk-card {
    box-shadow: none !important;
    border: 1px solid #e5e7eb !important;
    border-radius: 8px !important;
    margin-bottom: 10px !important;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .tk-cover {
    break-after: page;
    page-break-after: always;
    border: none !important;
    text-align: center;
    padding-top: 24mm !important;
  }

  .tk-item img { max-height: 150mm; object-fit: contain; }

  .tk-printfoot { display: block !important; }
}
@media screen {
  .tk-printfoot { display: none; }
}
`;

export default function AlbumPage() {
  const { i18n } = useTranslation();
  const raw = (i18n?.language || "ja").slice(0, 2);
  const lang: LangKey = raw === "ar" ? "ar" : raw === "en" ? "en" : "ja";
  const t = DICT[lang];
  const rtl = lang === "ar";

  const [uid, setUid] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [data, setData] = useState<AlbumData | null>(null);
  const [err, setErr] = useState<string>("");
  const [eggCode, setEggCode] = useState<string | null>(null);

  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => {
      setUid(u ? u.uid : null);
      setAuthReady(true);
    });
    return () => off();
  }, []);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    setErr("");
    loadAlbum(uid)
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setErr(String(e?.message || e)); });
    return () => { alive = false; };
  }, [uid]);

  // 引換コードは学期ごとに1つ。失敗しても null のままでアルバムは出す
  useEffect(() => {
    if (!uid || !data) return;
    let alive = true;
    ensureEggCode(uid, data.termStartDate, data.character, data.termHearts)
      .then((c) => { if (alive) setEggCode(c); })
      .catch(() => { if (alive) setEggCode(null); });
    return () => { alive = false; };
  }, [uid, data]);

  if (!authReady) return <Shell rtl={rtl}><p style={{ color: "#111827" }}>{t.loading}</p></Shell>;
  if (!uid) return <Shell rtl={rtl}><div style={CARD}>{t.needLogin}</div></Shell>;
  if (err) return <Shell rtl={rtl}><div style={{ ...CARD, color: "#b91c1c", WebkitTextFillColor: "#b91c1c" }}>⚠ {err}</div></Shell>;
  if (!data) return <Shell rtl={rtl}><p style={{ color: "#111827" }}>{t.loading}</p></Shell>;

  return (
    <Shell rtl={rtl}>
      {/* 表紙 */}
      <div className="tk-card tk-cover" style={{ ...CARD, textAlign: "center" }}>
        <div style={{ fontSize: 56, lineHeight: 1 }}>
          <img
            src={`/pets/${data.character === "rabbit" ? "usagi" : data.character === "bird" ? "tori" : "neko"}.png`}
            alt=""
            style={{ width: 96, height: 96, objectFit: "contain" }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "8px 0" }}>{t.title}</h1>
        <p style={{ margin: 0, opacity: 0.75 }}>{t.subtitle}</p>
        <p style={{ margin: "10px 0 0", fontSize: 13, opacity: 0.7 }}>
          {t.term}: {data.termStartDate} 〜 {data.termEndDate}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 13 }}>
          {t.hearts}: ♥ {data.termHearts}
        </p>

        {eggCode ? (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px dashed #d1d5db" }}>
            <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700 }}>🥚 {t.eggTitle}</p>
            <p
              dir="ltr"
              style={{
                margin: 0,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 2,
                color: "#0E3B4A",
                WebkitTextFillColor: "#0E3B4A",
                background: "#EAF6F8",
                border: "2px solid #1B7A8C",
                borderRadius: 10,
                padding: "10px 12px",
                display: "inline-block",
              }}
            >
              {eggCode}
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 12, opacity: 0.75 }}>{t.eggHint}</p>
          </div>
        ) : null}
      </div>

      {/* 保存ボタン(印刷時は消える) */}
      <div className="tk-noprint" style={{ ...CARD, textAlign: "center" }}>
        <button
          onClick={() => window.print()}
          style={{
            background: "#1B7A8C",
            color: "#ffffff",
            WebkitTextFillColor: "#ffffff",
            border: "none",
            borderRadius: 12,
            padding: "12px 24px",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {t.save}
        </button>
        <p style={{ margin: "10px 0 0", fontSize: 13, opacity: 0.7 }}>{t.saveHint}</p>
      </div>

      {/* 件数サマリー */}
      <div className="tk-card" style={{ ...CARD }}>
        <p style={{ margin: "0 0 10px", fontWeight: 700 }}>
          {t.total}: {data.items.length} {t.unit}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {KIND_ORDER.map((k) => (
            <span
              key={k}
              style={{
                background: "#f3f4f6",
                borderRadius: 999,
                padding: "6px 12px",
                fontSize: 14,
                color: "#111827",
                WebkitTextFillColor: "#111827",
              }}
            >
              {KIND_EMOJI[k]} {t[k]}: {data.counts[k]}
            </span>
          ))}
        </div>
      </div>

      {/* 作品一覧 */}
      {data.items.length === 0 ? (
        <div className="tk-card" style={CARD}>{t.empty}</div>
      ) : (
        data.items.map((it) => <ItemCard key={`${it.kind}-${it.id}`} item={it} t={t} />)
      )}

      {/* 印刷物の締め(画面では出ない) */}
      <p className="tk-printfoot" style={{ textAlign: "center", fontSize: 11, color: "#6b7280", marginTop: 12 }}>
        {t.printFooter} — {data.termStartDate} 〜 {data.termEndDate}
      </p>
    </Shell>
  );
}

function Shell({ rtl, children }: { rtl: boolean; children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <div className="tk-album" dir={rtl ? "rtl" : "ltr"} style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
        {children}
      </div>
    </>
  );
}

function ItemCard({ item, t }: { item: AlbumItem; t: (typeof DICT)[LangKey] }) {
  const d = item.date;
  const p = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;

  return (
    <div className="tk-card tk-item" style={CARD}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, opacity: 0.7, marginBottom: 8 }}>
        <span>{KIND_EMOJI[item.kind]} {t[item.kind]}</span>
        <span>{dateStr}</span>
      </div>

      {item.title ? <p style={{ margin: "0 0 8px", fontWeight: 700 }}>{item.title}</p> : null}

      {item.imageSrc ? (
        <img
          src={item.imageSrc}
          alt=""
          crossOrigin={item.needsCors ? "anonymous" : undefined}
          style={{ width: "100%", borderRadius: 12, display: "block", background: "#f3f4f6" }}
        />
      ) : item.kind === "song" ? (
        <div>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontFamily: "inherit",
              margin: 0,
              background: "#f9fafb",
              borderRadius: 12,
              padding: 12,
              color: "#111827",
              WebkitTextFillColor: "#111827",
            }}
          >
            {item.lyrics || ""}
          </pre>
          {item.audioUrl ? (
            <a className="tk-noprint" href={item.audioUrl} target="_blank" rel="noreferrer" style={{ fontSize: 14, display: "inline-block", marginTop: 8 }}>
              ▶ {t.listen}
            </a>
          ) : null}
        </div>
      ) : (
        <p style={{ margin: 0, opacity: 0.5 }}>{t.noImage}</p>
      )}
    </div>
  );
}
