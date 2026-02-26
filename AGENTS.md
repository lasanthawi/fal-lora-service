# AGENTS.md

## Cursor Cloud specific instructions

This is a small Vercel serverless API that wraps the Fal AI Flux LoRA image generation model. See `README.md` for full API usage docs.

### Services

| Service | Description |
|---|---|
| **API endpoint** (`api/generate.ts`) | Primary Vercel serverless function — the main entry point per `vercel.json` |
| **Alt endpoint** (`pages/api/generate.ts`) | Next.js API route variant (not routed by `vercel.json`) |

### Development Notes

- **No lockfile** exists in the repo. `npm install` resolves versions from `package.json` ranges.
- **TypeScript build** (`npm run build` / `tsc`) has pre-existing type errors because `response.json()` returns `unknown` under `strict: true` in `tsconfig.json`. The code still runs correctly via `vercel dev` or the dev server.
- **`vercel dev`** (the canonical `npm run dev`) requires Vercel CLI authentication (`vercel login` or `VERCEL_TOKEN` env var). Without it, use the `dev-server.ts` wrapper: `npx tsx dev-server.ts` starts a local HTTP server on port 3000 that hosts the handler.
- **`FAL_API_KEY`** env var is required for actual image generation. Without it, the API returns a 400 error. The key can also be passed per-request in the JSON body as `fal_api_key`.
- **Lint**: No dedicated linter is configured. Use `npx tsc --noEmit` for type checking.
- **Tests**: No automated test suite exists. Test the API manually via curl against the dev server.
