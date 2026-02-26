import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildEntrepreneurPrompt } from '../../lib/prompts';
import { generateCaptionForPost } from '../../lib/caption';
import { generateImageWithFal } from '../../lib/fal';
import { postImageToInstagram } from '../../lib/composio-instagram';

const DEFAULT_LORA_URL =
  'https://v3b.fal.media/files/b/0a900b43/al92Go_LjKAQZXGu3Osoa_pytorch_lora_weights.safetensors';

function requireCronSecret(req: VercelRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // allow if not set (e.g. local dev)
  const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '').trim();
  return token === secret;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
  const customCaption = (body.caption as string)?.trim();
  const providedImageUrl = (body.image_url as string)?.trim();

  try {
    const { prompt, theme, shotType } = buildEntrepreneurPrompt();
    const caption: string =
      customCaption ||
      (() => {
        const { caption: generated } = generateCaptionForPost(theme, shotType);
        return generated;
      })();
    console.log('Theme:', theme, '| Shot:', shotType, '| Caption:', caption.slice(0, 60) + '...');

    let imageUrl: string;
    let generation: {
      status: string;
      request_id?: string;
      seed?: number;
      image_url: string;
      image_width?: number;
      image_height?: number;
      content_type?: string;
      prompt_preview?: string;
      theme_used: string;
      shot_type: string;
    } | null;

    if (providedImageUrl?.startsWith('http')) {
      imageUrl = providedImageUrl;
      generation = {
        status: 'skipped',
        image_url: imageUrl,
        theme_used: theme,
        shot_type: shotType,
      };
      console.log('Using provided image_url (skip Fal generation)');
    } else {
      const falResult = await generateImageWithFal({
        prompt,
        loraUrl,
        apiKey: falKey,
        imageSize: 'square',
      });
      imageUrl = falResult.imageUrl;
      generation = {
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
    }

    if (!imageUrl?.startsWith('http')) {
      return res.status(500).json({
        success: false,
        error: 'Invalid image URL',
        generation,
        instagram: { status: 'skipped', error: 'No image URL' },
      });
    }

    const igResult = await postImageToInstagram({
      apiKey: composioKey,
      userId: composioUserId,
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
  } catch (err: unknown) {
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
