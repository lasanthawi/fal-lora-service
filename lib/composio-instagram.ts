/**
 * Post image to Instagram via Composio REST API.
 * Uses INSTAGRAM_CREATE_MEDIA_CONTAINER then INSTAGRAM_CREATE_POST.
 */

const COMPOSIO_BASE = 'https://backend.composio.dev/api/v3/tools/execute';

/** Common placeholder from .env.example - treat as "not set" and resolve from API */
const PLACEHOLDER_IG_USER_ID = '17841400008460056';
const CONNECTED_ACCOUNT_ID_PATTERN = /^ca_[A-Za-z0-9_-]+$/;
const IG_USER_ID_PATTERN = /^\d+$/;
const URL_PATTERN_ERROR = /did not match the expected pattern/i;

export interface ComposioInstagramOptions {
  apiKey: string;
  /** Composio user ID (entity ID) that has Instagram connected */
  userId: string;
  /** Composio connected account ID (e.g. ca_xxx). When you have multiple IG accounts under one user, set this to pick which one. */
  connectedAccountId?: string;
  /** Instagram Business Account ID (numeric). Optional: if missing or placeholder, resolved via INSTAGRAM_GET_USER_INFO. */
  igUserId?: string;
  imageUrl: string;
  caption: string;
}

export interface ComposioInstagramResult {
  success: boolean;
  /** Instagram post permalink if returned by API */
  permalink?: string;
  /** Media/container id from Instagram */
  mediaId?: string;
  error?: string;
}

function normalizeConnectedAccountId(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (!CONNECTED_ACCOUNT_ID_PATTERN.test(trimmed)) return undefined;
  return trimmed;
}

function normalizeIgUserId(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === PLACEHOLDER_IG_USER_ID) return undefined;
  if (!IG_USER_ID_PATTERN.test(trimmed)) return undefined;
  return trimmed;
}

function normalizeImageUrlForInstagram(value: string): string {
  const trimmed = value.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('Instagram publish failed: generated image URL is invalid');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Instagram publish failed: image URL must be http(s)');
  }
  return parsed.toString();
}

function buildInstagramImageUrlCandidates(imageUrl: string): string[] {
  const primary = normalizeImageUrlForInstagram(imageUrl);
  const parsed = new URL(primary);

  // Meta sometimes rejects one Fal host variant while accepting another.
  if (!parsed.hostname.endsWith('fal.media')) return [primary];

  const hosts = Array.from(new Set([parsed.hostname, 'fal.media', 'v3b.fal.media']));
  return hosts.map((host) => {
    const next = new URL(primary);
    next.hostname = host;
    return next.toString();
  });
}

function shouldRetryWithAlternateImageUrl(errorMessage: string): boolean {
  return URL_PATTERN_ERROR.test(errorMessage) || /invalid url/i.test(errorMessage);
}

async function composioExecute(
  apiKey: string,
  toolSlug: string,
  userId: string,
  args: Record<string, unknown>,
  connectedAccountId?: string
): Promise<{ successful?: boolean; data?: Record<string, unknown>; error?: string }> {
  const body: { user_id: string; arguments: Record<string, unknown>; connected_account_id?: string } = {
    user_id: userId,
    arguments: args,
  };
  if (connectedAccountId?.trim()) body.connected_account_id = connectedAccountId.trim();

  const res = await fetch(`${COMPOSIO_BASE}/${toolSlug}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Composio ${toolSlug} failed: ${res.status} - ${text}`);
  }

  return (await res.json()) as { successful?: boolean; data?: Record<string, unknown>; error?: string };
}

/**
 * Resolve Instagram Business Account ID for the connected user via INSTAGRAM_GET_USER_INFO (ig_user_id defaults to "me").
 */
