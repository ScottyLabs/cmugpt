# CMUGPT Next Rewrite

This is the Next.js rewrite that replaces the split Vite frontend + FastAPI backend architecture.

## What it includes
- Unified Next.js App Router app
- Server-side `/api/chat` streaming route using AI SDK
- Server-side MCP integration via `@ai-sdk/mcp`
- Conversation sidebar + persistent local history
- Server-backed conversation persistence via `/api/conversations`
- Tool lifecycle timeline UI
- Typed map artifact renderer using MapLibre

## Run locally
```bash
cd next-app
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment
Copy `.env.example` to `.env.local` and set values as needed.

Provider requirements for `/api/chat`:
- Set `OPENROUTER_API_KEY` (recommended), or
- Set `AI_GATEWAY_API_KEY`.

If neither is set, `/api/chat` returns `500` with a clear config error.

## Notes
- `npm run build` uses webpack (`next build --webpack`) for sandbox compatibility.
- Conversation persistence defaults to `data/conversations.json`.

## Cutover strategy
1. Validate all checklist items in `docs/parity-checklist.md`.
2. Add auth + production database adapter if required before production cutover.
3. Move deployment target to `next-app`.
4. Archive old `frontend/` and `backend/` once cutover is verified.
