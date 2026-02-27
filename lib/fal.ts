/**
 * Shared Fal AI flux-lora: submit job and poll until completion.
 * Used by API generate and cron Instagram flow.
 */

const FAL_SUBMIT_URL = 'https://queue.fal.run/fal-ai/flux-lora';
const FAL_STATUS_BASE = 'https://queue.fal.run/fal-ai/flux-lora';
const FAL_CDN_BASE = 'https://v3b.fal.media';
const MAX_POLL_ATTEMPTS = 90;  // 90 * 2s = 3 min max (image usually ready in ~1 min)
const POLL_INTERVAL = 2000;    // Poll every 2s so we fetch result soon after completion

/** Normalize Fal image URL to canonical v3b.fal.media CDN (relative paths or other hosts → stable URL). */
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
    // not a valid URL, return as-is
  }
  return trimmed;
}

export interface FalGenerateOptions {
  prompt: string;
  loraUrl: string;
  apiKey: string;
  imageSize?: 'square' | 'landscape' | 'portrait';
}

export interface FalGenerationStatus {
  status: 'completed' | 'failed' | 'timeout';
  requestId: string;
  message?: string;
  /** 1-based poll attempt when completed */
  pollAttempt?: number;
}

export interface FalResult {
  imageUrl: string;
  requestId: string;
  seed?: number;
  /** Image dimensions and type from Fal response */
  width?: number;
  height?: number;
  contentType?: string;
  /** Structured status for accurate reporting */
  generationStatus: FalGenerationStatus;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateImageWithFal(options: FalGenerateOptions): Promise<FalResult> {
  const { prompt, loraUrl, apiKey, imageSize = 'square' } = options;

  const response = await fetch(FAL_SUBMIT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Key ${apiKey}`,
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

  const data = (await response.json()) as { request_id?: string };
  if (!data.request_id) {
    throw new Error('No request_id returned from Fal AI');
  }

  const requestId = data.request_id;
  const statusUrl = `${FAL_STATUS_BASE}/requests/${requestId}/status`;

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL);

    // Fal queue API: GET for status (docs: https://docs.fal.ai/model-endpoints/queue)
    const statusRes = await fetch(statusUrl, {
      method: 'GET',
      headers: { Authorization: `Key ${apiKey}` },
    });

    if (!statusRes.ok) {
      throw new Error(`Status check failed: ${statusRes.status}`);
    }

    const status = (await statusRes.json()) as { status?: string };

    if (status.status === 'COMPLETED') {
      // Fal queue API: GET for result; response is wrapped in a "response" object
      const resultUrl = `${FAL_STATUS_BASE}/requests/${requestId}`;
      const resultRes = await fetch(resultUrl, {
        method: 'GET',
        headers: { Authorization: `Key ${apiKey}` },
      });

      if (!resultRes.ok) {
        throw new Error(`Result fetch failed: ${resultRes.status}`);
      }

      const raw = (await resultRes.json()) as {
        response?: {
          images?: Array<{ url: string; width?: number; height?: number; content_type?: string }>;
          seed?: number;
        };
        // Some endpoints may return model output at top level
        images?: Array<{ url: string; width?: number; height?: number; content_type?: string }>;
        seed?: number;
      };

      const result = raw.response ?? raw;
      if (!result.images?.length) {
        throw new Error('No images in result');
      }

      const img = result.images[0];
      return {
        imageUrl: normalizeFalImageUrl(img.url),
        requestId,
        seed: result.seed,
        width: img.width,
        height: img.height,
        contentType: img.content_type,
        generationStatus: {
          status: 'completed',
          requestId,
          message: 'Image generated successfully',
          pollAttempt: attempt + 1,
        },
      };
    }

    if (status.status === 'FAILED' || status.status === 'CANCELLED') {
      const msg = `Image generation ${status.status?.toLowerCase() ?? 'failed'}`;
      throw new Error(msg);
    }
  }

  throw new Error('Image generation timed out after 5 minutes');
}
