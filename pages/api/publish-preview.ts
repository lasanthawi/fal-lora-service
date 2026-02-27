import type { NextApiRequest, NextApiResponse } from 'next';

export const config = { api: { bodyParser: true } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if ((req.method ?? '').toUpperCase() !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { stackServerApp } = await import('../../stack.config');
  const { postImageToInstagram } = await import('../../lib/composio-instagram');

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

  const composioKey = process.env.COMPOSIO_API_KEY;
  const composioUserId = process.env.COMPOSIO_ENTITY_ID;
  const composioConnectedAccountId = process.env.COMPOSIO_CONNECTED_ACCOUNT_ID?.trim();
  const igUserId = process.env.INSTAGRAM_IG_USER_ID;

  if (!composioKey || !composioUserId) {
    return res.status(500).json({ error: 'COMPOSIO_API_KEY and COMPOSIO_ENTITY_ID required' });
  }

  const body = typeof req.body === 'object' ? req.body : {};
  const imageUrl = (body.image_url as string)?.trim();
  const caption = (body.caption as string)?.trim() || '';

  if (!imageUrl?.startsWith('http')) {
    return res.status(400).json({ error: 'image_url is required and must be a valid URL' });
  }

  try {
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
        instagram,
      });
    }

    return res.status(200).json({
      success: true,
      instagram,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Publish preview error:', message);
    return res.status(500).json({ success: false, error: message });
  }
}
