import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { characterName, theme, lang } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_CLAUDE_API_KEY || process.env.CLAUDE_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ stories: [] });
    }

    const prompt = lang === 'ar'
      ? `أنت كاتب مانجا للأطفال. أنشئ 3 قصص مانجا من 4 لوحات للشخصية "${characterName}" حول موضوع "${theme}". أجب بتنسيق JSON فقط: [{"title":"...","panels":[{"panel":1,"scene":"...","dialogue":"..."},{"panel":2,"scene":"...","dialogue":"..."},{"panel":3,"scene":"...","dialogue":"..."},{"panel":4,"scene":"...","dialogue":"..."}]}]`
      : `あなたは子供向けマンガの作家です。キャラクター「${characterName}」の「${theme}」テーマの4コマ漫画を3つ作ってください。JSON形式のみで回答: [{"title":"...","panels":[{"panel":1,"scene":"...","dialogue":"..."},{"panel":2,"scene":"...","dialogue":"..."},{"panel":3,"scene":"...","dialogue":"..."},{"panel":4,"scene":"...","dialogue":"..."}]}]`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) return NextResponse.json({ stories: [] });

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      const stories = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ stories });
    }

    return NextResponse.json({ stories: [] });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ stories: [] });
  }
}
