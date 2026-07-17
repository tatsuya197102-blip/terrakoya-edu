// src/app/api/sing/route.ts
// 子どもが入力した歌詞を Google Cloud TTS で「歌風」に読み上げる API
// v3: 音符単位メロディ — 日本語はモーラ(文字)単位、英/亜は単語単位でピッチを割り当て
//     童謡風ペンタトニック音階で上下するので、行単位ピッチより格段に歌らしくなる
//
// 必要な環境変数: GOOGLE_TTS_API_KEY

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

// ---- 制限値 ----
const MAX_LINES = 6;
const MAX_LINE_LEN = 30;
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

const PHONE_LIKE = /\d{6,}/;

type Lang = "ja" | "en" | "ar";

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

const VOICE: Record<Lang, { languageCode: string; voiceName: string }> = {
  ja: { languageCode: "ja-JP", voiceName: "ja-JP-Neural2-B" },
  en: { languageCode: "en-US", voiceName: "en-US-Neural2-F" },
  ar: { languageCode: "ar-XA", voiceName: "ar-XA-Wavenet-A" },
};

// キャラごとの基本ピッチ(semitone)
const CHARACTER_PITCH: Record<string, number> = {
  rabbit: 2,
  cat: 0,
  bird: 4,
};

// ---- メロディ定義 ----
// ペンタトニック(ド=0, レ=2, ミ=4, ソ=7, ラ=9)ベースの童謡風フレーズ。
// 行ごとにフレーズを切り替え、行内は音符単位で巡回する。
const PHRASES: number[][] = [
  [0, 0, 7, 7, 9, 9, 7],    // 起: 上行フレーズ
  [4, 4, 2, 2, 0, 0, 2],    // 承: 下行で応答
  [7, 7, 9, 9, 7, 4, 2],    // 転: 高めで動きをつける
  [4, 2, 0, 2, 4, 2, 0],    // 結: ドに戻って着地
];

// 音符ごとの読み上げ速度(遅いほど1音が伸びて歌らしい)
const NOTE_RATE = "70%";

// 日本語: この正規表現に完全一致する行のみ文字(モーラ)単位で歌う。
// 漢字が混ざる行は文字分割すると読みが壊れるため行単位ピッチにフォールバック
const KANA_ONLY = /^[\u3040-\u309F\u30A0-\u30FF\u30FC〜、。!!??・♪♫\s]+$/;
// 拗音・促音・長音は前の文字とくっつけて1モーラにする
const SMALL_KANA = "ぁぃぅぇぉゃゅょっァィゥェォャュョッ";

function escapeSsml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// 行を「音符に乗せる単位」に分割
function splitUnits(line: string, lang: Lang): string[] | null {
  if (lang === "ja") {
    if (!KANA_ONLY.test(line)) return null; // 漢字混じり → フォールバック
    const chars = [...line.replace(/\s+/g, "")];
    const units: string[] = [];
    for (const c of chars) {
      if (units.length > 0 && (SMALL_KANA.includes(c) || c === "ー")) {
        units[units.length - 1] += c; // 「きょ」「ちょ」「らー」等を1音に
      } else {
        units.push(c);
      }
    }
    return units.length > 0 ? units : null;
  }
  // 英語・アラビア語は単語単位
  const words = line.split(/\s+/).filter((w) => w.length > 0);
  return words.length > 0 ? words : null;
}

function clampPitch(p: number): number {
  return Math.max(-4, Math.min(14, p));
}

function buildSsml(lines: string[], basePitch: number, lang: Lang): string {
  const lineParts = lines.map((line, li) => {
    const phrase = PHRASES[li % PHRASES.length];
    const units = splitUnits(line, lang);

    if (units) {
      // 音符単位: 1音ずつピッチを割り当てる
      const noteParts = units.map((u, ni) => {
        const note = phrase[ni % phrase.length];
        // 最終行の最後の音はドに着地させる
        const isVeryLast =
          li === lines.length - 1 && ni === units.length - 1;
        const p = clampPitch(basePitch + (isVeryLast ? 0 : note));
        return `<prosody pitch="+${p}st" rate="${NOTE_RATE}">${escapeSsml(
          u
        )}</prosody>`;
      });
      return noteParts.join("") + `<break time="400ms"/>`;
    }

    // フォールバック(漢字混じり日本語): 行単位ピッチ
    const p = clampPitch(basePitch + phrase[0]);
    return (
      `<prosody pitch="+${p}st" rate="85%">${escapeSsml(line)}</prosody>` +
      `<break time="400ms"/>`
    );
  });
  return `<speak>${lineParts.join("")}</speak>`;
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
    const ssml = buildSsml(lines, basePitch, lang);

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
