'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, Conversation } from '@/types/chat';

interface ConversationState {
  activeConversationId: string;
  conversations: Record<string, Conversation>;
  setActiveConversation: (id: string) => void;
  upsertMessages: (messages: ChatMessage[]) => void;
  hydrateConversations: (conversations: Conversation[]) => void;
  createConversation: () => string;
}

const makeConversation = (): Conversation => {
  const id = crypto.randomUUID();
  return {
    id,
    title: 'New conversation',
    updatedAt: Date.now(),
    messages: [],
  };
};

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => {
      const initial = makeConversation();

      return {
        activeConversationId: initial.id,
        conversations: {
          [initial.id]: initial,
        },
        setActiveConversation: (id) => set({ activeConversationId: id }),
        hydrateConversations: (incomingConversations) => {
          if (incomingConversations.length === 0) {
            return;
          }

          const incomingMap = Object.fromEntries(
            incomingConversations.map((conversation) => [
              conversation.id,
              conversation,
            ]),
          );

          set((state) => {
            const merged = {
              ...state.conversations,
              ...incomingMap,
            };

            const hasCurrent = Boolean(merged[state.activeConversationId]);
            const fallbackActiveId =
              incomingConversations
                .slice()
                .sort((a, b) => b.updatedAt - a.updatedAt)[0]?.id ??
              state.activeConversationId;

            return {
              conversations: merged,
              activeConversationId: hasCurrent
                ? state.activeConversationId
                : fallbackActiveId,
            };
          });
        },
        createConversation: () => {
          const next = makeConversation();
          set((state) => ({
            activeConversationId: next.id,
            conversations: {
              ...state.conversations,
              [next.id]: next,
            },
          }));
          return next.id;
        },
        upsertMessages: (messages) => {
          const id = get().activeConversationId;
          const current = get().conversations[id] ?? makeConversation();
          const title =
            messages.find((msg) => msg.role === 'user')?.parts
              ?.map((part) => (typeof (part as { text?: unknown }).text === 'string' ? (part as { text: string }).text : ''))
              .join('')
              .slice(0, 64) || current.title;

          set((state) => ({
            conversations: {
              ...state.conversations,
              [id]: {
                ...current,
                title,
                updatedAt: Date.now(),
                messages,
              },
            },
          }));
        },
      };
    },
    {
      name: 'cmugpt-next-conversations',
    },
  ),
);
