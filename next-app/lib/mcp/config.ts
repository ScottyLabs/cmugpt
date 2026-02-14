import { z } from 'zod';
import type { MCPServerConfig } from '@/types/chat';

const serverSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['http', 'sse']).default('http'),
  url: z.string().url(),
  headers: z.record(z.string(), z.string()).optional(),
});

const configSchema = z.array(serverSchema);

const fallbackServerUrl = process.env.MCP_SERVER_URL;

export const getMCPServers = (): MCPServerConfig[] => {
  const raw = process.env.MCP_SERVERS_JSON;

  if (raw) {
    try {
      return configSchema.parse(JSON.parse(raw));
    } catch (error) {
      console.error('Invalid MCP_SERVERS_JSON; falling back to defaults.', error);
    }
  }

  if (fallbackServerUrl) {
    return [
      {
        id: 'default',
        type: 'http',
        url: fallbackServerUrl,
      },
    ];
  }

  return [];
};
