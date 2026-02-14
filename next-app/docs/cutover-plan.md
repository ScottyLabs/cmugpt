# Cutover Plan

1. Keep legacy stack running while validating Next rewrite.
2. Configure `AI_CHAT_MODEL` and `MCP_SERVERS_JSON` in deployment env.
3. Run smoke tests:
   - Send plain text message
   - Send image + prompt
   - Send PDF + prompt
   - Trigger MCP tool call and verify timeline states
   - Validate map artifact render with real tool output
4. Enable authentication and database persistence if production-required.
5. Switch traffic to Next app deployment.
6. Decommission legacy backend routes and Vite app.
