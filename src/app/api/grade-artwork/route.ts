import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.NEXT_PUBLIC_CLAUDE_API_KEY;

const RUBRICS: Record<string, { criteria: { name: string; description: string }[] }> = {
  'manga-basics': {
    criteria: [
      { name: 'コマ割り',     description: 'コマの大きさ・配置・読み順が適切か' },
      { name: 'キャラクター', description: 'キャラクターの形・バランス・個性があるか' },
      { name: '表情・感情',   description: '表情が豊かで感情が伝わるか' },
      { name: '線の質',       description: '線が安定していて意図的に描かれているか' },
      { name: 'ストーリー性', description: '絵だけで内容が伝わるか' },
    ],
  },
  'digital-illust': {
    criteria: [
      { name: '構図',         description: '画面内のバランスと配置が良いか' },
      { name: '色使い',       description: '色の組み合わせと配色が効果的か' },
      { name: 'レイヤー活用', description: 'デジタルツールの機能を使いこなしているか' },
      { name: '線と塗り',     description: 'アウトラインと塗りが綺麗か' },
      { name: '完成度',       description: '作品として仕上がっているか' },
    ],
  },
  'story-making': {
    criteria: [
      { name: '起承転結',     description: '物語の流れが明確か' },
      { name: 'キャラ設定',   description: 'キャラクターに個性・魅力があるか' },
      { name: 'セリフ',       description: 'セリフが自然で場面に合っているか' },
      { name: '独自性',       description: 'オリジナリティがあるか' },
      { name: '読みやすさ',   description: 'テンポよく読めるか' },
    ],
  },
  'animation-basics': {
    criteria: [
      { name: '動きの原理',   description: 'スムーズな動きの基本が理解されているか' },
      { name: 'タイミング',   description: 'フレーム間隔とスピードが適切か' },
      { name: '中割り',       description: '動きの中間フレームが自然か' },
      { name: 'アクション',   description: '動きに迫力・説得力があるか' },
      { name: '完成度',       description: 'アニメとして鑑賞できる仕上がりか' },
    ],
  },
};

const DEFAULT_RUBRIC = {
  criteria: [
    { name: '構成',   description: '全体のバランスと構成が良いか' },
    { name: '技術',   description: '技術的なスキルが発揮されているか' },
    { name: '表現力', description: '伝えたいことが表現されているか' },
    { name: '独自性', description: 'オリジナリティがあるか' },
    { name: '完成度', description: '作品として仕上がっているか' },
  ],
};

export async function POST(req: NextRequest) {
  try {
    const { courseId, fileName, fileType, comment, imageBase64 } = await req.json();

    if (!CLAUDE_API_KEY) {
      return NextResponse.json({ error: 'APIキーが設定されていません', success: false }, { status: 200 });
    }

    console.log('Grade API Key exists:', !!CLAUDE_API_KEY, CLAUDE_API_KEY?.substring(0, 10));

    const rubric = RUBRICS[courseId] || DEFAULT_RUBRIC;

    const rubricText = rubric.criteria
      .map((c, i) => `${i + 1}. ${c.name}（0〜20点）: ${c.description}`)
      .join('\n');

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
      text: `ファイル名: ${fileName}
生徒のコメント: 「${comment || 'なし'}」

以下のルーブリックで採点し、JSONのみで回答してください:

採点基準:
${rubricText}

回答形式（JSONのみ、前後の説明文不要）:
{
  "totalScore": <合計点 0-100>,
  "grades": [
    { "name": "項目名", "score": <点数 0-20>, "comment": "採点コメント1文" },
    { "name": "項目名", "score": <点数 0-20>, "comment": "採点コメント1文" },
    { "name": "項目名", "score": <点数 0-20>, "comment": "採点コメント1文" },
    { "name": "項目名", "score": <点数 0-20>, "comment": "採点コメント1文" },
    { "name": "項目名", "score": <点数 0-20>, "comment": "採点コメント1文" }
  ],
  "overallComment": "総評2〜3文（小中学生への励ましを含む）",
  "nextStep": "次に挑戦してほしいこと1文"
}`,
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
        max_tokens: 1000,
        system: 'あなたはTERRAKOYA（漫画・アニメ教育プラットフォーム）のAI採点官です。エジプト・中東の小中学生の作品を採点します。必ずJSONのみで回答し、前後に説明文を入れないでください。',
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Claude API error:', response.status, errText);
      return NextResponse.json({ error: `APIエラー(${response.status}): ${errText.substring(0, 200)}`, success: false }, { status: 200 });
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text || '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON not found');

    const gradeResult = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      ...gradeResult,
      rubricCriteria: rubric.criteria.map(c => c.name),
    });

  } catch (error) {
    console.error('Grade error:', error);
    return NextResponse.json({ error: `採点エラー: ${String(error)}`, success: false }, { status: 200 });
  }
}
