import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.NEXT_PUBLIC_CLAUDE_API_KEY;

const SYSTEM_PROMPTS: Record<string, string> = {
  ja: 'あなたはTERRAKOYA（漫画・アニメ教育プラットフォーム）のAI講師テラ先生です。エジプトや中東の小中学生が日本の漫画・アニメ技術を学んでいます。提出された作品に対して温かく、具体的で、次の一歩が見えるフィードバックを日本語で短く伝えてください。',
  en: 'You are Tera-sensei, an AI instructor at TERRAKOYA (a manga & anime education platform). Elementary and middle school students in Egypt and the Middle East are learning Japanese manga and anime techniques. Give warm, specific, and actionable feedback in English in 2-3 sentences.',
  ar: 'أنت المعلم تيرا، مدرس الذكاء الاصطناعي في منصة TERRAKOYA لتعليم المانغا والأنيمي. الطلاب من مصر والشرق الأوسط يتعلمون تقنيات المانغا والأنيمي الياباني. قدم تغذية راجعة دافئة ومحددة وقابلة للتطبيق باللغة العربية في 2-3 جمل.',
};

const FEEDBACK_PROMPTS: Record<string, (course: string, file: string, comment: string, hasImage: boolean) => string> = {
  ja: (course, file, comment, hasImage) =>
    `コース：${course}\nファイル名：${file}\n生徒のコメント：「${comment || 'なし'}」\n\n${hasImage ? 'この作品を見て' : 'この課題について'}、日本語で励ましながら具体的なフィードバックを2〜3文でコンパクトに伝えてください。小中学生向けにわかりやすく、次に活かせるアドバイスを含めてください。絵文字を1つ使っても構いません。`,
  en: (course, file, comment, hasImage) =>
    `Course: ${course}\nFile: ${file}\nStudent comment: "${comment || 'none'}"\n\nPlease give warm and specific feedback in English in 2-3 sentences about ${hasImage ? 'this artwork' : 'this submission'}. Make it easy to understand for elementary/middle school students, and include actionable advice. You may use one emoji.`,
  ar: (course, file, comment, hasImage) =>
    `الدورة: ${course}\nالملف: ${file}\nتعليق الطالب: "${comment || 'لا يوجد'}"\n\nيرجى تقديم تغذية راجعة دافئة ومحددة باللغة العربية في 2-3 جمل عن ${hasImage ? 'هذا العمل الفني' : 'هذه المهمة'}. اجعلها سهلة الفهم لطلاب المرحلة الابتدائية والإعدادية، وأضف نصائح عملية. يمكنك استخدام رمز تعبيري واحد.`,
};

const COURSE_LABELS: Record<string, Record<string, string>> = {
  ja: {
    'manga-basics': '漫画基礎講座',
    'digital-illust': 'デジタルイラスト入門',
    'story-making': 'ストーリー作り',
    'animation-basics': 'アニメーション基礎',
    'auto-4manga': '4コマ漫画メーカー',
  },
  en: {
    'manga-basics': 'Manga Basics',
    'digital-illust': 'Digital Illustration',
    'story-making': 'Story Creation',
    'animation-basics': 'Animation Basics',
    'auto-4manga': '4-Koma Manga Maker',
  },
  ar: {
    'manga-basics': 'أساسيات المانغا',
    'digital-illust': 'الرسم الرقمي',
    'story-making': 'كتابة القصص',
    'animation-basics': 'أساسيات الرسوم المتحركة',
    'auto-4manga': 'صانع مانغا 4 لوحات',
  },
};

export async function POST(req: NextRequest) {
  try {
    const { courseId, fileName, fileType, comment, imageBase64, lang = 'ja' } = await req.json();

    if (!CLAUDE_API_KEY) {
      const msg = lang === 'ar' ? 'مفتاح API غير مضبوط' : lang === 'en' ? 'API key not configured' : 'APIキーが設定されていません';
      return NextResponse.json({ feedback: msg });
    }

    const safeLang = ['ja', 'en', 'ar'].includes(lang) ? lang : 'en';
    const courseLabel = COURSE_LABELS[safeLang]?.[courseId] || courseId;
    const systemPrompt = SYSTEM_PROMPTS[safeLang];
    const promptFn = FEEDBACK_PROMPTS[safeLang];

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
      text: promptFn(courseLabel, fileName, comment || '', !!(imageBase64 && fileType?.startsWith('image/'))),
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
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Claude API Error:', response.status, err);
      const errMsg = lang === 'ar' ? `خطأ API (${response.status})` : lang === 'en' ? `API Error (${response.status})` : `APIエラー(${response.status})`;
      return NextResponse.json({ feedback: errMsg });
    }

    const data = await response.json();
    const feedback = data.content?.[0]?.text || (
      lang === 'ar' ? 'تعذر إنشاء التغذية الراجعة' :
      lang === 'en' ? 'Could not generate feedback' :
      'フィードバックを生成できませんでした'
    );
    return NextResponse.json({ feedback });

  } catch (error) {
    console.error('Error:', error);
    const { lang = 'ja' } = await req.json().catch(() => ({}));
    const errMsg = lang === 'ar' ? 'حدث خطأ' : lang === 'en' ? 'An error occurred' : 'エラーが発生しました';
    return NextResponse.json({ feedback: errMsg });
  }
}
