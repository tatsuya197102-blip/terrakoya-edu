/**
 * users コレクション健康診断スクリプト
 *
 * 用途:
 *   - 既存ユーザーの role 設定状況を集計
 *   - パッチ前ログイン経験者が次回ログイン時に /onboarding に飛ぶか事前検証
 *   - role 別ユーザー数を把握
 *
 * 実行:
 *   node scripts/audit-users.mjs
 *
 * 出力例:
 *   合計ユーザー: 42
 *   role 未設定 (next login で onboarding): 15
 *   role: student: 25
 *   role: teacher: 2
 *   role: parent: 0
 *   role: other: 0
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

// === Firebase Admin 初期化 ===
const serviceAccount = JSON.parse(readFileSync('./service-account.json', 'utf-8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
  console.log('=== users コレクション健康診断 ===\n');

  const snap = await db.collection('users').get();
  const total = snap.size;

  const buckets = {
    null_or_missing: [],
    student: [],
    teacher: [],
    parent: [],
    other: [],
    unknown: [],
  };

  snap.forEach((doc) => {
    const data = doc.data();
    const role = data.role;
    const entry = {
      uid: doc.id,
      email: data.email || '(no email)',
      displayName: data.displayName || '(no name)',
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() || 'unknown',
      lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString?.() || 'unknown',
    };

    if (role === null || role === undefined) {
      buckets.null_or_missing.push(entry);
    } else if (['student', 'teacher', 'parent', 'other'].includes(role)) {
      buckets[role].push(entry);
    } else {
      buckets.unknown.push({ ...entry, role });
    }
  });

  // サマリー
  console.log(`合計ユーザー: ${total}`);
  console.log(`role 未設定 (next login で onboarding に飛ぶ): ${buckets.null_or_missing.length}`);
  console.log(`role: student: ${buckets.student.length}`);
  console.log(`role: teacher: ${buckets.teacher.length}`);
  console.log(`role: parent:  ${buckets.parent.length}`);
  console.log(`role: other:   ${buckets.other.length}`);
  if (buckets.unknown.length > 0) {
    console.log(`role: 不明値:  ${buckets.unknown.length}`);
  }
  console.log();

  // 詳細を CSV 出力
  mkdirSync('./out', { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const csvPath = `./out/users-audit-${ts}.csv`;

  const allEntries = [];
  for (const [bucket, list] of Object.entries(buckets)) {
    for (const e of list) {
      allEntries.push({ bucket, ...e });
    }
  }

  const csv = ['bucket,uid,email,displayName,createdAt,lastLoginAt']
    .concat(
      allEntries.map(
        (e) =>
          `${e.bucket},"${e.uid}","${e.email}","${e.displayName}","${e.createdAt}","${e.lastLoginAt}"`
      )
    )
    .join('\n');
  writeFileSync(csvPath, csv, 'utf-8');
  console.log(`詳細レポート: ${csvPath}`);

  // 未設定ユーザーの一部をサンプル表示
  if (buckets.null_or_missing.length > 0) {
    console.log('\n--- role 未設定ユーザーのサンプル (先頭 5 件) ---');
    buckets.null_or_missing.slice(0, 5).forEach((e) => {
      console.log(`  ${e.email} (${e.displayName}) — 最終ログイン: ${e.lastLoginAt}`);
    });
    console.log('\nこの方たちは次回ログイン時に /onboarding → 「生徒として始める」を経由します。');
  } else {
    console.log('\nrole 未設定ユーザーはゼロ。全員既にロール設定済み。');
  }
}

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});
