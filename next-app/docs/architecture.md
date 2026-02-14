# Architecture (Next Rewrite)

## Runtime split
- Client: chat UI, conversation persistence in local storage, map rendering, and tool timeline visualization.
- Server (Next route handlers): model orchestration, MCP client lifecycle, and secure tool execution.

## Data flow
1. Client `useChat` sends `UIMessage[]` to `/api/chat`.
2. Route handler converts to model messages and attaches MCP tools from configured servers.
3. AI SDK streams assistant output and tool parts back to client.
4. Client renders parts in transcript and derives tool lifecycle timeline.
5. Client syncs conversations to `/api/conversations` under a per-user id header.
6. Tool outputs are inspected for structured artifacts (maps currently implemented).

## Key modules
- `app/api/chat/route.ts`: server streaming orchestration.
- `app/api/conversations/route.ts`: persistence API for conversation hydrate/upsert.
- `lib/mcp/client.ts`: MCP toolset builder + cleanup.
- `lib/persistence/conversation-store.ts`: JSON-file persistence adapter (default).
- `components/chat/ChatWorkspace.tsx`: chat + state integration.
- `components/chat/ToolTimeline.tsx`: tool lifecycle UI.
- `components/artifacts/MapArtifactCard.tsx`: embedded map renderer.

## Security posture
- Model keys and MCP credentials remain server-side in Next runtime env.
- Browser receives only streamed UI messages and tool outputs.

## Remaining production tasks
- Clerk auth integration in middleware + route handlers.
- DB persistence adapter for conversations (replace default JSON file store).
- E2E regression suite before full cutover.
