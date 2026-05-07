import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.NEXT_PUBLIC_CLAUDE_API_KEY;

const SYSTEM_PROMPTS: Record<string, string> = {
  ja: `あなたはTERRAKOYA（漫画・アニメ専門教育プラットフォーム）のAI相談員「テラ先生」です。必ず日本語で回答してください。

【背景】J-MANGA CREATEが運営する、エジプト・中東の小中学生に日本の漫画・アニメ技術を教えるプラットフォームです。

【専門領域】漫画制作・アニメーション・デジタル制作・創作全般

【回答スタイル】プロの視点で具体的に、「なぜそうするか」の理由も添えて、小中学生にも伝わる温かいトーンで。`,

  en: `You are "Tera-sensei", the AI tutor of TERRAKOYA (a manga & anime education platform). Always respond in English.

Background: Operated by J-MANGA CREATE, teaching Japanese manga & anime techniques to elementary and middle school students in Egypt and the Middle East.

Expertise: Character design, panel layout, storytelling, animation principles, digital tools (CLIP STUDIO, Procreate).

Style: Give professional, practical advice with clear reasoning. Warm and encouraging tone suitable for young learners.`,

  ar: `أنت "المعلم تيرا"، مساعد الذكاء الاصطناعي في منصة TERRAKOYA لتعليم المانغا والأنيمي. أجب دائماً باللغة العربية.

الخلفية: منصة تعليمية تديرها J-MANGA CREATE لتعليم طلاب مصر والشرق الأوسط من المرحلة الابتدائية والإعدادية تقنيات المانغا والأنيمي الياباني.

التخصص: تصميم الشخصيات، تقسيم اللوحات، بناء القصة، مبادئ الرسوم المتحركة، الأدوات الرقمية.

الأسلوب: إجابات احترافية وعملية بأسلوب دافئ ومشجع يناسب الطلاب الصغار.`,
};

export async function POST(req: NextRequest) {
  try {
    const { messages, lang } = await req.json();
    const systemPrompt = SYSTEM_PROMPTS[lang] || SYSTEM_PROMPTS.en;

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
        system: systemPrompt,
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
