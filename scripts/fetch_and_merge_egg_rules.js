// scripts/fetch_and_merge_egg_rules.js
// TERRAKOYA-edu E-12: 本番で動いている Firestore ルールを取得し、eggCodes ブロックを足す
// マーカー: TERRAKOYA_MERGE_EGG_RULES_V1
//
// なぜサーバーから取るのか:
//   リポジトリの firestore.rules は本番より古い可能性がある(pets / songs のルールが無い)。
//   ローカルのファイルをそのまま deploy すると本番のルールを上書きして機能が壊れる。
//   そこで「今デプロイされているルール」を正として、そこに追記する。
//
// 実行: node scripts/fetch_and_merge_egg_rules.js   (リポジトリ直下から)
// 依存: firebase-admin 同梱の google-auth-library / service-account.json

const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

const SA_PATH = 'service-account.json';
const RULES_PATH = 'firestore.rules';

const EGG_BLOCK = `
    // ── たまご引換コード (E-12) ──────────────────────────────
    // 児童は自分名義のコードを「作る」ことだけできる。
    // 使用済みフラグ(usedAt)は Study からの検証API(Admin SDK)だけが書く。
    match /eggCodes/{code} {
      allow create: if request.auth != null
                    && request.resource.data.uid == request.auth.uid
                    && request.resource.data.usedAt == null
                    && request.resource.data.keys().hasOnly(
                         ['uid', 'term', 'character', 'termHearts', 'createdAt', 'usedAt']
                       );
      allow read: if request.auth != null
                  && resource.data.uid == request.auth.uid;
      allow update, delete: if false;
    }
`;

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

async function main() {
  if (!fs.existsSync(SA_PATH)) {
    console.error(`[NG] ${SA_PATH} が見つかりません`);
    process.exit(1);
  }
  const projectId = JSON.parse(fs.readFileSync(SA_PATH, 'utf8')).project_id;
  if (!projectId) {
    console.error('[NG] service-account.json に project_id がありません');
    process.exit(1);
  }
  console.log(`[--] project: ${projectId}`);

  const auth = new GoogleAuth({
    keyFile: SA_PATH,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();

  // 1) 現在リリース中のルールセット名を引く
  const rel = await client.request({
    url: `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore`,
  });
  const rulesetName = rel.data && rel.data.rulesetName;
  if (!rulesetName) {
    console.error('[NG] リリース中のルールセットを特定できませんでした');
    process.exit(1);
  }
  console.log(`[--] ruleset: ${rulesetName}`);

  // 2) 本文を取得
  const rs = await client.request({ url: `https://firebaserules.googleapis.com/v1/${rulesetName}` });
  const files = (rs.data && rs.data.source && rs.data.source.files) || [];
  if (files.length === 0) {
    console.error('[NG] ルール本文が空です');
    process.exit(1);
  }
  let live = files[0].content.replace(/\r\n/g, '\n');
  console.log(`[OK] 本番ルールを取得 (${live.split('\n').length} 行)`);

  // 3) ローカルとの差を報告(古いかどうかの判断材料)
  if (fs.existsSync(RULES_PATH)) {
    const local = fs.readFileSync(RULES_PATH, 'utf8').replace(/\r\n/g, '\n');
    const localCols = new Set([...local.matchAll(/match \/([A-Za-z_][\w-]*)/g)].map((m) => m[1]));
    const liveCols = new Set([...live.matchAll(/match \/([A-Za-z_][\w-]*)/g)].map((m) => m[1]));
    const onlyLive = [...liveCols].filter((c) => !localCols.has(c));
    const onlyLocal = [...localCols].filter((c) => !liveCols.has(c));
    if (onlyLive.length) console.log(`[!!] 本番にだけ存在: ${onlyLive.join(', ')}  ← ローカルは古い`);
    if (onlyLocal.length) console.log(`[!!] ローカルにだけ存在: ${onlyLocal.join(', ')}`);
    if (!onlyLive.length && !onlyLocal.length) console.log('[OK] ローカルと本番でコレクションの顔ぶれは一致');
  }

  // 4) 本番ルールをそのまま控える
  const backup = `firestore.rules.live_${stamp()}.bak`;
  fs.writeFileSync(backup, live, 'utf8');
  console.log(`[OK] 本番ルールを保存: ${backup}`);

  // 5) 既に入っていれば何もしない
  if (/match\s+\/eggCodes\//.test(live)) {
    fs.writeFileSync(RULES_PATH, live, 'utf8');
    console.log('[OK] eggCodes は既に本番ルールに入っています。firestore.rules を本番の内容にそろえました');
    return;
  }

  // 6) 末尾の「  }\n}」の直前に差し込む
  const anchor = live.lastIndexOf('\n  }\n}');
  if (anchor < 0) {
    console.error('[NG] 差し込み位置(documents ブロックの末尾)を特定できませんでした。手で追記してください');
    process.exit(1);
  }
  const merged = live.slice(0, anchor) + '\n' + EGG_BLOCK + live.slice(anchor);

  // 7) 検算: 元の行が1つも消えていないか / 括弧が閉じているか
  const missing = live
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .filter((l) => !merged.includes(l));
  if (missing.length > 0) {
    console.error(`[NG] 元のルールが ${missing.length} 行失われています。中止します`);
    console.error(missing.slice(0, 5).join('\n'));
    process.exit(1);
  }
  const open = (merged.match(/{/g) || []).length;
  const close = (merged.match(/}/g) || []).length;
  if (open !== close) {
    console.error(`[NG] 括弧の数が合いません (open=${open} close=${close})。中止します`);
    process.exit(1);
  }
  if (!/match\s+\/eggCodes\//.test(merged)) {
    console.error('[NG] eggCodes ブロックが入っていません。中止します');
    process.exit(1);
  }

  fs.writeFileSync(RULES_PATH, merged, 'utf8');
  console.log('[OK] 検算通過。firestore.rules を「本番ルール + eggCodes」に更新しました');
  console.log(`[--] 追加 ${merged.split('\n').length - live.split('\n').length} 行`);
}

main().catch((e) => {
  const msg = (e && e.response && e.response.data && JSON.stringify(e.response.data)) || (e && e.message) || String(e);
  console.error('[NG] 失敗:', msg);
  process.exit(1);
});
