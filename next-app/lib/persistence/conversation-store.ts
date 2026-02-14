import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Conversation } from '@/types/chat';

type ConversationMap = Record<string, Conversation>;
type StoreShape = Record<string, ConversationMap>;

const storagePath = path.join(process.cwd(), 'data', 'conversations.json');
let writeQueue = Promise.resolve();

const emptyStore: StoreShape = {};

const normalizeConversation = (conversation: Conversation): Conversation => ({
  ...conversation,
  updatedAt: Number(conversation.updatedAt) || Date.now(),
  messages: Array.isArray(conversation.messages) ? conversation.messages : [],
});

const readStore = async (): Promise<StoreShape> => {
  try {
    const raw = await readFile(storagePath, 'utf8');
    if (!raw.trim()) return emptyStore;
    const parsed = JSON.parse(raw) as StoreShape;
    return parsed && typeof parsed === 'object' ? parsed : emptyStore;
  } catch {
    return emptyStore;
  }
};

const writeStore = async (store: StoreShape): Promise<void> => {
  await mkdir(path.dirname(storagePath), { recursive: true });
  await writeFile(storagePath, JSON.stringify(store, null, 2), 'utf8');
};

const queuedWrite = async (updater: (store: StoreShape) => StoreShape) => {
  writeQueue = writeQueue.then(async () => {
    const current = await readStore();
    const next = updater(current);
    await writeStore(next);
  });
  await writeQueue;
};

export const listConversations = async (userId: string): Promise<Conversation[]> => {
  const store = await readStore();
  const conversations = Object.values(store[userId] ?? {}).map(normalizeConversation);
  return conversations.sort((a, b) => b.updatedAt - a.updatedAt);
};

export const upsertConversation = async (
  userId: string,
  conversation: Conversation,
): Promise<void> => {
  await queuedWrite((store) => {
    const nextStore = { ...store };
    const userConversations = { ...(nextStore[userId] ?? {}) };
    userConversations[conversation.id] = normalizeConversation(conversation);
    nextStore[userId] = userConversations;
    return nextStore;
  });
};
