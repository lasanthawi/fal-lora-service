# Fal AI LoRA Image Generation Service

Vercel serverless API for generating images using Fal AI Flux 2 LoRA.

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/lasanthawi/fal-lora-service)

## Setup

1. **Clone & Install**
```bash
git clone https://github.com/lasanthawi/fal-lora-service.git
cd fal-lora-service
npm install
```

2. **Set Environment Variable in Vercel**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `FAL_API_KEY` = `your_key_id:your_secret`

3. **Deploy**
```bash
vercel
```

## API Usage

**Endpoint:** `POST https://your-project.vercel.app/api/generate`

**Request:**
```json
{
  "prompt": "A distinguished gentleman in his early 40s with salt-and-pepper hair...",
  "image_size": "square"
}
```

**Response:**
```json
{
  "success": true,
  "image_url": "https://fal.media/.../image.jpg",
  "request_id": "...",
  "seed": 12345
}
```

## Features

- ✅ Automatic queue polling (5min timeout)
- ✅ Custom LoRA support
- ✅ CORS enabled
- ✅ TypeScript
- ✅ Production-ready error handling

## License

MIT
