'use client';

import { useMemo } from 'react';
import type { ChatMessage } from '@/types/chat';
import { mapArtifactFromUnknown } from '@/lib/chat/artifacts';
import { MarkdownText } from '@/components/chat/MarkdownText';
import { MapArtifactCard } from '@/components/artifacts/MapArtifactCard';

const partType = (part: unknown): string => {
  if (typeof part === 'object' && part !== null && typeof (part as { type?: unknown }).type === 'string') {
    return (part as { type: string }).type;
  }
  return 'unknown';
};

const getText = (part: unknown): string => {
  if (typeof part === 'object' && part !== null && typeof (part as { text?: unknown }).text === 'string') {
    return (part as { text: string }).text;
  }
  return '';
};

const getUrl = (part: unknown): string | null => {
  if (typeof part === 'object' && part !== null && typeof (part as { url?: unknown }).url === 'string') {
    return (part as { url: string }).url;
  }
  return null;
};

export function MessageThread({ messages }: { messages: ChatMessage[] }) {
  const normalized = useMemo(() => messages ?? [], [messages]);

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 16, display: 'grid', gap: 12 }}>
      {normalized.length === 0 && (
        <div style={{ color: 'var(--text-soft)', marginTop: 30, textAlign: 'center' }}>
          Ask for places, maps, or tool-backed insights.
        </div>
      )}
      {normalized.map((message) => {
        const isUser = message.role === 'user';
        const parts = Array.isArray((message as { parts?: unknown }).parts)
          ? ((message as { parts: unknown[] }).parts as unknown[])
          : [];

        return (
          <div key={message.id} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
            <article
              style={{
                maxWidth: '82%',
                borderRadius: 16,
                border: '1px solid var(--border)',
                background: isUser ? 'rgba(17,35,31,0.06)' : 'var(--surface-strong)',
                padding: 12,
              }}
            >
              <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--text-soft)', fontWeight: 600 }}>
                {isUser ? 'You' : 'Assistant'}
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                {parts.map((part, index) => {
                  const type = partType(part);

                  if (type === 'text') {
                    return <MarkdownText key={`${message.id}-text-${index}`} text={getText(part)} />;
                  }

                  if (type === 'file') {
                    const url = getUrl(part);
                    const mediaType = typeof (part as { mediaType?: unknown }).mediaType === 'string'
                      ? (part as { mediaType: string }).mediaType
                      : '';
                    const filename = typeof (part as { filename?: unknown }).filename === 'string'
                      ? (part as { filename: string }).filename
                      : 'file';

                    if (!url) return null;

                    if (mediaType.startsWith('image/')) {
                      return (
                        <img
                          key={`${message.id}-file-${index}`}
                          src={url}
                          alt={filename}
                          style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 10, border: '1px solid var(--border)' }}
                        />
                      );
                    }

                    return (
                      <a key={`${message.id}-file-${index}`} href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
                        {filename}
                      </a>
                    );
                  }

                  if (type.startsWith('tool-')) {
                    const state = typeof (part as { state?: unknown }).state === 'string' ? (part as { state: string }).state : 'unknown';
                    const output = (part as { output?: unknown }).output;
                    const mapArtifact = mapArtifactFromUnknown(output);

                    return (
                      <section
                        key={`${message.id}-tool-${index}`}
                        style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 10, background: 'rgba(13,143,111,0.06)' }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700 }}>
                          {type.replace(/^tool-/, '')} • {state}
                        </div>
                        {output !== undefined && (
                          <pre
                            style={{ marginTop: 8, fontSize: 11, background: 'rgba(17,35,31,0.08)', borderRadius: 8, padding: 8, overflowX: 'auto' }}
                          >
                            {JSON.stringify(output, null, 2)}
                          </pre>
                        )}
                        {mapArtifact && <MapArtifactCard artifact={mapArtifact} />}
                      </section>
                    );
                  }

                  return null;
                })}
              </div>
            </article>
          </div>
        );
      })}
    </div>
  );
}
