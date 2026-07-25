"use client";
// src/app/album/page.tsx
// TERRAKOYA-edu Phase 3-1: 学期末アルバム(プレビュー)
// マーカー: TERRAKOYA_ALBUM_PAGE_V1
//
// この段階の目的は「集計が正しいか目視できること」。PDF出力は次ステップ。
// - 文言はページ内インライン辞書(言語コードのみ i18n から借用)
// - AR時は dir="rtl"
// - 白背景カードは文字色を明示(ダークモードで白文字化する既知の問題への対応)

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { loadAlbum, type AlbumData, type AlbumItem, type AlbumKind } from "@/lib/album";

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

  if (!authReady) return <Shell rtl={rtl}><p style={{ color: "#111827" }}>{t.loading}</p></Shell>;
  if (!uid) return <Shell rtl={rtl}><div style={CARD}>{t.needLogin}</div></Shell>;
  if (err) return <Shell rtl={rtl}><div style={{ ...CARD, color: "#b91c1c", WebkitTextFillColor: "#b91c1c" }}>⚠ {err}</div></Shell>;
  if (!data) return <Shell rtl={rtl}><p style={{ color: "#111827" }}>{t.loading}</p></Shell>;

  return (
    <Shell rtl={rtl}>
      {/* 表紙 */}
      <div style={{ ...CARD, textAlign: "center" }}>
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
      </div>

      {/* 件数サマリー(集計の目視確認用) */}
      <div style={{ ...CARD }}>
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
        <div style={CARD}>{t.empty}</div>
      ) : (
        data.items.map((it) => <ItemCard key={`${it.kind}-${it.id}`} item={it} t={t} />)
      )}
    </Shell>
  );
}

function Shell({ rtl, children }: { rtl: boolean; children: React.ReactNode }) {
  return (
    <div dir={rtl ? "rtl" : "ltr"} style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      {children}
    </div>
  );
}

function ItemCard({ item, t }: { item: AlbumItem; t: (typeof DICT)[LangKey] }) {
  const d = item.date;
  const p = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;

  return (
    <div style={CARD}>
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
            <a href={item.audioUrl} target="_blank" rel="noreferrer" style={{ fontSize: 14, display: "inline-block", marginTop: 8 }}>
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
