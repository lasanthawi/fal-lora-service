/**
 * Test script: publish to Instagram (optionally with a specific image URL; otherwise generate via Fal).
 * Run with: npm run test:instagram
 * Start dev server first: npm run dev
 * Env: FAL_API_KEY, COMPOSIO_API_KEY, COMPOSIO_ENTITY_ID, INSTAGRAM_IG_USER_ID; optional CRON_SECRET, TEST_IMAGE_URL, TEST_CAPTION.
 * If TEST_IMAGE_URL is set, that image is posted with a generated (or TEST_CAPTION) caption; otherwise an image is generated first.
 * Set TEST_FULL_FLOW=1 to skip providing an image and run full flow: generate image via Fal → write caption → publish to IG.
 */

import * as fs from 'fs';
import * as path from 'path';

// Load .env from project root (simple parse)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) return;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1);
    process.env[key] = val;
  });
}

const API_URL = process.env.API_URL || 'http://localhost:3000';
const CRON_URL = `${API_URL.replace(/\/$/, '')}/api/cron/instagram-post`;
const CRON_SECRET = process.env.CRON_SECRET;

const DEFAULT_TEST_IMAGE_URL =
  'https://v3b.fal.media/files/b/0a902c15/BFfoj1bw2VJbNkqVycZqz_73fd4bfc08234c1194de0e08c671034d.jpg';

async function main() {
  const fullFlow =
    process.env.TEST_FULL_FLOW === '1' ||
    process.env.TEST_FULL_FLOW === 'true' ||
    process.argv.includes('--full');
  const customCaption = process.env.TEST_CAPTION?.trim();
  const imageUrl = fullFlow ? undefined : (process.env.TEST_IMAGE_URL?.trim() || DEFAULT_TEST_IMAGE_URL);
  const body: Record<string, string> = {};
  if (customCaption) body.caption = customCaption;
  if (imageUrl) body.image_url = imageUrl;

  console.log('Calling:', CRON_URL);
  if (fullFlow) console.log('Mode: FULL FLOW (generate image → caption → publish to IG)');
  if (imageUrl) console.log('Image URL:', imageUrl.slice(0, 60) + '...');
  console.log(
    'Caption:',
    customCaption ? customCaption.slice(0, 80) + (customCaption.length > 80 ? '...' : '') : '(server-generated from theme + hashtags)'
  );
  console.log(
    fullFlow
      ? '(Generate + caption + Instagram can take ~1–2 min; waiting up to 6 min.)\n'
      : imageUrl
        ? '(Posting provided image; waiting up to 2 min.)\n'
        : '(Generate + Instagram can take ~1–2 min; waiting up to 6 min.)\n'
  );

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (CRON_SECRET) headers['Authorization'] = `Bearer ${CRON_SECRET}`;

  const controller = new AbortController();
  const timeoutMs = imageUrl ? 2 * 60 * 1000 : 6 * 60 * 1000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const res = await fetch(CRON_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: controller.signal,
  });

  clearTimeout(timeout);
  const data = (await res.json()) as {
    success?: boolean;
    error?: string;
    generation?: {
      status?: string;
      request_id?: string;
      seed?: number;
      image_url?: string;
      theme_used?: string;
      shot_type?: string;
    };
    instagram?: {
      status?: string;
      permalink?: string | null;
      media_id?: string | null;
      error?: string | null;
    };
    caption_used?: string;
  };

  if (!res.ok) {
    console.error('Error:', data.error || res.statusText);
    if (res.status === 401)
      console.error(
        '\nTip: Server expects Authorization: Bearer <CRON_SECRET>. Set CRON_SECRET in .env (same value as the server), or leave CRON_SECRET unset on the server for local testing.'
      );
    if (data.generation) console.error('Generation:', JSON.stringify(data.generation, null, 2));
    if (data.instagram) console.error('Instagram:', JSON.stringify(data.instagram, null, 2));
    process.exit(1);
  }

  console.log('Success:', data.success);
  if (data.generation) {
    console.log('\nGeneration:');
    console.log('  Status:', data.generation.status);
    console.log('  Request ID:', data.generation.request_id);
    console.log('  Image URL:', data.generation.image_url);
    console.log('  Theme:', data.generation.theme_used);
    console.log('  Shot type:', data.generation.shot_type);
  }
  if (data.instagram) {
    console.log('\nInstagram:');
    console.log('  Status:', data.instagram.status);
    console.log('  Permalink:', data.instagram.permalink ?? '(not returned)');
    console.log('  Media ID:', data.instagram.media_id ?? '(not returned)');
    if (data.instagram.error) console.log('  Error:', data.instagram.error);
  }
  if (data.caption_used) console.log('\nCaption used:', data.caption_used.slice(0, 100) + '...');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
