"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const prompts_1 = require("../../lib/prompts");
const caption_1 = require("../../lib/caption");
const fal_1 = require("../../lib/fal");
const composio_instagram_1 = require("../../lib/composio-instagram");
const DEFAULT_LORA_URL = 'https://v3b.fal.media/files/b/0a900b43/al92Go_LjKAQZXGu3Osoa_pytorch_lora_weights.safetensors';
function requireCronSecret(req) {
    const secret = process.env.CRON_SECRET;
    if (!secret)
        return true; // allow if not set (e.g. local dev)
    const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '').trim();
    return token === secret;
}
async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    if (!requireCronSecret(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const falKey = process.env.FAL_API_KEY;
    const composioKey = process.env.COMPOSIO_API_KEY;
    const composioUserId = process.env.COMPOSIO_ENTITY_ID;
    const igUserId = process.env.INSTAGRAM_IG_USER_ID;
    const loraUrl = process.env.LORA_URL || DEFAULT_LORA_URL;
    if (!falKey) {
        return res.status(500).json({ error: 'FAL_API_KEY not set' });
    }
    if (!composioKey || !composioUserId) {
        return res.status(500).json({ error: 'COMPOSIO_API_KEY and COMPOSIO_ENTITY_ID required' });
    }
    // INSTAGRAM_IG_USER_ID optional: if unset, Composio will resolve it from the connected account (INSTAGRAM_GET_USER_INFO).
    const body = typeof req.body === 'object' ? req.body : {};
    const customCaption = body.caption?.trim();
    try {
        const { prompt, theme, shotType } = (0, prompts_1.buildEntrepreneurPrompt)();
        const caption = customCaption ||
            (() => {
                const { caption: generated } = (0, caption_1.generateCaptionForPost)(theme, shotType);
                return generated;
            })();
        console.log('Theme:', theme, '| Shot:', shotType, '| Caption:', caption.slice(0, 60) + '...');
        // Step 1: Generate image and capture full status
        const falResult = await (0, fal_1.generateImageWithFal)({
            prompt,
            loraUrl,
            apiKey: falKey,
            imageSize: 'square', // Instagram-friendly 1:1
        });
        const generation = {
            status: falResult.generationStatus.status,
            request_id: falResult.requestId,
            seed: falResult.seed,
            image_url: falResult.imageUrl,
            image_width: falResult.width,
            image_height: falResult.height,
            content_type: falResult.contentType,
            prompt_preview: prompt.slice(0, 120) + (prompt.length > 120 ? '...' : ''),
            theme_used: theme,
            shot_type: shotType,
        };
        console.log('Generation completed:', generation.request_id, '|', generation.image_url?.slice(0, 50) + '...');
        // Step 2: Publish to Instagram with caption (only after we have a valid image URL)
        if (!falResult.imageUrl?.startsWith('http')) {
            return res.status(500).json({
                success: false,
                error: 'Invalid image URL from Fal',
                generation,
                instagram: { status: 'skipped', error: 'No image URL' },
            });
        }
        const igResult = await (0, composio_instagram_1.postImageToInstagram)({
            apiKey: composioKey,
            userId: composioUserId,
            ...(igUserId ? { igUserId } : {}),
            imageUrl: falResult.imageUrl,
            caption,
        });
        const instagram = {
            status: igResult.success ? 'published' : 'failed',
            permalink: igResult.permalink ?? null,
            media_id: igResult.mediaId ?? null,
            error: igResult.error ?? null,
        };
        if (!igResult.success) {
            return res.status(500).json({
                success: false,
                error: igResult.error ?? 'Instagram post failed',
                generation,
                instagram,
                caption_used: caption.slice(0, 100) + (caption.length > 100 ? '...' : ''),
            });
        }
        console.log('Instagram published:', instagram.permalink ?? instagram.media_id);
        return res.status(200).json({
            success: true,
            generation,
            instagram,
            caption_used: caption.slice(0, 200) + (caption.length > 200 ? '...' : ''),
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Cron error:', message);
        return res.status(500).json({
            success: false,
            error: message,
            generation: null,
            instagram: null,
        });
    }
}
