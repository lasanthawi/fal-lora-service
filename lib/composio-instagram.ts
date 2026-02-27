/**
 * Post image to Instagram via Composio REST API.
 * Uses INSTAGRAM_CREATE_MEDIA_CONTAINER then INSTAGRAM_CREATE_POST.
 */

const COMPOSIO_BASE = 'https://backend.composio.dev/api/v3/tools/execute';

/** Common placeholder from .env.example - treat as "not set" and resolve from API */
const PLACEHOLDER_IG_USER_ID = '17841400008460056';

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
  const accountId = connectedAccountId?.trim();
  let igUserId = options.igUserId?.trim();
  if (!igUserId || igUserId === PLACEHOLDER_IG_USER_ID) {
    igUserId = await resolveIgUserId(apiKey, userId, accountId);
  }

  // Step 1: Create media container
  const createRes = await composioExecute(
    apiKey,
    'INSTAGRAM_CREATE_MEDIA_CONTAINER',
    userId,
    {
      image_url: imageUrl,
      caption: caption.slice(0, 2200), // Instagram limit
      ig_user_id: igUserId,
      content_type: 'photo',
    },
    accountId
  );

  if (!createRes.successful || !createRes.data) {
    return {
      success: false,
      error: createRes.error ?? 'Create media container failed',
    };
  }

  const containerId = (createRes.data as { id?: string }).id;
  if (!containerId || typeof containerId !== 'string') {
    return {
      success: false,
      error: 'No container id in CREATE_MEDIA_CONTAINER response',
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
