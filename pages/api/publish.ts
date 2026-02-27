import type { NextApiRequest, NextApiResponse } from 'next';

const DEFAULT_LORA_URL =
  'https://v3b.fal.media/files/b/0a900b43/al92Go_LjKAQZXGu3Osoa_pytorch_lora_weights.safetensors';

export const config = {
  api: { bodyParser: true },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const method = (req.method ?? '').toUpperCase();
  if (method === 'OPTIONS' ) {
    res.setHeader('Allow', 'OPTIONS, POST');
    return res.status(204).end();
  }
  if (method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      error: 'Method not allowed',
      receivedMethod: req.method,
      hint: 'Use POST. If you see this, the route is deployed but the request method was not POST.',
    });
  }

  // Dynamic imports so a load error in deps returns 500 instead of breaking the route (405 on Vercel)
  const { stackServerApp } = await import('../../stack.config');
  const { buildEntrepreneurPromptFromOptions, PRESETS } = await import('../../lib/prompts');
  const { generateCaptionForPost } = await import('../../lib/caption');
  const { generateImageWithFal } = await import('../../lib/fal');
  const { postImageToInstagram } = await import('../../lib/composio-instagram');
  type PromptOptions = import('../../lib/prompts').PromptOptions;

  const requestLike = {
    headers: {
      get: (name: string) => {
        const v = req.headers[name];
        return (Array.isArray(v) ? v[0] : v) ?? null;
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
