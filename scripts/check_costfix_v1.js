// MARKER: TERRAKOYA_EDU_CHECK_COSTFIX_V1
// Verify the two cost fixes objectively (no eyeballing needed).
//   node scripts/check_costfix_v1.js
//
// Shows:
//   [A] genLimits/*  -> how many AI generations each user spent today (limit 3)
//   [B] submissions  -> newest docs and whether they use imageUrl (good) or imageBase64 (old)

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

const sa = require(path.join(__dirname, '..', 'service-account.json'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

function ymd() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

(async function main() {
  const today = ymd();
  console.log('=== [A] generation limit counters (today=' + today + ', limit=3) ===');
  const gl = await db.collection('genLimits').get();
  if (gl.empty) {
    console.log('  (no documents yet)');
    console.log('  -> If you already pressed the generate button, this means the limit is NOT active.');
    console.log('     Most likely cause: FIREBASE_SERVICE_ACCOUNT missing on the deployment (fail-open).');
  } else {
    gl.docs.forEach(function (d) {
      const x = d.data();
      const isToday = d.id.indexOf('_' + today) > 0;
      console.log('  ' + d.id + '  count=' + (x.count || 0) + '/3  kind=' + (x.kind || '-') + (isToday ? '   <== TODAY' : ''));
    });
  }

  console.log('');
  console.log('=== [B] submissions storage format ===');
  const snap = await db.collectionGroup('submissions').get();
  let url = 0, b64 = 0, both = 0, neither = 0;
  const rows = [];
  snap.docs.forEach(function (d) {
    const x = d.data();
    const hasUrl = typeof x.imageUrl === 'string' && x.imageUrl.indexOf('http') === 0;
    const hasB64 = typeof x.imageBase64 === 'string' && x.imageBase64.length > 0;
    if (hasUrl && hasB64) both++;
    else if (hasUrl) url++;
    else if (hasB64) b64++;
    else neither++;
    rows.push({
      at: typeof x.submittedAt === 'string' ? x.submittedAt : '',
      path: d.ref.path,
      tag: hasUrl && hasB64 ? 'url+base64(migrated)' : hasUrl ? 'url ONLY (NEW/GOOD)' : hasB64 ? 'base64 only (OLD)' : 'no image'
    });
  });
  rows.sort(function (a, b) { return a.at < b.at ? 1 : -1; });
  console.log('  total docs: ' + snap.size);
  console.log('  urlOnly=' + url + '  base64Only=' + b64 + '  both=' + both + '  noImage=' + neither);
  console.log('  --- newest 5 ---');
  rows.slice(0, 5).forEach(function (r) {
    console.log('  ' + (r.at || '(no date)').slice(0, 19) + '  ' + r.tag);
  });

  console.log('');
  console.log('=== VERDICT ===');
  console.log('  [A] PASS if a "<== TODAY" line exists with count matching how many times you pressed generate.');
  console.log('  [B] PASS if a newly submitted work shows "url ONLY (NEW/GOOD)".');
})().catch(function (e) {
  console.log('[FATAL] ' + e.message);
  process.exit(1);
});
