import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.NEXT_PUBLIC_CLAUDE_API_KEY;

const COURSE_LABELS: Record<string, string> = {
  'manga-basics': '漫画基礎講座',
  'digital-illust': 'デジタルイラスト入門',
  'story-making': 'ストーリー作り',
  'animation-basics': 'アニメーション基礎',
};

export async function POST(req: NextRequest) {
  try {
    const { courseId, fileName, fileType, comment, imageBase64 } = await req.json();

    if (!CLAUDE_API_KEY) {
      return NextResponse.json({ feedback: 'APIキーが設定されていません。' });
    }

    const courseLabel = COURSE_LABELS[courseId] || courseId;
    const userContent: any[] = [];

    if (imageBase64 && fileType?.startsWith('image/')) {
      userContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: fileType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data: imageBase64,
        },
      });
    }

    userContent.push({
      type: 'text',
      text: `コース：${courseLabel}\nファイル名：${fileName}\n生徒のコメント：「${comment || 'なし'}」\n\n${imageBase64 ? 'この作品を見て' : 'この課題提出について'}、日本語で励ましながら具体的なフィードバックを2〜3文でコンパクトに伝えてください。小中学生向けにわかりやすく、次に活かせるアドバイスを含めてください。絵文字を1つ使っても構いません。`,
    });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: 'あなたはTERRAKOYA（漫画・アニメ教育プラットフォーム）のAI講師です。エジプトや中東の小中学生が日本の漫画・アニメ技術を学んでいます。提出された作品に対して温かく、具体的で、次の一歩が見えるフィードバックを短く伝えてください。',
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Claude API Error:', err);
      return NextResponse.json({ feedback: 'フィードバックの生成に失敗しました。しばらくしてお試しください。' });
    }

    const data = await response.json();
    const feedback = data.content?.[0]?.text || 'フィードバックを生成できませんでした';
    return NextResponse.json({ feedback });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ feedback: 'エラーが発生しました。再度お試しください。' });
  }
}
