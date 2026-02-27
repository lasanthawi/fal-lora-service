import type { NextApiRequest, NextApiResponse } from 'next';

const DEFAULT_LORA_URL =
  'https://v3b.fal.media/files/b/0a900b43/al92Go_LjKAQZXGu3Osoa_pytorch_lora_weights.safetensors';

export const config = { api: { bodyParser: true } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if ((req.method ?? '').toUpperCase() !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { stackServerApp } = await import('../../stack.config');
  const { buildEntrepreneurPrompt } = await import('../../lib/prompts');
  const { generateCaptionForPost } = await import('../../lib/caption');
  const { generateImageWithFal } = await import('../../lib/fal');

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
  const loraUrl = process.env.LORA_URL || DEFAULT_LORA_URL;
  if (!falKey) {
    return res.status(500).json({ error: 'FAL_API_KEY not set' });
  }

  try {
    const { prompt, theme, shotType } = buildEntrepreneurPrompt();
    const { caption } = generateCaptionForPost(
      theme as Parameters<typeof generateCaptionForPost>[0],
      shotType as Parameters<typeof generateCaptionForPost>[1]
    );
    const falResult = await generateImageWithFal({
      prompt,
      loraUrl,
      apiKey: falKey,
      imageSize: 'square',
    });

    return res.status(200).json({
      image_url: falResult.imageUrl,
      caption,
      theme,
      shot_type: shotType,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Random preview error:', message);
    return res.status(500).json({ error: message });
  }
}
