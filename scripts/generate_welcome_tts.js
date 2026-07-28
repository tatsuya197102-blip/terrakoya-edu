// scripts/generate_welcome_tts.js
// TERRAKOYA-edu E-3: pre-render the welcome screen voice guide as static MP3 files.
// MARKER: TERRAKOYA_WELCOME_TTS_V2
//
// Why pre-rendered files instead of the browser speech API or an on-demand route:
//   - the browser speech API often has no Arabic voice on low-spec Android
//   - on-demand costs money per tap and adds latency
//   - 6 phrases x 3 languages = 18 tiny files, served from the CDN for free
//
// Input : public/locales/{ja,en,ar}/translation.json  -> welcome.{hello,greeting,learn,sing,paint,play}
// Output: public/audio/welcome/{lang}/{key}.mp3
// Auth  : service-account.json (preferred). Vercel stores GOOGLE_TTS_API_KEY as a
//         SENSITIVE variable, which is write-only - neither the CLI nor the dashboard
//         can read it back, so an API key is not obtainable locally. The service
//         account works instead, same as scripts/fetch_and_merge_egg_rules.js.
//         Falls back to GOOGLE_TTS_API_KEY from the environment or .env.local if present.
// Run   : node scripts\generate_welcome_tts.js          (skips files that already exist)
//         node scripts\generate_welcome_tts.js --force  (regenerate everything)
// NOTE  : console output is ASCII-only on purpose (PS 5.1 console garbles Japanese).

const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

const LANGS = ['ja', 'en', 'ar'];
const KEYS = ['hello', 'greeting', 'learn', 'sing', 'paint', 'play'];

// Warm, clear voices. Slightly slowed down for children.
const VOICE = {
  ja: { languageCode: 'ja-JP', name: 'ja-JP-Neural2-B' },
  en: { languageCode: 'en-US', name: 'en-US-Neural2-F' },
  ar: { languageCode: 'ar-XA', name: 'ar-XA-Wavenet-A' },
};
const SPEAKING_RATE = 0.9;

const FORCE = process.argv.includes('--force');

/** Read a non-empty GOOGLE_TTS_API_KEY, if one happens to be available. */
function apiKey() {
  if (process.env.GOOGLE_TTS_API_KEY && process.env.GOOGLE_TTS_API_KEY.trim()) {
    return process.env.GOOGLE_TTS_API_KEY.trim();
  }
  const envFile = '.env.local';
  if (fs.existsSync(envFile)) {
    const line = fs
      .readFileSync(envFile, 'utf8')
      .split(/\r?\n/)
      .find((l) => l.trim().startsWith('GOOGLE_TTS_API_KEY='));
    if (line) {
      const v = line.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      if (v) return v;
    }
  }
  return null;
}

/**
 * Decide how to authenticate.
 * Preferred: service-account.json -> OAuth bearer token (no API key needed).
 * Fallback : GOOGLE_TTS_API_KEY as a query parameter.
 */
async function makeAuth() {
  if (fs.existsSync('service-account.json')) {
    const auth = new GoogleAuth({
      keyFile: 'service-account.json',
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    const value = typeof token === 'string' ? token : token && token.token;
    if (!value) throw new Error('could not obtain an access token from service-account.json');
    console.log('[--] auth: service-account.json (OAuth)');
    return { mode: 'oauth', token: value };
  }
  const key = apiKey();
  if (key) {
    console.log('[--] auth: GOOGLE_TTS_API_KEY');
    return { mode: 'key', key };
  }
  throw new Error('no service-account.json and no usable GOOGLE_TTS_API_KEY');
}

async function synth(auth, text, voice) {
  const url =
    auth.mode === 'oauth'
      ? 'https://texttospeech.googleapis.com/v1/text:synthesize'
      : `https://texttospeech.googleapis.com/v1/text:synthesize?key=${auth.key}`;
  const headers = { 'Content-Type': 'application/json' };
  if (auth.mode === 'oauth') headers.Authorization = `Bearer ${auth.token}`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      input: { text },
      voice,
      audioConfig: { audioEncoding: 'MP3', speakingRate: SPEAKING_RATE },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = await res.json();
  if (!json.audioContent) throw new Error('no audioContent in the response');
  return Buffer.from(json.audioContent, 'base64');
}

async function main() {
  let auth;
  try {
    auth = await makeAuth();
  } catch (e) {
    console.error(`[NG] ${e.message}`);
    console.error('     Run from the repo root so service-account.json is visible.');
    process.exit(1);
  }

  let made = 0;
  let skipped = 0;
  let failed = 0;

  for (const lang of LANGS) {
    const dictPath = path.join('public', 'locales', lang, 'translation.json');
    if (!fs.existsSync(dictPath)) {
      console.error(`[NG] ${dictPath} not found`);
      failed += KEYS.length;
      continue;
    }
    const dict = JSON.parse(fs.readFileSync(dictPath, 'utf8'));
    const welcome = dict.welcome || {};

    const outDir = path.join('public', 'audio', 'welcome', lang);
    fs.mkdirSync(outDir, { recursive: true });

    for (const k of KEYS) {
      const text = welcome[k];
      if (!text) {
        console.error(`  [NG] ${lang}/${k}: missing translation key welcome.${k}`);
        failed += 1;
        continue;
      }
      const out = path.join(outDir, `${k}.mp3`);
      if (fs.existsSync(out) && !FORCE) {
        console.log(`  [SKIP] ${lang}/${k}.mp3 (already exists)`);
        skipped += 1;
        continue;
      }
      try {
        const buf = await synth(auth, text, VOICE[lang]);
        fs.writeFileSync(out, buf);
        console.log(`  [OK]   ${lang}/${k}.mp3  ${Math.round(buf.length / 1024)} KB`);
        made += 1;
      } catch (e) {
        console.error(`  [NG]   ${lang}/${k}.mp3  ${e.message}`);
        failed += 1;
      }
    }
  }

  console.log(`\nGenerated ${made}, skipped ${skipped}, failed ${failed}.`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error('[NG]', e.message || e); process.exit(1); });