async function resolveIgUserId(
  apiKey: string,
  userId: string,
  connectedAccountId?: string
): Promise<string> {
  const res = await composioExecute(apiKey, 'INSTAGRAM_GET_USER_INFO', userId, {}, connectedAccountId);
  if (!res.successful || !res.data) {
    throw new Error(res.error ?? 'Failed to get Instagram user info');
  }
  const data = res.data as { id?: string };
  if (!data.id || typeof data.id !== 'string') {
    throw new Error('Instagram user info did not return an id');
  }
  return data.id;
}

/**
 * Create media container with image and caption, then publish to Instagram.
 * If igUserId is not set or is the placeholder, it is resolved via INSTAGRAM_GET_USER_INFO.
 * Handles retries for "media not ready" (9007) via Composio's built-in backoff.
 */
export async function postImageToInstagram(
  options: ComposioInstagramOptions
): Promise<ComposioInstagramResult> {
  const { apiKey, userId, imageUrl, caption, connectedAccountId } = options;
  const accountId = normalizeConnectedAccountId(connectedAccountId);
  let igUserId = normalizeIgUserId(options.igUserId);
  if (!igUserId) {
    igUserId = await resolveIgUserId(apiKey, userId, accountId);
  }
  if (!IG_USER_ID_PATTERN.test(igUserId)) {
    throw new Error('Instagram publish failed: invalid ig_user_id');
  }

  const imageCandidates = buildInstagramImageUrlCandidates(imageUrl);

  let containerId: string | undefined;
  let lastCreateError: string | undefined;
  for (let i = 0; i < imageCandidates.length; i++) {
    const candidateImageUrl = imageCandidates[i];
    try {
      // Step 1: Create media container
      const createRes = await composioExecute(
        apiKey,
        'INSTAGRAM_CREATE_MEDIA_CONTAINER',
        userId,
        {
          image_url: candidateImageUrl,
          caption: caption.slice(0, 2200), // Instagram limit
          ig_user_id: igUserId,
          content_type: 'photo',
        },
        accountId
      );

      if (!createRes.successful || !createRes.data) {
        lastCreateError = createRes.error ?? 'Create media container failed';
        const canRetry = i < imageCandidates.length - 1 && shouldRetryWithAlternateImageUrl(lastCreateError);
        if (canRetry) continue;
        return {
          success: false,
          error: lastCreateError,
        };
      }

      containerId = (createRes.data as { id?: string }).id;
      if (!containerId || typeof containerId !== 'string') {
        lastCreateError = 'No container id in CREATE_MEDIA_CONTAINER response';
        return {
          success: false,
          error: lastCreateError,
        };
      }
      break;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Create media container failed';
      lastCreateError = message;
      const canRetry = i < imageCandidates.length - 1 && shouldRetryWithAlternateImageUrl(message);
      if (canRetry) continue;
      throw err;
    }
  }

  if (!containerId) {
    return {
      success: false,
      error: lastCreateError ?? 'Create media container failed',
    };
  }

  // Step 2: Publish post (Composio retries for 9007 internally)
  const postRes = await composioExecute(
    apiKey,
    'INSTAGRAM_CREATE_POST',
    userId,
    { ig_user_id: igUserId, creation_id: containerId },
    accountId
  );

  if (!postRes.successful) {
    return {
      success: false,
      mediaId: containerId,
      error: postRes.error ?? 'Create post failed',
    };
  }

  const data = (postRes.data ?? {}) as { permalink?: string; id?: string };
  let mediaId = data.id ?? containerId;
  let permalink = data.permalink;

  // If permalink not in response, try to fetch (optional; tool may not exist in all Composio versions)
  if (!permalink && mediaId) {
    try {
      const mediaRes = await composioExecute(
        apiKey,
        'INSTAGRAM_GET_IG_MEDIA',
        userId,
        { ig_media_id: mediaId, fields: 'id,permalink,media_url' },
        accountId
      );
      if (mediaRes.successful && mediaRes.data) {
        const media = mediaRes.data as { permalink?: string };
        permalink = media.permalink;
      }
    } catch {
      // Ignore: post already succeeded; permalink is optional
    }
  }

  return {
    success: true,
    permalink: permalink ?? undefined,
    mediaId,
  };
}
