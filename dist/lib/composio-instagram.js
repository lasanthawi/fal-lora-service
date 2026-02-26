"use strict";
/**
 * Post image to Instagram via Composio REST API.
 * Uses INSTAGRAM_CREATE_MEDIA_CONTAINER then INSTAGRAM_CREATE_POST.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.postImageToInstagram = postImageToInstagram;
const COMPOSIO_BASE = 'https://backend.composio.dev/api/v3/tools/execute';
/** Common placeholder from .env.example - treat as "not set" and resolve from API */
const PLACEHOLDER_IG_USER_ID = '17841400008460056';
async function composioExecute(apiKey, toolSlug, userId, args) {
    const res = await fetch(`${COMPOSIO_BASE}/${toolSlug}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
        },
        body: JSON.stringify({
            user_id: userId,
            arguments: args,
        }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Composio ${toolSlug} failed: ${res.status} - ${text}`);
    }
    return (await res.json());
}
/**
 * Resolve Instagram Business Account ID for the connected user via INSTAGRAM_GET_USER_INFO (ig_user_id defaults to "me").
 */
async function resolveIgUserId(apiKey, userId) {
    const res = await composioExecute(apiKey, 'INSTAGRAM_GET_USER_INFO', userId, {});
    if (!res.successful || !res.data) {
        throw new Error(res.error ?? 'Failed to get Instagram user info');
    }
    const data = res.data;
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
async function postImageToInstagram(options) {
    const { apiKey, userId, imageUrl, caption } = options;
    let igUserId = options.igUserId?.trim();
    if (!igUserId || igUserId === PLACEHOLDER_IG_USER_ID) {
        igUserId = await resolveIgUserId(apiKey, userId);
    }
    // Step 1: Create media container
    const createRes = await composioExecute(apiKey, 'INSTAGRAM_CREATE_MEDIA_CONTAINER', userId, {
        image_url: imageUrl,
        caption: caption.slice(0, 2200), // Instagram limit
        ig_user_id: igUserId,
        content_type: 'photo',
    });
    if (!createRes.successful || !createRes.data) {
        return {
            success: false,
            error: createRes.error ?? 'Create media container failed',
        };
    }
    const containerId = createRes.data.id;
    if (!containerId || typeof containerId !== 'string') {
        return {
            success: false,
            error: 'No container id in CREATE_MEDIA_CONTAINER response',
        };
    }
    // Step 2: Publish post (Composio retries for 9007 internally)
    const postRes = await composioExecute(apiKey, 'INSTAGRAM_CREATE_POST', userId, {
        ig_user_id: igUserId,
        creation_id: containerId,
    });
    if (!postRes.successful) {
        return {
            success: false,
            mediaId: containerId,
            error: postRes.error ?? 'Create post failed',
        };
    }
    const data = (postRes.data ?? {});
    let mediaId = data.id ?? containerId;
    let permalink = data.permalink;
    // If permalink not in response, try to fetch (optional; tool may not exist in all Composio versions)
    if (!permalink && mediaId) {
        try {
            const mediaRes = await composioExecute(apiKey, 'INSTAGRAM_GET_IG_MEDIA', userId, {
                ig_media_id: mediaId,
                fields: 'id,permalink,media_url',
            });
            if (mediaRes.successful && mediaRes.data) {
                const media = mediaRes.data;
                permalink = media.permalink;
            }
        }
        catch {
            // Ignore: post already succeeded; permalink is optional
        }
    }
    return {
        success: true,
        permalink: permalink ?? undefined,
        mediaId,
    };
}
