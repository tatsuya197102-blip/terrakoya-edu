// MARKER: TERRAKOYA_EDU_ADD_STUDY_CTA_KEYS_V1
// Adds the studyCta block to ja/en/ar translation.json. Never overwrites existing keys. Idempotent.
// Run from the repo root: node scripts/add_study_cta_keys.js

const fs = require('fs');
const path = require('path');

const CTA = {
  ja: {
    title: 'もっとまなびたい？',
    body: 'TERRAKOYA Study なら、おうちでもべんきょうできるよ',
    cta: 'むりょうではじめる',
  },
  en: {
    title: 'Want to learn more?',
    body: 'With TERRAKOYA Study you can keep learning at home',
    cta: 'Start for free',
  },
  ar: {
    title: 'هل تريد أن تتعلم أكثر؟',
    body: 'مع TERRAKOYA Study يمكنك مواصلة التعلم في البيت',
    cta: 'ابدأ مجانًا',
  },
};

let changed = 0;

for (const [lng, block] of Object.entries(CTA)) {
  const file = path.join('public', 'locales', lng, 'translation.json');
  if (!fs.existsSync(file)) { console.error(`  [SKIP] ${file} not found`); continue; }

  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  json.studyCta = json.studyCta || {};

  const added = [];
  for (const [k, v] of Object.entries(block)) {
    if (json.studyCta[k] === undefined) { json.studyCta[k] = v; added.push(k); }
  }

  if (added.length > 0) {
    fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n', 'utf8');
    console.log(`  [OK]   ${lng}: added ${added.length} key(s) to studyCta (${added.join(', ')})`);
    changed++;
  } else {
    console.log(`  [SKIP] ${lng}: studyCta already complete`);
  }
}

console.log(`\nFiles updated: ${changed}`);
