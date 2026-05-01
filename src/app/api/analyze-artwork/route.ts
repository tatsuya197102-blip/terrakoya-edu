import { NextRequest, NextResponse } from 'next/server';

const CLAUDE_API_KEY = process.env.NEXT_PUBLIC_CLAUDE_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { courseId, fileName, fileType, comment } = await req.json();

    if (!CLAUDE_API_KEY) {
      return NextResponse.json({ error: 'API キーが設定されていません' }, { status: 500 });
    }

    const prompt = `You are an expert art instructor providing constructive feedback on student artwork.

Course: ${courseId}
File Type: ${fileType}
Student Comment: "${comment || 'No comment provided'}"

Please provide detailed, encouraging, and actionable feedback in Japanese. Include:
1. What the student did well
2. Areas for improvement
3. Specific techniques or tips to try next time
4. Encouragement for continued learning

Keep the feedback concise but helpful (200-300 words).`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error('Claude API Error:', response.statusText);
      return NextResponse.json(
        { feedback: '✅ AIが分析中です。後でお試しください。' },
        { status: 200 }
      );
    }

    const data = await response.json();
    const feedback = data.content[0]?.text || 'フィードバックを生成できませんでした';

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { feedback: '📝 フィードバック機能はデモ用です。本番環境では有効になります。' },
      { status: 200 }
    );
  }
}