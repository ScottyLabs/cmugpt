# Parity Checklist (Legacy -> Next Rewrite)

## Core chat
- [x] Streaming assistant responses
- [x] User text message sending
- [x] Multi-part message rendering

## Multimodal
- [x] Image upload (client file parts)
- [x] PDF upload (client file parts)
- [ ] Audio upload parity (not yet implemented)

## MCP + tools
- [x] MCP server-side connection via AI SDK MCP client
- [x] Tool calls exposed to model
- [x] Tool execution lifecycle visible in UI
- [x] Tool output details inspectable

## Map UX
- [x] Structured map artifact detection
- [x] Embedded interactive map renderer
- [ ] URL iframe map fallback renderer (optional enhancement)

## Product/UI
- [x] Conversation sidebar
- [x] Persistent local conversation history
- [x] Streaming status + error state
- [x] Responsive shell baseline

## Auth + persistence
- [x] Server-backed conversation persistence route (`/api/conversations`)
- [x] Per-user conversation namespace using client session id header
- [ ] Clerk integration in Next app
- [ ] Production database adapter (current default: JSON file store)

## Ops
- [x] Environment template for model + MCP config
- [ ] CI checks and end-to-end tests
