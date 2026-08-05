// MARKER: TERRAKOYA_EDU_PATCH_USERS_RULE_V1
// 本番の Firestore ルールを取得し、users の read に「管理者は全件読める」を足して公開する。
//
//   node scripts/patch_users_rule_v1.js          -> dry-run(差分を表示するだけ)
//   node scripts/patch_users_rule_v1.js --apply  -> 新ルールセットを作成して公開
//
// 方針: リポジトリの firestore.rules は古い可能性があるので触らない。
//       必ず「本番の現行ルール」を起点に1行だけ書き換える。
// 実行前に現行ルールを firestore.rules.live_<timestamp>.bak に保存する。

const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

const saPath = path.join(__dirname, '..', 'service-account.json');
const sa = require(saPath);
const APPLY = process.argv.includes('--apply');

const ADMIN_EMAIL = 'tatsuya197102@gmail.com';

const OLD_LINE =
  "      allow read: if request.auth != null && request.auth.uid == userId;";

const NEW_LINE = [
  "      // 本人は自分のドキュメントを読める。加えて管理者は一覧(list)も読める。",
  "      // これが無いと管理画面の登録ユーザー一覧が permission-denied になる(2026-08-05)。",
  "      allow read: if request.auth != null",
  "                  && (request.auth.uid == userId",
  "                      || request.auth.token.email == '" + ADMIN_EMAIL + "');",
].join('\n');

(async function main() {
  const auth = new GoogleAuth({
    keyFile: saPath,
    scopes: ['https://www.googleapis.com/auth/firebase', 'https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const project = sa.project_id;
  const releaseName = 'projects/' + project + '/releases/cloud.firestore';

  // --- 現行ルールを取得 ---
  const rel = await client.request({ url: 'https://firebaserules.googleapis.com/v1/' + releaseName });
  const rulesetName = rel.data.rulesetName;
  console.log('[live ruleset] ' + rulesetName);

  const rs = await client.request({ url: 'https://firebaserules.googleapis.com/v1/' + rulesetName });
  const files = (rs.data.source && rs.data.source.files) || [];
  if (files.length !== 1) {
    console.log('[FATAL] expected exactly 1 rules file, got ' + files.length);
    process.exit(1);
  }
  const fileName = files[0].name;
  const current = files[0].content;

  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
  const bak = path.join(__dirname, '..', 'firestore.rules.live_' + stamp + '.bak');
  fs.writeFileSync(bak, current, 'utf8');
  console.log('[backup] ' + bak);

  // --- 既に適用済みか ---
  if (current.indexOf("request.auth.token.email == '" + ADMIN_EMAIL + "')") >= 0
      && current.indexOf('match /users/{userId}') >= 0
      && current.indexOf(OLD_LINE) < 0) {
    console.log('[skip] users rule already allows admin read. Nothing to do.');
    return;
  }

  const hits = current.split(OLD_LINE).length - 1;
  console.log('[match] target line found ' + hits + ' time(s)');
  if (hits !== 1) {
    console.log('[FATAL] expected exactly 1 occurrence. Aborting so nothing is broken.');
    console.log('        Looked for:');
    console.log('        ' + OLD_LINE);
    process.exit(1);
  }

  const patched = current.replace(OLD_LINE, NEW_LINE);

  console.log('');
  console.log('=== BEFORE ===');
  console.log(OLD_LINE);
  console.log('=== AFTER ===');
  console.log(NEW_LINE);
  console.log('');

  if (!APPLY) {
    console.log('[dry-run] nothing published. Re-run with --apply to publish.');
    return;
  }

  // --- 新ルールセットを作成 ---
  const created = await client.request({
    url: 'https://firebaserules.googleapis.com/v1/projects/' + project + '/rulesets',
    method: 'POST',
    data: { source: { files: [{ name: fileName, content: patched }] } },
  });
  console.log('[created ruleset] ' + created.data.name);

  // --- リリースを差し替え ---
  await client.request({
    url: 'https://firebaserules.googleapis.com/v1/' + releaseName,
    method: 'PATCH',
    data: { release: { name: releaseName, rulesetName: created.data.name } },
  });
  console.log('[published] ' + releaseName + ' -> ' + created.data.name);
  console.log('');
  console.log('Done. Reload /admin with Ctrl+Shift+R and the user list should appear.');
})().catch(function (e) {
  const msg = (e.response && e.response.data && JSON.stringify(e.response.data)) || e.message;
  console.log('[FATAL] ' + msg);
  process.exit(1);
});
