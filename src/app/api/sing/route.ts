// src/app/api/sing/route.ts
// 子どもが入力した歌詞を Google Cloud TTS で「歌風」に読み上げる API
// v4: 抑揚強化 — 音符に「長さ」を導入(リズム)、フレーズ末の音を「ー」で実際に伸ばし、
//     高音をわずかに強く(強弱)。v3(音符単位ピッチ)からの上積み
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
// [ピッチ(semitone), 長さ] の列。長さ 1=ふつうの音、2=伸ばす音。
// きらきら星型のリズム(♩♩♩♩♩♩♩̅)をベースにした童謡風4フレーズ
type Note = [number, number];
const PHRASES: Note[][] = [
  // 起: 上行して高音で伸ばす
  [[0, 1], [0, 1], [7, 1], [7, 1], [9, 1], [9, 1], [7, 2]],
  // 承: 下行して落ち着く
  [[4, 1], [4, 1], [2, 1], [2, 1], [0, 1], [0, 1], [2, 2]],
  // 転: 高めで動きをつける
  [[7, 1], [9, 1], [7, 1], [4, 1], [7, 1], [4, 1], [2, 2]],
  // 結: ドに戻って着地
  [[4, 1], [2, 1], [0, 1], [2, 1], [4, 1], [2, 1], [0, 2]],
];

// 音の長さ → 読み上げ速度(遅い=1音が長い)
const RATE_NORMAL = "70%";
const RATE_LONG = "45%";

// 日本語: この正規表現に完全一致する行のみ文字(モーラ)単位で歌う。
// 漢字が混ざる行は文字分割すると読みが壊れるため行単位ピッチにフォールバック
const KANA_ONLY = /^[\u3040-\u309F\u30A0-\u30FF\u30FC〜、。!!??・♪♫\s]+$/;
// 拗音・促音・長音は前の文字とくっつけて1モーラにする
const SMALL_KANA = "ぁぃぅぇぉゃゅょっァィゥェォャュョッ";
// 「ー」を付けて伸ばせない文字(撥音・促音・記号)
const NO_STRETCH = "んンっッ、。!!??・♪♫ー";

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

// 日本語の音を「ー」で実際に伸ばす(伸ばせる文字のみ)
function stretchJa(unit: string): string {
  const last = unit[unit.length - 1];
  if (NO_STRETCH.includes(last)) return unit;
  return unit + "ー";
}

function buildSsml(lines: string[], basePitch: number, lang: Lang): string {
  const lineParts = lines.map((line, li) => {
    const phrase = PHRASES[li % PHRASES.length];
    const units = splitUnits(line, lang);

    if (units) {
      const noteParts = units.map((u, ni) => {
        const [notePitch, noteLenRaw] = phrase[ni % phrase.length];
        const isLineLast = ni === units.length - 1;
        const isVeryLast = li === lines.length - 1 && isLineLast;

        // 行末の音は必ず伸ばす(パターン上の長さに関わらず)
        const noteLen = isLineLast ? 2 : noteLenRaw;
        // 曲の最後の音はドに着地
        const pitch = clampPitch(basePitch + (isVeryLast ? 0 : notePitch));
        const rate = noteLen === 2 ? RATE_LONG : RATE_NORMAL;
        // 高い音(ソ以上)はわずかに強く=サビ感。着地音も少し強く
        const vol =
          notePitch >= 7 && !isVeryLast
            ? ` volume="+2dB"`
            : isVeryLast
            ? ` volume="+1dB"`
            : "";

        // 伸ばす音は日本語なら「ー」を足して物理的に母音を伸ばす
        const text =
          lang === "ja" && noteLen === 2 ? stretchJa(u) : u;

        return `<prosody pitch="+${pitch}st" rate="${rate}"${vol}>${escapeSsml(
          text
        )}</prosody>`;
      });
      // 行間はブレス(息継ぎ)
      return noteParts.join("") + `<break time="450ms"/>`;
    }

    // フォールバック(漢字混じり日本語): 行単位ピッチ
    const p = clampPitch(basePitch + phrase[0][0]);
    return (
      `<prosody pitch="+${p}st" rate="85%">${escapeSsml(line)}</prosody>` +
      `<break time="450ms"/>`
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
