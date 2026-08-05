// scripts/check_egg_status.js  (v2 - modular firebase-admin API)
// TERRAKOYA-edu E-12: server-side status check for the egg redemption codes.
// MARKER: TERRAKOYA_CHECK_EGG_STATUS_V2
// Run from the repo root: node scripts\check_egg_status.js
// NOTE: console output is ASCII-only on purpose (PS 5.1 console garbles Japanese).

const fs = require('fs');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (!fs.existsSync('service-account.json')) {
  console.error('[NG] service-account.json not found. Run from the repo root.');
  process.exit(1);
}
const svc = JSON.parse(fs.readFileSync('service-account.json', 'utf8'));
const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(svc) });
const db = getFirestore(app);

function fmt(ts) {
  if (!ts) return 'null';
  if (ts.toDate) return ts.toDate().toISOString();
  return String(ts);
}

async function main() {
  // 1) eggCodes collection
  const codes = await db.collection('eggCodes').orderBy('createdAt', 'desc').limit(10).get();
  console.log(`\n=== eggCodes: ${codes.size} newest (max 10) ===`);
  if (codes.empty) {
    console.log('  (empty) -> no code has been issued yet');
    console.log('  Likely causes: album page opened before the Vercel redeploy,');
    console.log('  or the client create was rejected by the rules.');
  } else {
    codes.forEach((d) => {
      const x = d.data();
      console.log(`  ${d.id}  uid=${(x.uid || '').slice(0, 8)}...  term=${x.term}  used=${fmt(x.usedAt)}  created=${fmt(x.createdAt)}`);
    });
  }

  // 2) users that carry an eggCode field
  const users = await db.collection('users').limit(200).get();
  let withCode = 0;
  users.forEach((d) => { if (d.data().eggCode) withCode += 1; });
  console.log(`\n=== users with eggCode field: ${withCode} / ${users.size} checked ===`);

  // 3) songs sanity (for the missing-rule suspicion)
  const songs = await db.collection('songs').limit(500).get();
  const byUid = {};
  songs.forEach((d) => {
    const u = (d.data().uid || 'unknown').slice(0, 8);
    byUid[u] = (byUid[u] || 0) + 1;
  });
  console.log(`\n=== songs: ${songs.size} docs (max 500 checked) ===`);
  Object.entries(byUid).slice(0, 10).forEach(([u, n]) => console.log(`  uid=${u}...  ${n} song(s)`));
  if (songs.size > 0) {
    console.log('  NOTE: songs exist on the server. If the album shows "song: 0" for a uid');
    console.log('  listed above WITH works inside the current term, the missing songs rule is real.');
  }

  // 4) pets/school term (what the album uses as the term start)
  const pet = await db.doc('pets/school').get();
  if (pet.exists) {
    const p = pet.data();
    console.log(`\n=== pets/school ===`);
    console.log(`  termStartDate=${p.termStartDate}  character=${p.character}`);
  }

  console.log('\nDone.');
}

main().catch((e) => { console.error('[NG]', e.message || e); process.exit(1); });
