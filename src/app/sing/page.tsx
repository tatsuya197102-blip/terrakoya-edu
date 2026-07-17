"use client";

// src/app/sing/page.tsx
// 「うたって!マスコット」— 子どもが書いた歌詞をマスコットが歌ってくれるページ
// 多言語対応: react-i18next の i18n.language を参照(辞書はページ内に保持)
// 言語に応じて歌声も切替(ja/en/ar) — API側に lang を渡す

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type Lang = "ja" | "en" | "ar";

const STRINGS: Record<Lang, {
  title: string;
  subtitle: string;
  lyricsHeader: string;
  placeholders: string[];
  addLine: (n: number) => string;
  removeLine: (n: number) => string;
  selectChar: (name: string) => string;
  singingNow: (name: string) => string;
  singButton: string;
  loading: string;
  stopButton: string;
  errorEmpty: string;
  errorPlay: string;
  footNote: string;
  charNames: Record<string, string>;
}> = {
  ja: {
    title: "🎤 うたって!マスコット",
    subtitle: "歌詞を書くと、えらんだマスコットが歌ってくれるよ",
    lyricsHeader: "✏️ 歌詞をかこう(1行30文字まで)",
    placeholders: [
      "たとえば: おひさま きらきら",
      "たとえば: きょうも げんきだ",
      "たとえば: みんなで うたおう",
      "たとえば: らんらんらん♪",
      "", "",
    ],
    addLine: (n) => `+ 行をふやす(あと${n}行)`,
    removeLine: (n) => `${n}行目をけす`,
    selectChar: (name) => `${name}をえらぶ`,
    singingNow: (name) => `${name}が歌ってるよ♪`,
    singButton: "🎵 うたってもらう!",
    loading: "じゅんびちゅう…",
    stopButton: "⏹ とめる",
    errorEmpty: "歌詞を1行いじょう書いてね",
    errorPlay: "うたの再生に失敗しました。もういちど試してね",
    footNote: "※ 悪い言葉や個人情報(電話番号など)は歌にできません",
    charNames: { rabbit: "うさぎ", cat: "ねこ", bird: "とり" },
  },
  en: {
    title: "🎤 Sing It, Mascot!",
    subtitle: "Write some lyrics and your mascot will sing them!",
    lyricsHeader: "✏️ Write your lyrics (up to 30 letters per line)",
    placeholders: [
      "e.g. The sun is shining bright",
      "e.g. Today is a happy day",
      "e.g. Let's all sing together",
      "e.g. La la la la la ♪",
      "", "",
    ],
    addLine: (n) => `+ Add a line (${n} left)`,
    removeLine: (n) => `Remove line ${n}`,
    selectChar: (name) => `Choose ${name}`,
    singingNow: (name) => `${name} is singing! ♪`,
    singButton: "🎵 Sing it!",
    loading: "Getting ready…",
    stopButton: "⏹ Stop",
    errorEmpty: "Please write at least one line",
    errorPlay: "Couldn't play the song. Please try again!",
    footNote: "※ Bad words and personal info (like phone numbers) can't be sung",
    charNames: { rabbit: "Rabbit", cat: "Cat", bird: "Bird" },
  },
  ar: {
    title: "🎤 غنِّ يا صديقي!",
    subtitle: "اكتب كلمات الأغنية وسيغنيها صديقك المفضل!",
    lyricsHeader: "✏️ اكتب الكلمات (حتى 30 حرفًا في السطر)",
    placeholders: [
      "مثال: الشمس تلمع في السماء",
      "مثال: اليوم يوم سعيد",
      "مثال: هيا نغني معًا",
      "مثال: لا لا لا لا ♪",
      "", "",
    ],
    addLine: (n) => `+ أضف سطرًا (${n} متبقٍ)`,
    removeLine: (n) => `احذف السطر ${n}`,
    selectChar: (name) => `اختر ${name}`,
    singingNow: (name) => `${name} يغني! ♪`,
    singButton: "🎵 غنِّها!",
    loading: "جارٍ التحضير…",
    stopButton: "⏹ إيقاف",
    errorEmpty: "اكتب سطرًا واحدًا على الأقل",
    errorPlay: "تعذّر تشغيل الأغنية. حاول مرة أخرى!",
    footNote: "※ لا يمكن غناء الكلمات السيئة أو المعلومات الشخصية (مثل رقم الهاتف)",
    charNames: { rabbit: "الأرنب", cat: "القط", bird: "الطائر" },
  },
};

