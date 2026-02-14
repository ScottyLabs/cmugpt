import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from 'ai';
import { resolveChatModel } from '@/lib/ai/provider';
import { buildMCPTools } from '@/lib/mcp/client';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface ChatRequestBody {
  messages: UIMessage[];
}

export async function POST(request: Request) {
  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body.messages)) {
    return Response.json(
      { error: 'Invalid request body: messages array is required' },
      { status: 400 },
    );
  }

  let resolvedModel;
  try {
    resolvedModel = await resolveChatModel();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Model configuration error';
    return Response.json({ error: message }, { status: 500 });
  }

  let tools: Record<string, unknown> = {};
  let close: () => Promise<void> = async () => {};

  try {
    const mcpResult = await buildMCPTools();
    tools = mcpResult.tools;
    close = mcpResult.close;
  } catch (error) {
    console.error('MCP initialization failed; continuing without tools', error);
  }

  try {
    const result = streamText({
      model: resolvedModel,
      messages: convertToModelMessages(body.messages),
      tools: tools as any,
      stopWhen: stepCountIs(8),
      onError: ({ error }) => {
        console.error('streamText error', error);
      },
      onFinish: async () => {
        await close();
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    await close();
    console.error('Chat route failed', error);
    return Response.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
