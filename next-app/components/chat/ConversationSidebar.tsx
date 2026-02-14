'use client';

import { useMemo } from 'react';
import { useConversationStore } from '@/lib/store/conversations';

export function ConversationSidebar() {
  const conversations = useConversationStore((state) => state.conversations);
  const activeId = useConversationStore((state) => state.activeConversationId);
  const setActive = useConversationStore((state) => state.setActiveConversation);
  const createConversation = useConversationStore((state) => state.createConversation);

  const sorted = useMemo(
    () => Object.values(conversations).sort((a, b) => b.updatedAt - a.updatedAt),
    [conversations],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>CMUGPT Next</div>
        <div style={{ color: 'var(--text-soft)', marginTop: 4, fontSize: 13 }}>Server MCP + tools + artifacts</div>
        <button
          onClick={() => createConversation()}
          style={{
            marginTop: 12,
            width: '100%',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '10px 12px',
            background: 'var(--surface-strong)',
            cursor: 'pointer',
          }}
        >
          New conversation
        </button>
      </div>
      <div style={{ overflow: 'auto', padding: 10, display: 'grid', gap: 8 }}>
        {sorted.map((conversation) => {
          const active = conversation.id === activeId;
          return (
            <button
              key={conversation.id}
              onClick={() => setActive(conversation.id)}
              style={{
                textAlign: 'left',
                border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: active ? 'rgba(13,143,111,0.14)' : 'var(--surface-strong)',
                borderRadius: 12,
                padding: 10,
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>{conversation.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-soft)', marginTop: 4 }}>
                {new Date(conversation.updatedAt).toLocaleString()}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
