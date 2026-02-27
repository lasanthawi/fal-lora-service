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
- ✅ **Cron: auto-generate images and post to Instagram** (see below)

---

## Instagram cron (scheduled posts)

A serverless cron job generates a random entrepreneur-lifestyle image with your LoRA and posts it to Instagram via [Composio](https://composio.dev).

### Flow

1. **Random selection**: theme (20 occasions), shot type (8 styles), clothing, pose.
2. **Prompt**: Character details (predominantly black hair, smooth skin with very few wrinkles, left forearm tattoo, casual clothes) + selected theme/shot/pose.
3. **Caption & tags**: If no custom caption is provided, a **theme-based caption** and **relevant hashtags** (max 30) are generated from the same theme (e.g. gym → motivational hook + fitness/entrepreneur tags; beach → relaxed hook + lifestyle/travel tags). See `lib/caption.ts`.
4. **Fal AI**: Submit to `fal-ai/flux-lora`, poll until `COMPLETED`, get image URL.
5. **Instagram**: Composio `INSTAGRAM_CREATE_MEDIA_CONTAINER` → `INSTAGRAM_CREATE_POST` with the caption (generated or custom).

### Environment variables (Vercel)

| Variable | Description |
|----------|-------------|
| `FAL_API_KEY` | Fal AI key (same as above) |
| `LORA_URL` | Optional. Your trained LoRA URL; defaults to built-in example. |
| `CRON_SECRET` | Secret for cron auth. Set in Vercel; Vercel sends `Authorization: Bearer <CRON_SECRET>`. Generate with `openssl rand -hex 32`. |
| `COMPOSIO_API_KEY` | From [Composio](https://app.composio.dev). |
| `COMPOSIO_ENTITY_ID` | Composio user/entity ID (the one with Instagram connected). |
| `COMPOSIO_CONNECTED_ACCOUNT_ID` | Optional. When you have 2+ IG accounts: set to the ACCOUNT ID (e.g. `ca_1AEpOs3ST-lK`) to pick which profile to publish to. |
| `INSTAGRAM_IG_USER_ID` | Optional. Instagram Business Account ID (numeric). If unset, resolved from Composio. |

### How the scheduled job runs automatically

1. **Deploy to Vercel**  
   Push your code and deploy (e.g. `vercel` or connect the repo in the Vercel dashboard). Cron jobs only run on **production** deployments, not previews.

2. **Set environment variables in Vercel**  
   In the project: **Settings → Environment Variables**, add all required vars for the cron (e.g. `FAL_API_KEY`, `COMPOSIO_API_KEY`, `COMPOSIO_ENTITY_ID`, `CRON_SECRET`, and optionally `COMPOSIO_CONNECTED_ACCOUNT_ID`, `LORA_URL`).  
   **Important:** Set `CRON_SECRET` to a random string (e.g. `openssl rand -hex 32`). Vercel sends this as `Authorization: Bearer <CRON_SECRET>` when it triggers the cron, and your endpoint uses it to reject unauthorized calls.

3. **Schedule**  
   The cron is defined in `vercel.json` under `crons`. Default: **daily at 14:00 UTC** (`0 14 * * *`). Vercel’s scheduler calls `GET /api/cron/instagram-post` at that time and includes the `CRON_SECRET` header. No extra setup (e.g. external cron service) is needed.

4. **Change the schedule**  
   Edit `vercel.json` → `"crons"` and redeploy. Use standard cron syntax (e.g. `0 9 * * *` for 09:00 UTC daily, or `0 */6 * * *` for every 6 hours).

### Panel UI (generate & publish on demand)

A Next.js UI at **`/panel`** lets you run the generate + publish workflow with custom options. Sign in with [Stack Auth](https://stack-auth.com); only signed-in users can call the publish API.

1. **Set Stack Auth env vars** (from [app.stack-auth.com](https://app.stack-auth.com/projects)):
   - `NEXT_PUBLIC_STACK_PROJECT_ID`
   - `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`
   - `STACK_SECRET_SERVER_KEY`

2. **Open the app** → you’re redirected to sign-in, then to `/panel`.

3. **Panel options**: post idea (occasion/location/topic), vibe, mood, clothing, expression, surrounding, and one-click **presets** (Work mode, Coffee shop, Travel, Meeting, Gym, Driving, Beach / chill, Random). Optional custom caption. Click **Generate & Publish** to create an image and post to Instagram.

4. **Sign-in URL**: `/handler/signin` (or `/handler/signup`).

### Cron schedule

Default in `vercel.json`: **daily at 14:00 UTC** (`0 14 * * *`). Edit `vercel.json` → `crons` to change.

### Endpoints

- **Cron (GET)**  
  `GET https://your-project.vercel.app/api/cron/instagram-post`  
  Header: `Authorization: Bearer <CRON_SECRET>`

- **Manual trigger with custom caption (POST)**  
  `POST https://your-project.vercel.app/api/cron/instagram-post`  
  Header: `Authorization: Bearer <CRON_SECRET>`  
  Body: `{ "caption": "Your caption with #hashtags" }`

### Response

Success returns **generation** (Fal status and image details) and **instagram** (publish status and permalink):

```json
{
  "success": true,
  "generation": {
    "status": "completed",
    "request_id": "45ebca52-3580-414b-a6be-df91096547ce",
    "seed": 4950551527921867000,
    "image_url": "https://fal.media/...",
    "image_width": 512,
    "image_height": 512,
    "content_type": "image/jpeg",
    "prompt_preview": "A professional photograph capturing...",
    "theme_used": "at an upscale networking event, holding a drink",
    "shot_type": "portrait, shallow depth of field, professional"
  },
  "instagram": {
    "status": "published",
    "permalink": "https://www.instagram.com/p/...",
    "media_id": "17895695668004550",
    "error": null
  },
  "caption_used": "Building in public. 🚀 #entrepreneur #lifestyle ..."
}
```

On failure, `generation` and `instagram` are still returned when available so you can see exactly where it failed.

**Note:** Instagram requires image URLs to be **public and direct** (no redirects). Fal’s `fal.media` URLs usually work. If Composio reports that Meta can’t fetch the image, host the image on a public CDN and pass that URL (you’d need a small proxy step).

## License

MIT
