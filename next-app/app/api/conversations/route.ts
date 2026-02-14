import type { Conversation } from '@/types/chat';
import { listConversations, upsertConversation } from '@/lib/persistence/conversation-store';

export const runtime = 'nodejs';

const resolveUserId = (request: Request): string => {
  const candidate = request.headers.get('x-user-id')?.trim();
  if (candidate && candidate.length > 0) {
    return candidate;
  }
  return 'anonymous';
};

export async function GET(request: Request) {
  const userId = resolveUserId(request);
  const conversations = await listConversations(userId);
  return Response.json({ conversations });
}

export async function POST(request: Request) {
  const userId = resolveUserId(request);

  let body: { conversation?: Conversation };
  try {
    body = (await request.json()) as { conversation?: Conversation };
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  if (!body.conversation || typeof body.conversation.id !== 'string') {
    return new Response('Invalid conversation payload', { status: 400 });
  }

  await upsertConversation(userId, body.conversation);
  return Response.json({ ok: true });
}
