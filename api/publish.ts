import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stackServerApp } from '../stack.config';
import { buildEntrepreneurPromptFromOptions, type PromptOptions, PRESETS } from '../lib/prompts';
import { generateCaptionForPost } from '../lib/caption';
import { generateImageWithFal } from '../lib/fal';
import { postImageToInstagram } from '../lib/composio-instagram';

const DEFAULT_LORA_URL =
  'https://v3b.fal.media/files/b/0a900b43/al92Go_LjKAQZXGu3Osoa_pytorch_lora_weights.safetensors';

function toRequestLike(req: VercelRequest): { headers: { get: (name: string) => string | null } } {
  return {
    headers: {
      get: (name: string) => {
        const v = req.headers[name];
        if (v == null) return null;
        return Array.isArray(v) ? v[0] : v;
      },
    },
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await stackServerApp.getUser({ tokenStore: toRequestLike(req) });
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const falKey = process.env.FAL_API_KEY;
  const composioKey = process.env.COMPOSIO_API_KEY;
  const composioUserId = process.env.COMPOSIO_ENTITY_ID;
  const composioConnectedAccountId = process.env.COMPOSIO_CONNECTED_ACCOUNT_ID?.trim();
  const igUserId = process.env.INSTAGRAM_IG_USER_ID;
  const loraUrl = process.env.LORA_URL || DEFAULT_LORA_URL;

  if (!falKey) {
    return res.status(500).json({ error: 'FAL_API_KEY not set' });
  }
  if (!composioKey || !composioUserId) {
    return res.status(500).json({ error: 'COMPOSIO_API_KEY and COMPOSIO_ENTITY_ID required' });
  }

  const body = typeof req.body === 'object' ? req.body : {};
  const presetName = (body.preset as string)?.trim();
  const customCaption = (body.caption as string)?.trim();
  const options: PromptOptions = {};

  if (presetName && PRESETS[presetName]) {
    Object.assign(options, PRESETS[presetName]);
  }
  if (body.postIdea != null) options.postIdea = String(body.postIdea).trim();
  if (body.occasion != null) options.occasion = String(body.occasion).trim();
  if (body.vibe != null) options.vibe = String(body.vibe).trim();
  if (body.mood != null) options.mood = String(body.mood).trim();
  if (body.clothing != null) options.clothing = String(body.clothing).trim();
  if (body.expression != null) options.expression = String(body.expression).trim();
  if (body.surrounding != null) options.surrounding = String(body.surrounding).trim();

  try {
    const { prompt, theme, shotType } = buildEntrepreneurPromptFromOptions(options);
    const caption: string =
      customCaption ||
      (() => {
        const { caption: generated } = generateCaptionForPost(theme as Parameters<typeof generateCaptionForPost>[0], shotType);
        return generated;
      })();

    const falResult = await generateImageWithFal({
      prompt,
      loraUrl,
      apiKey: falKey,
      imageSize: 'square',
    });
    const imageUrl = falResult.imageUrl;

    const igResult = await postImageToInstagram({
      apiKey: composioKey,
      userId: composioUserId,
      ...(composioConnectedAccountId ? { connectedAccountId: composioConnectedAccountId } : {}),
      ...(igUserId ? { igUserId } : {}),
      imageUrl,
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
        generation: {
          status: falResult.generationStatus.status,
          request_id: falResult.requestId,
          image_url: falResult.imageUrl,
          theme_used: theme,
          shot_type: shotType,
        },
        instagram,
      });
    }

    return res.status(200).json({
      success: true,
      generation: {
        status: falResult.generationStatus.status,
        request_id: falResult.requestId,
        seed: falResult.seed,
        image_url: falResult.imageUrl,
        theme_used: theme,
        shot_type: shotType,
      },
      instagram,
      caption_used: caption.slice(0, 200) + (caption.length > 200 ? '...' : ''),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Publish error:', message);
    return res.status(500).json({
      success: false,
      error: message,
    });
  }
}
