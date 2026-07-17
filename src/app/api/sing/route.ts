// src/app/api/sing/route.ts
// 子どもが入力した歌詞を Google Cloud TTS(Neural2)で「歌風」に読み上げる API
// - SSML の prosody で行ごとにピッチを上下させてメロディ感を出す
// - キャラごとに基本ピッチを変える(うさぎ/ねこ/とり)
// - NGワード + 文字数制限で安全対策
//
// 必要な環境変数: GOOGLE_TTS_API_KEY
//   (Google Cloud Console → APIとサービス → 認証情報 → APIキー作成、
//    「Cloud Text-to-Speech API」に制限をかけること)

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

// ---- 制限値 ----
const MAX_LINES = 6;
const MAX_LINE_LEN = 20;
const MAX_TOTAL_LEN = 120;

// ---- NGワード(必要に応じて随時追加) ----
const NG_WORDS = [
  "死ね", "殺す", "殺し", "自殺", "しね", "ころす",
  "きもい", "キモい", "うざい", "ウザい", "ぶす", "ブス", "デブ",
  "セックス", "えっち", "エッチ", "ちんこ", "まんこ", "おっぱい",
  "住所", "電話番号", "本名",
];

// 電話番号らしき数字列(個人情報対策)
const PHONE_LIKE = /\d{6,}/;

// ---- キャラごとの声設定 ----
// Neural2 の日本語ボイスを使い分け + 基本ピッチをずらす
const CHARACTER_VOICE: Record<
  string,
  { voiceName: string; basePitch: number }
> = {
  rabbit: { voiceName: "ja-JP-Neural2-B", basePitch: 3 },  // 明るく高め
  cat:    { voiceName: "ja-JP-Neural2-B", basePitch: 1 },  // ふつう
  bird:   { voiceName: "ja-JP-Neural2-B", basePitch: 5 },  // いちばん高い
};

// ---- 行ごとのメロディパターン(semitone 相対値) ----
// 4行なら「起・承・転・結」風に上がって下がる
const MELODY_PATTERN = [2, 5, 7, 4, 6, 0];

function escapeSsml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSsml(lines: string[], basePitch: number): string {
  const parts = lines.map((line, i) => {
    const pitch = basePitch + MELODY_PATTERN[i % MELODY_PATTERN.length];
    // 最終行だけ少しゆっくり + 下げて「終わった感」を出す
    const isLast = i === lines.length - 1;
    const rate = isLast ? "85%" : "92%";
    const p = isLast ? basePitch : pitch;
    return `<prosody pitch="+${p}st" rate="${rate}">${escapeSsml(
      line
    )}</prosody><break time="350ms"/>`;
  });
  return `<speak>${parts.join("")}</speak>`;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_TTS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "サーバー設定エラー(TTSキー未設定)" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const character: string =
      typeof body.character === "string" ? body.character : "rabbit";
    const rawLines: unknown = body.lines;

    // ---- バリデーション ----
    if (!Array.isArray(rawLines) || rawLines.length === 0) {
      return NextResponse.json({ error: "歌詞を入力してね" }, { status: 400 });
    }
    const lines = rawLines
      .map((l) => (typeof l === "string" ? l.trim() : ""))
      .filter((l) => l.length > 0)
      .slice(0, MAX_LINES);

    if (lines.length === 0) {
      return NextResponse.json({ error: "歌詞を入力してね" }, { status: 400 });
    }

    const total = lines.join("").length;
    if (total > MAX_TOTAL_LEN) {
      return NextResponse.json(
        { error: `歌詞が長すぎるよ(ぜんぶで${MAX_TOTAL_LEN}文字まで)` },
        { status: 400 }
      );
    }
    for (const line of lines) {
      if (line.length > MAX_LINE_LEN) {
        return NextResponse.json(
          { error: `1行は${MAX_LINE_LEN}文字までだよ` },
          { status: 400 }
        );
      }
      if (PHONE_LIKE.test(line)) {
        return NextResponse.json(
          { error: "電話番号などの個人情報は入れないでね" },
          { status: 400 }
        );
      }
      const lower = line.toLowerCase();
      if (NG_WORDS.some((w) => lower.includes(w.toLowerCase()))) {
        return NextResponse.json(
          { error: "この言葉は歌にできないよ。べつの歌詞にしてみよう!" },
          { status: 400 }
        );
      }
    }

    const voice = CHARACTER_VOICE[character] ?? CHARACTER_VOICE.rabbit;
    const ssml = buildSsml(lines, voice.basePitch);

    // ---- Google Cloud TTS 呼び出し ----
    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { ssml },
          voice: { languageCode: "ja-JP", name: voice.voiceName },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 1.0,
            volumeGainDb: 2.0,
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("TTS error:", res.status, errText);
      return NextResponse.json(
        { error: "うたの生成に失敗しました。もういちど試してね" },
        { status: 502 }
      );
    }

    const data = await res.json();
    // audioContent は base64 の MP3
    return NextResponse.json({ audioContent: data.audioContent });
  } catch (e) {
    console.error("sing api error:", e);
    return NextResponse.json(
      { error: "エラーが起きました。もういちど試してね" },
      { status: 500 }
    );
  }
}
