'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ConversationSidebar } from '@/components/chat/ConversationSidebar';
import { MessageThread } from '@/components/chat/MessageThread';
import { ToolTimeline } from '@/components/chat/ToolTimeline';
import { Composer } from '@/components/chat/Composer';
import { MCPStatus } from '@/components/chat/MCPStatus';
import { extractToolEvents } from '@/lib/chat/tool-events';
import { toFilePart } from '@/lib/chat/files';
import { getOrCreateUserId } from '@/lib/chat/user-id';
import { useConversationStore } from '@/lib/store/conversations';
import type { Conversation } from '@/types/chat';

export function ChatWorkspace() {
  const activeConversationId = useConversationStore((state) => state.activeConversationId);
  const conversations = useConversationStore((state) => state.conversations);
  const hydrateConversations = useConversationStore((state) => state.hydrateConversations);
  const upsertMessages = useConversationStore((state) => state.upsertMessages);
  const [userId, setUserId] = useState<string | null>(null);

  const activeConversation = conversations[activeConversationId];
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        prepareSendMessagesRequest: ({ body, headers }) => {
          const mergedHeaders = new Headers(headers);
          if (userId) {
            mergedHeaders.set('x-user-id', userId);
          }

          return {
            body: body ?? {},
            headers: mergedHeaders,
          };
        },
      }),
    [userId],
  );
  const lastHydratedConversationIdRef = useRef<string | null>(null);
  const lastPersistedSnapshotRef = useRef<string>('');

  const { messages, setMessages, sendMessage, status, error } = useChat({
    id: activeConversationId,
    transport,
    messages: activeConversation?.messages ?? [],
  });

  useEffect(() => {
    setUserId(getOrCreateUserId());
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const hydrate = async () => {
      const response = await fetch('/api/conversations', {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { conversations?: Conversation[] };
      if (!cancelled && Array.isArray(data.conversations)) {
        hydrateConversations(data.conversations);
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [userId, hydrateConversations]);

  useEffect(() => {
    if (
      activeConversation &&
      lastHydratedConversationIdRef.current !== activeConversationId
    ) {
      lastHydratedConversationIdRef.current = activeConversationId;
      setMessages(activeConversation.messages);
    }
  }, [activeConversationId, activeConversation, setMessages]);

  useEffect(() => {
    const snapshot = JSON.stringify(messages);
    if (snapshot === lastPersistedSnapshotRef.current) {
      return;
    }
    lastPersistedSnapshotRef.current = snapshot;
    upsertMessages(messages);
  }, [messages, upsertMessages]);

  useEffect(() => {
    if (!userId || !activeConversation) return;

    const timer = setTimeout(() => {
      void fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          conversation: activeConversation,
        }),
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [userId, activeConversation]);

  const events = useMemo(() => extractToolEvents(messages), [messages]);

  return (
    <AppShell
      sidebar={<ConversationSidebar />}
      main={
        <div style={{ height: '100%', display: 'grid', gridTemplateRows: '1fr auto' }}>
          <MessageThread messages={messages} />
          <Composer
            status={status}
            onSend={async (text, files) => {
              const fileParts = await Promise.all(files.map((file) => toFilePart(file)));
              await sendMessage({
                text,
                ...(fileParts.length > 0 ? { files: fileParts } : {}),
              });
            }}
          />
        </div>
      }
      right={
        <div style={{ height: '100%', display: 'grid', gridTemplateRows: 'auto 1fr auto' }}>
          <MCPStatus />
          <ToolTimeline events={events} />
          <div style={{ padding: 12, borderTop: '1px solid var(--border)', color: error ? 'var(--danger)' : 'var(--text-soft)', fontSize: 12 }}>
            {error ? error.message : `Status: ${status}${userId ? ` • user ${userId.slice(0, 8)}` : ''}`}
          </div>
        </div>
      }
    />
  );
}
