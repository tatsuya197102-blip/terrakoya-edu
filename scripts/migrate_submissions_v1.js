// MARKER: TERRAKOYA_EDU_MIGRATE_SUBMISSIONS_V1
// Migrate imageBase64 fields in submissions to Cloud Storage.
//
// Usage (run from repo root):
//   node scripts/migrate_submissions_v1.js             -> dry-run (no changes, shows plan)
//   node scripts/migrate_submissions_v1.js --apply     -> upload to Storage + write imageUrl (keeps imageBase64)
//   node scripts/migrate_submissions_v1.js --cleanup   -> delete imageBase64 ONLY where imageUrl exists
//                                                         (run this only AFTER the app reads imageUrl)
//
// Safe by design: resume-capable (skips docs that already have imageUrl),
// three-phase so images never disappear before the app is updated.

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const crypto = require('crypto');
const path = require('path');

const sa = require(path.join(__dirname, '..', 'service-account.json'));

const APPLY = process.argv.includes('--apply');
const CLEANUP = process.argv.includes('--cleanup');

initializeApp({ credential: cert(sa) });
const db = getFirestore();

async function pickBucket() {
  const candidates = [sa.project_id + '.firebasestorage.app', sa.project_id + '.appspot.com'];
  for (const name of candidates) {
    try {
      const [exists] = await getStorage().bucket(name).exists();
      if (exists) return getStorage().bucket(name);
    } catch (e) { /* try next */ }
  }
  throw new Error('No storage bucket found. Tried: ' + candidates.join(', '));
}

function parseBase64(s) {
  let mime = 'image/png';
  let data = s;
  const m = /^data:([^;]+);base64,([\s\S]*)$/.exec(s);
  if (m) { mime = m[1]; data = m[2]; }
  return { mime: mime, buf: Buffer.from(data, 'base64') };
}

function extFor(mime) {
  if (mime.indexOf('jpeg') >= 0 || mime.indexOf('jpg') >= 0) return 'jpg';
  if (mime.indexOf('webp') >= 0) return 'webp';
  if (mime.indexOf('gif') >= 0) return 'gif';
  return 'png';
}

(async function main() {
  const mode = CLEANUP ? 'CLEANUP' : (APPLY ? 'APPLY' : 'DRY-RUN');
  console.log('[mode] ' + mode);

  const bucket = await pickBucket();
  console.log('[bucket] ' + bucket.name);

  const snap = await db.collectionGroup('submissions').get();
  console.log('[scan] submissions docs total: ' + snap.size);

  let withB64 = 0, migrated = 0, cleaned = 0, skipped = 0, bytes = 0, errors = 0;

  for (const doc of snap.docs) {
    const d = doc.data();
    if (typeof d.imageBase64 !== 'string' || d.imageBase64.length === 0) continue;
    withB64++;

    const parsed = parseBase64(d.imageBase64);
    bytes += parsed.buf.length;

    if (CLEANUP) {
      if (typeof d.imageUrl === 'string' && d.imageUrl.indexOf('http') === 0) {
        await doc.ref.update({ imageBase64: FieldValue.delete() });
        cleaned++;
        console.log('[cleanup] ' + doc.ref.path);
      } else {
        skipped++;
        console.log('[skip-no-url] ' + doc.ref.path + ' (not migrated yet, base64 kept)');
      }
      continue;
    }

    // resume: already migrated
    if (typeof d.imageUrl === 'string' && d.imageUrl.indexOf('http') === 0) {
      skipped++;
      continue;
    }

    const ext = extFor(parsed.mime);
    const dest = 'migrated_submissions/' + doc.ref.path.replace(/\//g, '_') + '.' + ext;

    if (!APPLY) {
      console.log('[dry] ' + doc.ref.path + ' -> ' + dest + ' (' + Math.round(parsed.buf.length / 1024) + ' KB, ' + parsed.mime + ')');
      continue;
    }

    try {
      const token = crypto.randomUUID();
      await bucket.file(dest).save(parsed.buf, {
        contentType: parsed.mime,
        metadata: {
          cacheControl: 'public,max-age=31536000',
          metadata: { firebaseStorageDownloadTokens: token }
        }
      });
      const url = 'https://firebasestorage.googleapis.com/v0/b/' + bucket.name +
        '/o/' + encodeURIComponent(dest) + '?alt=media&token=' + token;
      await doc.ref.update({ imageUrl: url });
      migrated++;
      console.log('[ok] ' + doc.ref.path + ' -> ' + Math.round(parsed.buf.length / 1024) + ' KB');
    } catch (e) {
      errors++;
      console.log('[NG] ' + doc.ref.path + ' : ' + e.message);
    }
  }

  console.log('---');
  console.log('[summary] withBase64=' + withB64 +
    ' totalMB=' + (bytes / 1048576).toFixed(1) +
    ' migrated=' + migrated +
    ' cleaned=' + cleaned +
    ' skipped=' + skipped +
    ' errors=' + errors);

  if (!APPLY && !CLEANUP) {
    console.log('[note] dry-run only. Nothing was changed. Re-run with --apply to migrate.');
  }
  if (APPLY) {
    console.log('[note] imageBase64 was KEPT on purpose. Run --cleanup only after the app displays imageUrl.');
  }
})().catch(function (e) {
  console.log('[FATAL] ' + e.message);
  process.exit(1);
});
