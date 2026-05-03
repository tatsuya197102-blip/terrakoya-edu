import { NextRequest, NextResponse } from 'next/server';

const CLAUDE_API_KEY = process.env.NEXT_PUBLIC_CLAUDE_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { characterDescription, theme, ageGroup } = await req.json();

    if (!CLAUDE_API_KEY) {
      return NextResponse.json(
        { error: 'API キーが設定されていません' },
        { status: 500 }
      );
    }

    const prompt = `You are a creative manga story writer. Create 3 different 4-panel manga story ideas for children.

Character Description: ${characterDescription}
Theme: ${theme}
Age Group: ${ageGroup}

For each story, provide exactly this JSON format (3 stories total):
{
  "stories": [
    {
      "id": 1,
      "title": "Story Title",
      "panels": [
        {"panelNumber": 1, "description": "Panel 1 scene description (one simple sentence)"},
        {"panelNumber": 2, "description": "Panel 2 scene description (one simple sentence)"},
        {"panelNumber": 3, "description": "Panel 3 scene description (one simple sentence)"},
        {"panelNumber": 4, "description": "Panel 4 scene description (one simple sentence, emotional or conclusion)"}
      ]
    },
    {
      "id": 2,
      "title": "Story Title",
      "panels": [
        {"panelNumber": 1, "description": "..."},
        {"panelNumber": 2, "description": "..."},
        {"panelNumber": 3, "description": "..."},
        {"panelNumber": 4, "description": "..."}
      ]
    },
    {
      "id": 3,
      "title": "Story Title",
      "panels": [
        {"panelNumber": 1, "description": "..."},
        {"panelNumber": 2, "description": "..."},
        {"panelNumber": 3, "description": "..."},
        {"panelNumber": 4, "description": "..."}
      ]
    }
  ]
}

Make stories simple, fun, and age-appropriate. Each panel should be one clear scene. Respond ONLY with valid JSON, no other text.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 2048,
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
        { error: 'ストーリー生成に失敗しました' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const responseText = data.content[0]?.text || '';

    // JSONパース
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from API');
    }

    const storyData = JSON.parse(jsonMatch[0]);

    return NextResponse.json(storyData);
  } catch (error) {
    console.error('Error in /api/generate-4manga:', error);
    return NextResponse.json(
      { error: 'ストーリー生成処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