const CHARACTERS = [
  { id: "rabbit", img: "/mascots/rabbit_256.png" },
  { id: "cat", img: "/mascots/cat_256.png" },
  { id: "bird", img: "/mascots/bird_256.png" },
] as const;

type CharId = (typeof CHARACTERS)[number]["id"];

const MAX_LINES = 6;
const MAX_LINE_LEN = 30;

export default function SingPage() {
  const { i18n } = useTranslation();
  const lang: Lang = (["ja", "en", "ar"] as const).includes(
    i18n.language as Lang
  )
    ? (i18n.language as Lang)
    : "ja";
  const s = STRINGS[lang];
  const isRtl = lang === "ar";

  const [isNarrow, setIsNarrow] = useState(false);
  const [character, setCharacter] = useState<CharId>("rabbit");
  const [lines, setLines] = useState<string[]>(["", "", "", ""]);
  const [singing, setSinging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const check = () => setIsNarrow(window.innerWidth < 820);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ページ離脱時に音を止める
  useEffect(() => {
    return () => {
      voiceRef.current?.pause();
      bgmRef.current?.pause();
    };
  }, []);

  const setLine = (i: number, v: string) => {
    setLines((prev) => prev.map((l, idx) => (idx === i ? v : l)));
  };

  const addLine = () => {
    if (lines.length < MAX_LINES) setLines((prev) => [...prev, ""]);
  };

  const removeLine = (i: number) => {
    if (lines.length > 1)
      setLines((prev) => prev.filter((_, idx) => idx !== i));
  };

  const stopAll = () => {
    voiceRef.current?.pause();
    if (voiceRef.current) voiceRef.current.currentTime = 0;
    bgmRef.current?.pause();
    if (bgmRef.current) bgmRef.current.currentTime = 0;
    setSinging(false);
  };

  const sing = async () => {
    setError("");
    const filled = lines.map((l) => l.trim()).filter((l) => l.length > 0);
    if (filled.length === 0) {
      setError(s.errorEmpty);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/sing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: filled, character, lang }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || s.errorPlay);
        return;
      }

      // 声
      const voice = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      voiceRef.current = voice;

      // BGM(public/bgm/sing_loop.mp3 があれば流す。無ければ声だけ)
      const bgm = new Audio("/bgm/sing_loop.mp3");
      bgm.loop = true;
      bgm.volume = 0.22;
      bgmRef.current = bgm;

      voice.onended = () => {
        setTimeout(() => {
          bgm.pause();
          bgm.currentTime = 0;
          setSinging(false);
        }, 600);
      };

      setSinging(true);
      bgm.play().catch(() => {
        /* BGMが無い/再生不可でも声だけで続行 */
      });
      await voice.play();
    } catch {
      setError(s.errorPlay);
      setSinging(false);
    } finally {
      setLoading(false);
    }
  };

  const selected = CHARACTERS.find((c) => c.id === character)!;
  const selectedName = s.charNames[selected.id];

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: isNarrow ? "16px 12px 48px" : "28px 20px 64px",
      }}
    >
      <style>{`
        @keyframes singBounce {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          25%      { transform: translateY(-14px) rotate(2deg); }
          50%      { transform: translateY(0) rotate(-1deg); }
          75%      { transform: translateY(-8px) rotate(1deg); }
        }
        @keyframes noteFloat {
          0%   { transform: translateY(0) scale(0.7); opacity: 0; }
          15%  { opacity: 1; }
          100% { transform: translateY(-90px) scale(1.15); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .sing-anim { animation: none !important; }
        }
      `}</style>

      <h1 style={{ fontSize: isNarrow ? 22 : 28, margin: "0 0 4px" }}>
        {s.title}
      </h1>
      <p style={{ color: "#666", margin: "0 0 20px", fontSize: 14 }}>
        {s.subtitle}
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: isNarrow ? "column" : "row",
          gap: 20,
          alignItems: "stretch",
        }}
      >
        {/* ---- ステージ ---- */}
        <div
          style={{
            flex: isNarrow ? undefined : "0 0 340px",
            background:
              "linear-gradient(180deg, #FFF7ED 0%, #FFEDD5 100%)",
            border: "2px solid #FED7AA",
            borderRadius: 16,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            minHeight: isNarrow ? 240 : 320,
            overflow: "hidden",
          }}
        >
          {/* 音符(歌唱中のみ) */}
          {singing &&
            ["♪", "♫", "♪"].map((n, i) => (
              <span
                key={i}
                className="sing-anim"
                style={{
                  position: "absolute",
                  bottom: 70,
                  left: `${28 + i * 22}%`,
                  fontSize: 26,
                  color: "#F97316",
                  animation: `noteFloat 1.8s ease-out ${i * 0.5}s infinite`,
                  pointerEvents: "none",
                }}
              >
                {n}
              </span>
            ))}

          <img
            src={selected.img}
            alt={selectedName}
            className="sing-anim"
            style={{
              width: isNarrow ? 140 : 180,
              height: isNarrow ? 140 : 180,
              objectFit: "contain",
              animation: singing
                ? "singBounce 0.55s ease-in-out infinite"
                : "none",
            }}
          />
          <div
            style={{
              marginTop: 10,
              fontWeight: 700,
              color: "#9A3412",
              fontSize: 15,
            }}
          >
            {singing ? s.singingNow(selectedName) : selectedName}
          </div>

          {/* キャラ選択 */}
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            {CHARACTERS.map((c) => (
              <button
                key={c.id}
                onClick={() => !singing && setCharacter(c.id)}
                style={{
                  border:
                    c.id === character
                      ? "3px solid #F97316"
                      : "2px solid #E5E7EB",
                  borderRadius: 12,
                  background: "#fff",
                  padding: 6,
                  cursor: singing ? "default" : "pointer",
                  opacity: singing && c.id !== character ? 0.4 : 1,
                }}
                aria-label={s.selectChar(s.charNames[c.id])}
              >
                <img
                  src={c.img}
                  alt={s.charNames[c.id]}
                  style={{ width: 44, height: 44, objectFit: "contain" }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* ---- 歌詞入力 ---- */}
        <div
          style={{
            flex: 1,
            background: "#fff",
            border: "2px solid #E5E7EB",
            borderRadius: 16,
            padding: isNarrow ? 16 : 20,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 15 }}>
            {s.lyricsHeader}
          </div>

          {lines.map((line, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  width: 22,
                  textAlign: isRtl ? "left" : "right",
                  color: "#9CA3AF",
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <input
                value={line}
                maxLength={MAX_LINE_LEN}
                onChange={(e) => setLine(i, e.target.value)}
                placeholder={s.placeholders[i] ?? ""}
                disabled={singing}
                dir={isRtl ? "rtl" : "ltr"}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  border: "2px solid #E5E7EB",
                  borderRadius: 10,
                  fontSize: 15,
                  outline: "none",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "#F97316")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "#E5E7EB")
                }
              />
              {lines.length > 1 && (
                <button
                  onClick={() => removeLine(i)}
                  disabled={singing}
                  aria-label={s.removeLine(i + 1)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#9CA3AF",
                    cursor: "pointer",
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {lines.length < MAX_LINES && (
            <button
              onClick={addLine}
              disabled={singing}
              style={{
                border: "2px dashed #D1D5DB",
                background: "transparent",
                borderRadius: 10,
                padding: "8px 14px",
                color: "#6B7280",
                cursor: "pointer",
                fontSize: 13,
                marginBottom: 12,
              }}
            >
              {s.addLine(MAX_LINES - lines.length)}
            </button>
          )}

          {error && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#B91C1C",
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 14,
                marginBottom: 12,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            {!singing ? (
              <button
                onClick={sing}
                disabled={loading}
                style={{
                  flex: 1,
                  background: loading ? "#FDBA74" : "#F97316",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "14px 0",
                  fontSize: 17,
                  fontWeight: 700,
                  cursor: loading ? "wait" : "pointer",
                }}
              >
                {loading ? s.loading : s.singButton}
              </button>
            ) : (
              <button
                onClick={stopAll}
                style={{
                  flex: 1,
                  background: "#6B7280",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "14px 0",
                  fontSize: 17,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {s.stopButton}
              </button>
            )}
          </div>

          <p style={{ color: "#9CA3AF", fontSize: 12, marginTop: 10 }}>
            {s.footNote}
          </p>
        </div>
      </div>
    </div>
  );
}
