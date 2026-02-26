/**
 * Test script: generate one image using a random prompt from lib/prompts.
 * Run with: npm run test:generate   (or: npx tsx scripts/test-generate.ts)
 * Start dev server first: npm run dev
 */

import { buildEntrepreneurPrompt } from '../lib/prompts';

const API_URL = process.env.API_URL || 'http://localhost:3000/api/generate';

async function main() {
  const { prompt, theme, shotType } = buildEntrepreneurPrompt();

  console.log('Theme:', theme);
  console.log('Shot type:', shotType);
  console.log('Prompt preview:', prompt.slice(0, 120) + '...');
  console.log('');
  console.log('Calling', API_URL, '...');
  console.log('(Fal polling can take ~1 min; waiting up to 6 minutes.)');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6 * 60 * 1000);

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      image_size: 'square',
    }),
    signal: controller.signal,
  });

  clearTimeout(timeout);
  const data = (await res.json()) as {
    success?: boolean;
    error?: string;
    image_url?: string;
    request_id?: string;
    seed?: number;
  };

  if (!res.ok) {
    console.error('Error:', data.error || res.statusText);
    process.exit(1);
  }

  console.log('Success:', data.success);
  console.log('Image URL:', data.image_url);
  if (data.request_id) console.log('Request ID:', data.request_id);
  if (data.seed != null) console.log('Seed:', data.seed);
  console.log('Theme used:', theme);
  console.log('Shot type used:', shotType);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
