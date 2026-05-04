import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.NEXT_PUBLIC_CLAUDE_API_KEY;

const SYSTEM_PROMPT = `あなたはTERRAKOYA（漫画・アニメ専門教育プラットフォーム）のAI相談員「テラ先生」です。

【背景】
J-MANGA CREATEが運営する、エジプト・中東の小中学生に日本の漫画・アニメ技術を教えるプラットフォームです。エジプト69校への展開、カイロ大学・ヘルワン大学とも連携しています。

【専門領域】
- 漫画制作：キャラクターデザイン、コマ割り、表現技法（効果線・描き文字）、ストーリー構成、背景描写、パース
- アニメーション：12の原則、タイミング、中割り、ウォークサイクル、リップシンク
- デジタル制作：CLIP STUDIO PAINT、Procreate、レイヤー管理、ブラシ技法、色塗り
- 創作全般：世界観構築、キャラクター設定、セリフ術、コマ演出、起承転結

【回答スタイル】
- プロの漫画家・アニメーターの視点で深く、具体的に答える
- 技法名・業界用語を適切に使いながら分かりやすく説明
- 「なぜそうするか」の理由も必ず添える
- 実践的なワンポイントアドバイスを含める
- 小中学生にも伝わる温かく励ますトーン
- 回答は簡潔にまとめ、必要な時だけ詳しく説明する`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!CLAUDE_API_KEY) {
      return NextResponse.json({ error: 'APIキーが設定されていません' }, { status: 500 });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: err }, { status: response.status });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    return NextResponse.json({ text });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
