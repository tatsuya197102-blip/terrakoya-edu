// src/app/api/sing/route.ts
// 子どもが入力した歌詞を Google Cloud TTS で「歌風」に読み上げる API
// - lang (ja/en/ar) でボイス切替(案B: 言語に合わせて声も変わる)
// - SSML の prosody で行ごとにピッチを上下させてメロディ感を出す
// - キャラごとに基本ピッチを変える(うさぎ/ねこ/とり)
// - NGワード + 文字数制限で安全対策
//
// 必要な環境変数: GOOGLE_TTS_API_KEY

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

// ---- 制限値 ----
const MAX_LINES = 6;
const MAX_LINE_LEN = 30; // 英語は日本語より1行が長くなるので30に緩和
const MAX_TOTAL_LEN = 160;

// ---- NGワード(必要に応じて随時追加) ----
const NG_WORDS = [
  // 日本語
  "死ね", "殺す", "殺し", "自殺", "しね", "ころす",
  "きもい", "キモい", "うざい", "ウザい", "ぶす", "ブス", "デブ",
  "セックス", "えっち", "エッチ", "ちんこ", "まんこ", "おっぱい",
  "住所", "電話番号", "本名",
  // English
  "kill", "die", "sex", "fuck", "shit", "bitch", "stupid", "idiot",
  "suicide", "address", "phone number",
  // العربية
  "اقتل", "موت", "انتحار", "غبي", "جنس",
];

// 電話番号らしき数字列(個人情報対策)
const PHONE_LIKE = /\d{6,}/;

type Lang = "ja" | "en" | "ar";

// ---- 言語ごとのエラーメッセージ ----
const MSG: Record<Lang, Record<string, string>> = {
  ja: {
    empty: "歌詞を入力してね",
    tooLong: `歌詞が長すぎるよ(ぜんぶで${MAX_TOTAL_LEN}文字まで)`,
    lineTooLong: `1行は${MAX_LINE_LEN}文字までだよ`,
    personal: "電話番号などの個人情報は入れないでね",
    ngWord: "この言葉は歌にできないよ。べつの歌詞にしてみよう!",
    ttsFail: "うたの生成に失敗しました。もういちど試してね",
    serverError: "エラーが起きました。もういちど試してね",
  },
  en: {
    empty: "Please write some lyrics!",
    tooLong: `Lyrics are too long (max ${MAX_TOTAL_LEN} characters total)`,
    lineTooLong: `Each line can be up to ${MAX_LINE_LEN} characters`,
    personal: "Please don't include personal info like phone numbers",
    ngWord: "That word can't be in a song. Try different lyrics!",
    ttsFail: "Couldn't make the song. Please try again!",
    serverError: "Something went wrong. Please try again!",
  },
  ar: {
    empty: "اكتب كلمات الأغنية!",
    tooLong: `الكلمات طويلة جدًا (الحد الأقصى ${MAX_TOTAL_LEN} حرفًا)`,
    lineTooLong: `كل سطر حتى ${MAX_LINE_LEN} حرفًا`,
    personal: "لا تكتب معلومات شخصية مثل رقم الهاتف",
    ngWord: "لا يمكن غناء هذه الكلمة. جرّب كلمات أخرى!",
    ttsFail: "تعذّر إنشاء الأغنية. حاول مرة أخرى!",
    serverError: "حدث خطأ. حاول مرة أخرى!",
  },
};

// ---- 言語 × キャラの声設定 ----
// アラビア語は Neural2 が無いため Wavenet を使用
const VOICE: Record<Lang, { languageCode: string; voiceName: string }> = {
  ja: { languageCode: "ja-JP", voiceName: "ja-JP-Neural2-B" },
  en: { languageCode: "en-US", voiceName: "en-US-Neural2-F" },
  ar: { languageCode: "ar-XA", voiceName: "ar-XA-Wavenet-A" },
};

// キャラごとの基本ピッチ(semitone)。言語が変わっても関係は同じ:とりが一番高い
const CHARACTER_PITCH: Record<string, number> = {
  rabbit: 3,
  cat: 1,
  bird: 5,
};

// ---- 行ごとのメロディパターン(semitone 相対値) ----
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
  let lang: Lang = "ja";
  try {
    const apiKey = process.env.GOOGLE_TTS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "サーバー設定エラー(TTSキー未設定)" },
        { status: 500 }
      );
    }

    const body = await req.json();
    lang = (["ja", "en", "ar"] as const).includes(body.lang)
      ? body.lang
      : "ja";
    const m = MSG[lang];
    const character: string =
      typeof body.character === "string" ? body.character : "rabbit";
    const rawLines: unknown = body.lines;

    // ---- バリデーション ----
    if (!Array.isArray(rawLines) || rawLines.length === 0) {
      return NextResponse.json({ error: m.empty }, { status: 400 });
    }
    const lines = rawLines
      .map((l) => (typeof l === "string" ? l.trim() : ""))
      .filter((l) => l.length > 0)
      .slice(0, MAX_LINES);

    if (lines.length === 0) {
      return NextResponse.json({ error: m.empty }, { status: 400 });
    }

    const total = lines.join("").length;
    if (total > MAX_TOTAL_LEN) {
      return NextResponse.json({ error: m.tooLong }, { status: 400 });
    }
    for (const line of lines) {
      if (line.length > MAX_LINE_LEN) {
        return NextResponse.json({ error: m.lineTooLong }, { status: 400 });
      }
      if (PHONE_LIKE.test(line)) {
        return NextResponse.json({ error: m.personal }, { status: 400 });
      }
      const lower = line.toLowerCase();
      if (NG_WORDS.some((w) => lower.includes(w.toLowerCase()))) {
        return NextResponse.json({ error: m.ngWord }, { status: 400 });
      }
    }

    const voice = VOICE[lang];
    const basePitch = CHARACTER_PITCH[character] ?? CHARACTER_PITCH.rabbit;
    const ssml = buildSsml(lines, basePitch);

    // ---- Google Cloud TTS 呼び出し ----
    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { ssml },
          voice: {
            languageCode: voice.languageCode,
            name: voice.voiceName,
          },
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
      return NextResponse.json({ error: MSG[lang].ttsFail }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({ audioContent: data.audioContent });
  } catch (e) {
    console.error("sing api error:", e);
    return NextResponse.json(
      { error: MSG[lang].serverError },
      { status: 500 }
    );
  }
}
