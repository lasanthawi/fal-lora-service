import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * GET /api/ping - confirms API routes are deployed on Vercel.
 * If this returns 200, Next.js API routes are working.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ ok: true, message: 'API routes are live' });
}
