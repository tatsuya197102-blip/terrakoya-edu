// MARKER: TERRAKOYA_EDU_FETCH_STORAGE_RULES_V1
// Fetch the LIVE Cloud Storage security rules (they are not in the repo).
//   node scripts/fetch_storage_rules_v1.js
// Writes storage.rules.live_<timestamp>.txt and prints the content.

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

const saPath = path.join(__dirname, '..', 'service-account.json');
const sa = require(saPath);
initializeApp({ credential: cert(sa) });
void getFirestore();

(async function main() {
  const auth = new GoogleAuth({
    keyFile: saPath,
    scopes: ['https://www.googleapis.com/auth/firebase', 'https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const project = sa.project_id;

  const relRes = await client.request({
    url: 'https://firebaserules.googleapis.com/v1/projects/' + project + '/releases',
  });
  const releases = relRes.data.releases || [];
  console.log('=== releases ===');
  releases.forEach(function (r) { console.log('  ' + r.name + '  ->  ' + r.rulesetName); });

  const storageRel = releases.filter(function (r) {
    return r.name.indexOf('firebase.storage') >= 0;
  });

  if (storageRel.length === 0) {
    console.log('');
    console.log('No storage ruleset release found. Storage may still use default rules.');
    return;
  }

  for (const rel of storageRel) {
    const rsRes = await client.request({
      url: 'https://firebaserules.googleapis.com/v1/' + rel.rulesetName,
    });
    const files = (rsRes.data.source && rsRes.data.source.files) || [];
    for (const f of files) {
      const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
      const out = path.join(__dirname, '..', 'storage.rules.live_' + stamp + '.txt');
      fs.writeFileSync(out, f.content, 'utf8');
      console.log('');
      console.log('=== LIVE STORAGE RULES (' + rel.name + ') ===');
      console.log(f.content);
      console.log('=== saved to: ' + out + ' ===');
    }
  }
})().catch(function (e) {
  console.log('[FATAL] ' + (e.message || e));
  process.exit(1);
});
