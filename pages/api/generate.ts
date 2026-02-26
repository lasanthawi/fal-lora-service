import type { NextApiRequest, NextApiResponse } from 'next';

const FAL_API_KEY = process.env.FAL_API_KEY;
const DEFAULT_LORA_URL = 'https://v3b.fal.media/files/b/0a900b43/al92Go_LjKAQZXGu3Osoa_pytorch_lora_weights.safetensors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, image_size = 'square', fal_api_key, lora_url = DEFAULT_LORA_URL } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const apiKey = fal_api_key || FAL_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'FAL_API_KEY not configured' });
  }

  try {
    console.log('Submitting to Fal AI flux-lora with LoRA:', lora_url);
    
    // Submit request
    const submitResponse = await fetch('https://queue.fal.run/fal-ai/flux-lora', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_size,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true,
        loras: [{ path: lora_url, scale: 1 }],
      }),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error('Fal AI submission failed:', errorText);
      return res.status(submitResponse.status).json({ error: errorText });
    }

    const submitData = await submitResponse.json();
    console.log('Submitted successfully. Request ID:', submitData.request_id);

    // Return immediately with request_id - let recipe handle polling
    return res.status(200).json({
      request_id: submitData.request_id,
      status: 'IN_QUEUE',
      message: 'Image generation started. Use request_id to check status via Fal AI tools.',
      lora_used: lora_url,
      model: 'flux-lora'
    });

  } catch (error: any) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
