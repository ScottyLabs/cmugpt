import { createMCPClient } from '@ai-sdk/mcp';
import { getMCPServers } from '@/lib/mcp/config';

interface ToolBuildResult {
  tools: Record<string, unknown>;
  close: () => Promise<void>;
}

export const buildMCPTools = async (): Promise<ToolBuildResult> => {
  const servers = getMCPServers();
  if (servers.length === 0) {
    return {
      tools: {},
      close: async () => undefined,
    };
  }

  const clientResults = await Promise.allSettled(
    servers.map(async (server) => {
      const client = await createMCPClient({
        transport:
          server.type === 'sse'
            ? {
                type: 'sse',
                url: server.url,
                headers: server.headers,
              }
            : {
                type: 'http',
                url: server.url,
                headers: server.headers,
              },
      });

      const serverTools = await client.tools();
      return { client, serverTools };
    }),
  );

  const clients = clientResults.flatMap((result) => {
    if (result.status === 'fulfilled') {
      return [result.value];
    }

    console.warn('MCP server initialization failed:', result.reason);
    return [];
  });

  const merged = Object.assign(
    {},
    ...clients.map((item) => item.serverTools),
  ) as Record<string, unknown>;

  return {
    tools: merged,
    close: async () => {
      await Promise.all(clients.map((item) => item.client.close()));
    },
  };
};
