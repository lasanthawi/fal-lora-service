"use strict";
/**
 * Shared Fal AI flux-lora: submit job and poll until completion.
 * Used by API generate and cron Instagram flow.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateImageWithFal = generateImageWithFal;
const FAL_SUBMIT_URL = 'https://queue.fal.run/fal-ai/flux-lora';
const FAL_STATUS_BASE = 'https://queue.fal.run/fal-ai/flux-lora';
const MAX_POLL_ATTEMPTS = 90; // 90 * 2s = 3 min max (image usually ready in ~1 min)
const POLL_INTERVAL = 2000; // Poll every 2s so we fetch result soon after completion
async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function generateImageWithFal(options) {
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
    const data = (await response.json());
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
        const status = (await statusRes.json());
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
            const raw = (await resultRes.json());
            const result = raw.response ?? raw;
            if (!result.images?.length) {
                throw new Error('No images in result');
            }
            const img = result.images[0];
            return {
                imageUrl: img.url,
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
