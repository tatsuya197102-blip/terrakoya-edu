// MARKER: TERRAKOYA_EDU_ADD_WELCOME_KEYS_V1
// 用途: E-1(キャラ迎え画面)で使う welcome ブロックを ja/en/ar の translation.json に追加する。
//       既存キーは絶対に上書きしない(不足キーだけを補う)。何度実行しても安全。
// 実行: node scripts/add_welcome_keys.js   (リポジトリ直下から)

const fs = require('fs');
const path = require('path');

const WELCOME = {
  ja: {
    hello: 'こんにちは！ぼく、ブンブン！',
    greeting: 'なにしたい？',
    learn: 'まなぶ',
    learnDesc: 'レッスンをみる',
    sing: 'うたう',
    singDesc: 'うたをつくる',
    paint: 'えをかく',
    paintDesc: 'おえかきする',
    play: 'あそぶ',
    playDesc: 'ゲームであそぶ',
    chooseLang: 'ことばをえらぼう',
    skip: 'スキップ',
  },
  en: {
    hello: "Hi! I'm Bunbun!",
    greeting: 'What do you want to do?',
    learn: 'Learn',
    learnDesc: 'See the lessons',
    sing: 'Sing',
    singDesc: 'Make a song',
    paint: 'Draw',
    paintDesc: 'Make a drawing',
    play: 'Play',
    playDesc: 'Play a game',
    chooseLang: 'Choose your language',
    skip: 'Skip',
  },
  ar: {
    hello: 'مرحبًا! أنا بونبون!',
    greeting: 'ماذا تريد أن تفعل؟',
    learn: 'تعلَّم',
    learnDesc: 'شاهد الدروس',
    sing: 'غنِّ',
    singDesc: 'اصنع أغنية',
    paint: 'ارسم',
    paintDesc: 'ارسم صورة',
    play: 'العب',
    playDesc: 'العب لعبة',
    chooseLang: 'اختر لغتك',
    skip: 'تخطِّي',
  },
};

let changed = 0;

for (const [lng, block] of Object.entries(WELCOME)) {
  const file = path.join('public', 'locales', lng, 'translation.json');
  if (!fs.existsSync(file)) {
    console.error(`  [SKIP] ${file} not found`);
    continue;
  }

  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  json.welcome = json.welcome || {};

  const added = [];
  for (const [k, v] of Object.entries(block)) {
    if (json.welcome[k] === undefined) {
      json.welcome[k] = v;
      added.push(k);
    }
  }

  if (added.length > 0) {
    fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n', 'utf8');
    console.log(`  [OK]   ${lng}: added ${added.length} key(s) to welcome (${added.join(', ')})`);
    changed++;
  } else {
    console.log(`  [SKIP] ${lng}: welcome already complete`);
  }
}

console.log(`\nFiles updated: ${changed}`);
