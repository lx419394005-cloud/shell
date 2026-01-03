# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pics AI - A React + TypeScript + Vite Progressive Web App providing AI chat and image generation capabilities.

## Commands

```bash
npm run dev          # Start Vite development server
npm run build        # TypeScript check + production build
npm run lint         # Run ESLint on entire project
npm run preview      # Preview production build
```

## Architecture

- **Monolithic App**: Main UI logic resides in `src/App.tsx` (~150KB)
- **Styling**: Tailwind CSS 4.x with custom utilities
- **Animations**: Framer Motion 12.x
- **PWA**: Workbox service worker with offline caching (via `vite-plugin-pwa`)
- **Utilities**: `src/utils/cn.ts` - classnames helper (clsx + tailwind-merge)

## API Integration

### Chat API (OpenAI-compatible)
- **Endpoint**: `https://www.aiping.cn/api/v1/chat/completions`
- **Headers**: `Content-Type: application/json`, `Authorization: Bearer QC-...`
- **Format**: Standard OpenAI chat completions with streaming support (SSE)

```json
{
  "model": "gpt-4o",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "stream": true
}
```

### Image Generation API
- **Endpoint**: `https://ax0rcpp85w.sealosbja.site/generate-image` (via cloud function proxy)
- **Model**: `Doubao-Seedream-4.5`

**Request format**:
```json
{
  "model": "Doubao-Seedream-4.5",
  "input": {
    "prompt": "提示词 (aspect ratio: 16:9)",
    "negative_prompt": "负面提示词"
  },
  "extra_body": {
    "size": "2K", // or "4K" (2K=2048x2048, 4K=2x resolution)
    "scale": 1,
    "sequential_image_generation": "auto",
    "sequential_image_generation_options": { "max_images": 4 }
  }
}
```

**Important notes**:
- Append ` (aspect ratio: W:H)` at the end of the prompt string
- All control parameters (size, scale, etc.) go in `extra_body`, NOT at root level
- Response returns `{ "data": [{ "url": "..." }] }`

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_API_TOKEN` | Bearer authentication token for API requests |
| `VITE_LAF_APP_URL` | Cloud function URL for image generation |
| `VITE_LOCAL_API_URL` | Direct API base URL (defaults to `https://www.aiping.cn/api/v1`) |

## Development Notes

- Uses native `fetch` API (not axios) for better streaming support
- Vite dev server proxies `/api-proxy` to `https://www.aiping.cn`
- Service worker caches Google Fonts (CacheFirst strategy)
