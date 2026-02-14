import { getMCPServers } from '@/lib/mcp/config';

export const runtime = 'nodejs';

export async function GET() {
  return Response.json({
    servers: getMCPServers(),
  });
}
