import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stackServerApp } from '../stack.config';
import { buildEntrepreneurPromptFromOptions, type PromptOptions, PRESETS } from '../lib/prompts';
import { generateCaptionForPost } from '../lib/caption';
import { generateImageWithFal } from '../lib/fal';
import { postImageToInstagram } from '../lib/composio-instagram';

const DEFAULT_LORA_URL =
  'https://v3b.fal.media/files/b/0a900b43/al92Go_LjKAQZXGu3Osoa_pytorch_lora_weights.safetensors';

type PublishBody = Record<string, unknown>;

function toTrimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function parsePublishBody(rawBody: unknown): PublishBody {
  if (!rawBody) return {};

  if (typeof rawBody === 'object' && !Buffer.isBuffer(rawBody)) {
    return rawBody as PublishBody;
  }

  const rawText = (Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody)).trim();
  if (!rawText) return {};

  try {
    const parsed = JSON.parse(rawText) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as PublishBody;
    }
  } catch {
    // Not JSON; continue parsing.
  }

  const urlEncoded = new URLSearchParams(rawText);
  if (Array.from(urlEncoded.keys()).length > 0) {
    return Object.fromEntries(urlEncoded.entries());
  }

  return {};
}

function assignPromptOption(options: PromptOptions, key: keyof PromptOptions, value: unknown): void {
  const normalized = toTrimmedString(value);
  if (normalized) options[key] = normalized;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const requestLike = {
    headers: {
      get: (name: string) => {
        const headerValue = req.headers[name];
        return (Array.isArray(headerValue) ? headerValue[0] : headerValue) ?? null;
      },
    },
  };

  const user = await stackServerApp.getUser({ tokenStore: requestLike });
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

  const body = parsePublishBody(req.body);
  const presetName = toTrimmedString(body.preset);
  const customCaption = toTrimmedString(body.caption);
  const options: PromptOptions = {};

  if (presetName && PRESETS[presetName]) {
    Object.assign(options, PRESETS[presetName]);
  }

  assignPromptOption(options, 'postIdea', body.postIdea);
  assignPromptOption(options, 'occasion', body.occasion);
  assignPromptOption(options, 'vibe', body.vibe);
  assignPromptOption(options, 'mood', body.mood);
  assignPromptOption(options, 'clothing', body.clothing);
  assignPromptOption(options, 'expression', body.expression);
  assignPromptOption(options, 'surrounding', body.surrounding);

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

    const igResult = await postImageToInstagram({
      apiKey: composioKey,
      userId: composioUserId,
      ...(composioConnectedAccountId ? { connectedAccountId: composioConnectedAccountId } : {}),
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
