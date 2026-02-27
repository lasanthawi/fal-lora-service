import type { VercelRequest, VercelResponse } from '@vercel/node';

interface LoRARequest {
  prompt?: unknown;
  lora_url?: unknown;
  fal_api_key?: unknown;
  image_size?: unknown;
  async?: unknown;
}

interface FalQueueResponse {
  request_id: string;
  status?: string;
}

interface FalResultResponse {
  images: Array<{ url: string; content_type: string }>;
  seed?: number;
}

const DEFAULT_LORA_URL = 'https://v3b.fal.media/files/b/0a900b43/al92Go_LjKAQZXGu3Osoa_pytorch_lora_weights.safetensors';
const FAL_CDN_BASE = 'https://v3b.fal.media';
const FAL_SUBMIT_URL = 'https://queue.fal.run/fal-ai/flux-lora';
const FAL_STATUS_BASE = 'https://queue.fal.run/fal-ai/flux-lora';
type ImageSize = 'square' | 'landscape' | 'portrait';

function toTrimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function parseLoRARequest(rawBody: unknown): LoRARequest {
  if (!rawBody) return {};

  if (typeof rawBody === 'object' && !Buffer.isBuffer(rawBody)) {
    return rawBody as LoRARequest;
  }

  const rawText = (Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody)).trim();
  if (!rawText) return {};

  try {
    const parsed = JSON.parse(rawText) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as LoRARequest;
    }
  } catch {
    // Not JSON; continue parsing.
  }

  const urlEncoded = new URLSearchParams(rawText);
  if (Array.from(urlEncoded.keys()).length > 0) {
    return Object.fromEntries(urlEncoded.entries()) as LoRARequest;
  }

  // Fallback for text/plain payloads: body is the prompt.
  return { prompt: rawText };
}

function normalizeImageSize(value: unknown): ImageSize {
  const normalized = toTrimmedString(value);
  if (normalized === 'landscape' || normalized === 'portrait') return normalized;
  return 'square';
}

function normalizeAsync(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  const normalized = toTrimmedString(value);
  return normalized != null && normalized.toLowerCase() === 'true';
}

function normalizeFalImageUrl(url: string): string {
  const trimmed = (url || '').trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith('/')) return FAL_CDN_BASE + trimmed;
  try {
    const u = new URL(trimmed);
    if (u.pathname.startsWith('/files/') && u.hostname !== 'v3b.fal.media') {
      return FAL_CDN_BASE + u.pathname + u.search;
    }
  } catch {
    /* ignore */
  }
  return trimmed;
}
const MAX_POLL_ATTEMPTS = 60;
const POLL_INTERVAL = 5000;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function submitToFal(
  prompt: string,
  loraUrl: string,
  apiKey: string,
  imageSize: ImageSize
): Promise<string> {
  const response = await fetch(FAL_SUBMIT_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      loras: [{ path: loraUrl, scale: 1 }],
      image_size: imageSize,
      num_images: 1,
      enable_safety_checker: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fal AI submission failed: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as FalQueueResponse;

  if (!data.request_id) {
    throw new Error('No request_id returned from Fal AI');
  }

  return data.request_id;
}

async function pollForCompletion(
  requestId: string,
  apiKey: string
): Promise<FalResultResponse> {
  const statusUrl = `${FAL_STATUS_BASE}/requests/${requestId}/status`;

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL);

    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: { 'Authorization': `Key ${apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status} at ${statusUrl}`);
    }

    const status = (await response.json()) as FalQueueResponse;

    if (status.status === 'COMPLETED') {
      const resultUrl = `${FAL_STATUS_BASE}/requests/${requestId}`;
      const resultResponse = await fetch(resultUrl, {
        method: 'GET',
        headers: { 'Authorization': `Key ${apiKey}` },
      });

      if (!resultResponse.ok) {
        throw new Error(`Result fetch failed: ${resultResponse.status}`);
      }

      const raw = (await resultResponse.json()) as { response?: FalResultResponse } & FalResultResponse;
      const result = raw.response ?? raw;
      if (!result.images?.length) {
        throw new Error('No images in result');
      }
      return result as FalResultResponse;
    } else if (status.status === 'FAILED' || status.status === 'CANCELLED') {
      throw new Error(`Image generation ${status.status.toLowerCase()}`);
    }
  }

  throw new Error('Image generation timed out after 5 minutes');
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = parseLoRARequest(req.body);
    const prompt = toTrimmedString(body.prompt);
    const lora_url = toTrimmedString(body.lora_url);
    const fal_api_key = toTrimmedString(body.fal_api_key);
    const image_size = normalizeImageSize(body.image_size);
    const asyncMode = normalizeAsync(body.async);

    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required and cannot be empty' });
    }

    const apiKey = fal_api_key || process.env.FAL_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'fal_api_key required (in body or env)' });
    }

    const loraUrl = lora_url || DEFAULT_LORA_URL;

    console.log(`Using Flux 1 LoRA: ${loraUrl.substring(0, 80)}...`);
    console.log(`Prompt: ${prompt.substring(0, 100)}...`);

    const requestId = await submitToFal(prompt, loraUrl, apiKey, image_size);
    console.log(`Submitted to flux-lora! Request ID: ${requestId}`);

    // If async mode, return immediately
    if (asyncMode) {
      return res.status(202).json({
        success: true,
        request_id: requestId,
        status: 'IN_PROGRESS',
        poll_url: `${FAL_STATUS_BASE}/requests/${requestId}/status`,
        message: 'Image generation started. Poll the request_id for completion.',
      });
    }

    // Otherwise wait for completion
    const result = await pollForCompletion(requestId, apiKey);

    if (!result.images || result.images.length === 0) {
      throw new Error('No images in result');
    }

    const imageUrl = normalizeFalImageUrl(result.images[0].url);
    console.log(`Image generated: ${imageUrl.substring(0, 60)}...`);

    return res.status(200).json({
      success: true,
      image_url: imageUrl,
      request_id: requestId,
      seed: result.seed,
      lora_used: loraUrl,
      model: 'fal-ai/flux-lora',
    });

  } catch (error: any) {
    console.error('ERROR:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
