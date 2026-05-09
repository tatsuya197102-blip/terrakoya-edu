import { NextRequest, NextResponse } from 'next/server';

// 親・先生へのメール通知API
// Resend（無料プラン: 3000通/月）を使用
// 環境変数: RESEND_API_KEY

export async function POST(req: NextRequest) {
  try {
    const { type, studentName, parentEmail, data } = await req.json();

    if (!parentEmail) {
      return NextResponse.json({ error: 'No parent email' }, { status: 400 });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      // APIキー未設定の場合はスキップ（エラーにしない）
      console.log('RESEND_API_KEY not set, skipping email');
      return NextResponse.json({ skipped: true });
    }

    const subject = getSubject(type, studentName, data);
    const html = getHtml(type, studentName, data);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'TERRAKOYA <noreply@terrakoya-edu.vercel.app>',
        to: parentEmail,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      return NextResponse.json({ error: err }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notify error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

function getSubject(type: string, studentName: string, data: any): string {
  switch (type) {
    case 'submission':
      return `🎨 ${studentName}さんが新しい作品を投稿しました | TERRAKOYA`;
    case 'levelup':
      return `🎉 ${studentName}さんがレベルアップしました！ | TERRAKOYA`;
    case 'streak':
      return `🔥 ${studentName}さんが${data.days}日連続学習を達成！ | TERRAKOYA`;
    case 'weekly_report':
      return `📊 今週の${studentName}さんの学習レポート | TERRAKOYA`;
    default:
      return `📬 TERRAKOYAからのお知らせ`;
  }
}

function getHtml(type: string, studentName: string, data: any): string {
  const baseStyle = `
    font-family: Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    background: #0f172a;
    color: #f1f5f9;
    border-radius: 12px;
    overflow: hidden;
  `;

  const header = `
    <div style="background: linear-gradient(135deg, #1d4ed8, #7c3aed); padding: 32px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; color: white;">🎨 TERRAKOYA</h1>
      <p style="margin: 8px 0 0; color: #bfdbfe; font-size: 14px;">漫画・アニメ教育プラットフォーム</p>
    </div>
  `;

  const footer = `
    <div style="padding: 24px; text-align: center; border-top: 1px solid #1e293b;">
      <p style="color: #64748b; font-size: 12px; margin: 0;">
        このメールはTERRAKOYAの保護者通知設定により送信されています。<br>
        <a href="https://terrakoya-edu.vercel.app" style="color: #3b82f6;">TERRAKOYAを開く</a>
      </p>
    </div>
  `;

  let body = '';

  switch (type) {
    case 'submission':
      body = `
        <div style="padding: 32px;">
          <h2 style="color: #fbbf24; margin-top: 0;">🎨 新しい作品を投稿しました！</h2>
          <p style="color: #cbd5e1; line-height: 1.6;">
            <strong style="color: white;">${studentName}</strong>さんが新しい作品「<strong style="color: #60a5fa;">${data.title || '無題'}</strong>」を投稿しました。
          </p>
          <div style="background: #1e293b; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; color: #94a3b8; font-size: 14px;">📚 コース: ${data.courseId || '-'}</p>
            ${data.grade ? `<p style="margin: 8px 0 0; color: #fbbf24;">⭐ AI評価: ${data.grade}点</p>` : ''}
          </div>
          <a href="https://terrakoya-edu.vercel.app/gallery" 
             style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            ギャラリーで見る →
          </a>
        </div>
      `;
      break;

    case 'levelup':
      body = `
        <div style="padding: 32px; text-align: center;">
          <div style="font-size: 64px; margin-bottom: 16px;">${data.icon || '🎉'}</div>
          <h2 style="color: #fbbf24; margin-top: 0;">レベルアップ！</h2>
          <p style="color: #cbd5e1; line-height: 1.6;">
            <strong style="color: white;">${studentName}</strong>さんが
            <strong style="color: #60a5fa;">Lv.${data.level}</strong> に到達しました！
          </p>
          <div style="background: #1e293b; border-radius: 8px; padding: 16px; margin: 16px auto; max-width: 300px;">
            <p style="margin: 0; color: #fbbf24; font-size: 20px; font-weight: bold;">${data.title}</p>
            <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">⚡ 合計XP: ${data.xp}</p>
          </div>
        </div>
      `;
      break;

    case 'streak':
      body = `
        <div style="padding: 32px; text-align: center;">
          <div style="font-size: 64px; margin-bottom: 16px;">🔥</div>
          <h2 style="color: #f97316; margin-top: 0;">${data.days}日連続学習！</h2>
          <p style="color: #cbd5e1; line-height: 1.6;">
            <strong style="color: white;">${studentName}</strong>さんが
            <strong style="color: #f97316;">${data.days}日連続</strong>でTERRAKOYAにログインしました。
            毎日コツコツ頑張っています！
          </p>
        </div>
      `;
      break;

    case 'weekly_report':
      body = `
        <div style="padding: 32px;">
          <h2 style="color: #22c55e; margin-top: 0;">📊 今週の学習レポート</h2>
          <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;">
            ${new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}週
          </p>
          <div style="display: grid; gap: 12px;">
            ${[
              { icon: '🔥', label: '連続ログイン', value: `${data.streak}日` },
              { icon: '🎨', label: '投稿作品数', value: `${data.submissions}作品` },
              { icon: '⚡', label: '獲得XP', value: `+${data.xpGained} XP` },
              { icon: '📚', label: '現在のレベル', value: `Lv.${data.level} ${data.levelTitle}` },
            ].map(item => `
              <div style="background: #1e293b; border-radius: 8px; padding: 14px; display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 24px;">${item.icon}</span>
                <div>
                  <p style="margin: 0; color: #64748b; font-size: 12px;">${item.label}</p>
                  <p style="margin: 4px 0 0; color: white; font-weight: bold;">${item.value}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      break;
  }

  return `<div style="${baseStyle}">${header}${body}${footer}</div>`;
}
