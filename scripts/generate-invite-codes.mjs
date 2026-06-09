/**
 * 招待コード一括生成スクリプト
 *
 * 使い方:
 *   1. Firebase コンソール > プロジェクト設定 > サービスアカウント
 *      → 「新しい秘密鍵の生成」で JSON をダウンロード
 *      → ./service-account.json として保存 (.gitignore 必須)
 *   2. npm install firebase-admin
 *   3. node scripts/generate-invite-codes.mjs --role teacher --school ejs-cairo-01 --count 20
 *
 * 出力: CSV (コード一覧) を ./out/codes-YYYYMMDD-HHMM.csv に保存。
 *       校長に渡して配布させる用。
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { randomBytes } from 'crypto';

// === 引数パース ===
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1]]);
    return acc;
  }, [])
);

const role = args.role;            // 'teacher' | 'parent'
const schoolId = args.school || ''; // 'ejs-cairo-01' 等
const count = parseInt(args.count || '10', 10);
const expireDays = parseInt(args.expireDays || '90', 10);
const note = args.note || '';

if (!['teacher', 'parent'].includes(role)) {
  console.error('Error: --role must be teacher or parent');
  process.exit(1);
}

// === Firebase Admin 初期化 ===
const serviceAccount = JSON.parse(readFileSync('./service-account.json', 'utf-8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// === コード生成 ===
function generateCode(role, schoolId) {
  const prefix = role.toUpperCase().slice(0, 4); // TEAC / PARE
  const school = schoolId ? schoolId.toUpperCase().replace(/-/g, '') : 'GEN';
  const rand = randomBytes(3).toString('hex').toUpperCase(); // 6 桁
  return `${prefix}-${school}-${rand}`;
}

// === 実行 ===
async function main() {
  const expiresAt = Date.now() + expireDays * 24 * 60 * 60 * 1000;
  const generated = [];

  for (let i = 0; i < count; i++) {
    const code = generateCode(role, schoolId);
    const docData = {
      code,
      role,
      schoolId: schoolId || null,
      usedBy: null,
      usedAt: null,
      expiresAt,
      createdBy: 'admin-script',
      createdAt: Date.now(),
      note: note || null,
    };
    await db.collection('invite_codes').doc(code).set(docData);
    generated.push(code);
    console.log(`✓ ${code}`);
  }

  // CSV 出力
  mkdirSync('./out', { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const csvPath = `./out/codes-${role}-${schoolId || 'gen'}-${ts}.csv`;
  const csv = ['code,role,schoolId,expiresAt,note']
    .concat(
      generated.map(
        (c) => `${c},${role},${schoolId},"${new Date(expiresAt).toISOString()}","${note}"`
      )
    )
    .join('\n');
  writeFileSync(csvPath, csv, 'utf-8');
  console.log(`\n${count} 件のコードを生成。CSV: ${csvPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
