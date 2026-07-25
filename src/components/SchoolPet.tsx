// src/components/SchoolPet.tsx
// ダッシュボード用「がっこうの子」カード(Phase 1)
// - pets/school を購読して今日の様子を表示
// - 日付が変わっていれば表示上リセット(書き込みは feedPet 側で実施)
// - ja/en/ar インライン辞書(/sing と同方式)、AR時 RTL
// - 白背景カードのためダークモードでも文字色を明示指定

"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { moodFor, todayStr, DAILY_USER_CAP, type PetMood } from "@/lib/pet";

const STRINGS: Record<string, Record<string, string>> = {
  ja: {
    name_rabbit: "がっこうの うさぎちゃん",
    name_cat: "がっこうの ねこちゃん",
    name_bird: "がっこうの とりちゃん",
    sleeping: "すやすや ねんね中…",
    happy: "きょうは げんき!",
    delighted: "とっても うれしそう!",
    satisfied: "きょうは だいまんぞく!",
    welcomeBack: "まってたよ!",
    together: "みんなで",
    yourToday: "きょう あなたが あげた ♥",
    hint: "レッスンや おえかき、うたで ♥ が あげられるよ",
  },
  en: {
    name_rabbit: "Our School Bunny",
    name_cat: "Our School Cat",
    name_bird: "Our School Bird",
    sleeping: "Fast asleep…",
    happy: "Feeling good today!",
    delighted: "So happy!",
    satisfied: "Totally satisfied today!",
    welcomeBack: "Welcome back!",
    together: "all together",
    yourToday: "Hearts you gave today ♥",
    hint: "Finish a lesson, paint, or sing to give ♥",
  },
  ar: {
    name_rabbit: "أرنب مدرستنا",
    name_cat: "قطة مدرستنا",
    name_bird: "طائر مدرستنا",
    sleeping: "نائم بهدوء…",
    happy: "سعيد اليوم!",
    delighted: "فرحان جدًا!",
    satisfied: "راضٍ تمامًا اليوم!",
    welcomeBack: "اشتقنا لك!",
    together: "معًا",
    yourToday: "القلوب التي أعطيتها اليوم ♥",
    hint: "أكمل درسًا أو ارسم أو غنِّ لتعطي ♥",
  },
};

const EMOJI: Record<string, string> = { rabbit: "🐰", cat: "🐱", bird: "🐦" };

export default function SchoolPet() {
  const { i18n } = useTranslation();
  const lang = (["ja", "en", "ar"].includes(i18n.language) ? i18n.language : "ja") as
    | "ja"
    | "en"
    | "ar";
  const t = STRINGS[lang];
  const isRtl = lang === "ar";

  const [uid, setUid] = useState<string | null>(null);
  const [pet, setPet] = useState<any | null>(null);
  const [myToday, setMyToday] = useState(0);
  const [welcomeBack, setWelcomeBack] = useState(false);

  const today = todayStr();

  useEffect(() => onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null)), []);

  // pets/school を購読
  useEffect(() => {
    return onSnapshot(doc(db, "pets", "school"), (snap) => {
      setPet(snap.exists() ? snap.data() : null);
    });
  }, []);

  // 自分の今日の給餌数を購読
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(doc(db, "pets", "school", "feeds", today), (snap) => {
      const d = snap.exists() ? (snap.data() as any) : null;
      setMyToday(d?.byUser?.[uid] ?? 0);
    });
  }, [uid, today]);

  // 7日以上ぶりの再会演出(users/{uid}.lastActiveDay 基準)
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      const last = (snap.data() as any)?.lastActiveDay;
      if (last) {
        const diff =
          (new Date(today).getTime() - new Date(last).getTime()) / 86400000;
        if (diff >= 7) setWelcomeBack(true);
      }
      unsub(); // 初回だけ判定
    });
  }, [uid, today]);

  const view = useMemo(() => {
    const character: string = pet?.character ?? "cat";
    // 日付が古いドキュメントは表示上0扱い(書き込みは feedPet が行う)
    const hearts = pet && pet.todayDate === today ? pet.todayHearts ?? 0 : 0;
    const goal = pet?.dailyGoal ?? 20;
    const mood: PetMood = moodFor(hearts, goal);
    return { character, hearts, goal, mood };
  }, [pet, today]);

  const name = t[`name_${view.character}`] ?? t.name_cat;
  const moodText = welcomeBack && view.mood === "sleeping" ? t.welcomeBack : t[view.mood];
  const showGauge = view.mood !== "satisfied"; // 達成後は「あと◯」を出さない

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      style={{
        background: "#ffffff",
        borderRadius: 16,
        padding: "16px 20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        display: "flex",
        alignItems: "center",
        gap: 16,
        color: "#111827",
        WebkitTextFillColor: "#111827",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontSize: 48,
          lineHeight: 1,
          animation:
            view.mood === "sleeping" ? undefined : "petBounce 1.6s ease-in-out infinite",
        }}
        aria-hidden
      >
        {view.mood === "sleeping" ? "💤" : ""}
        {EMOJI[view.character] ?? "🐱"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{name}</div>
        <div style={{ fontSize: 14, marginTop: 2 }}>{moodText}</div>
        {showGauge ? (
          <div style={{ fontSize: 13, marginTop: 6, color: "#6b7280", WebkitTextFillColor: "#6b7280" }}>
            ♥ {view.hearts} / {view.goal}({t.together})
          </div>
        ) : (
          <div style={{ fontSize: 13, marginTop: 6, color: "#6b7280", WebkitTextFillColor: "#6b7280" }}>
            ♥ {view.hearts}({t.together})
          </div>
        )}
        <div style={{ fontSize: 12, marginTop: 4, color: "#6b7280", WebkitTextFillColor: "#6b7280" }}>
          {t.yourToday}: {myToday} / {DAILY_USER_CAP}
          {myToday === 0 ? ` — ${t.hint}` : ""}
        </div>
      </div>
      <style jsx>{`
        @keyframes petBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          div { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
