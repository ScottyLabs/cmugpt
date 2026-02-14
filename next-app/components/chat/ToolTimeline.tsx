'use client';

import type { ToolEvent } from '@/types/chat';

const phaseColor = {
  queued: 'var(--text-soft)',
  running: 'var(--accent-2)',
  success: 'var(--accent)',
  error: 'var(--danger)',
} as const;

export function ToolTimeline({ events }: { events: ToolEvent[] }) {
  return (
    <div style={{ padding: 14, height: '100%', overflow: 'auto' }}>
      <h3 style={{ margin: 0, fontSize: 16 }}>Tool Activity</h3>
      <p style={{ margin: '4px 0 14px', color: 'var(--text-soft)', fontSize: 13 }}>
        Live MCP tool execution timeline.
      </p>
      <div style={{ display: 'grid', gap: 10 }}>
        {events.length === 0 && <div style={{ color: 'var(--text-soft)', fontSize: 13 }}>No tool calls yet.</div>}
        {events.map((event) => (
          <article
            key={event.id}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 10,
              background: 'var(--surface-strong)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <strong style={{ fontSize: 13 }}>{event.toolName}</strong>
              <span style={{ color: phaseColor[event.phase], fontSize: 12, fontWeight: 600 }}>{event.phase}</span>
            </div>
            {event.input !== undefined && (
              <pre
                style={{
                  margin: '8px 0 0',
                  padding: 8,
                  borderRadius: 8,
                  background: 'rgba(17,35,31,0.06)',
                  overflowX: 'auto',
                  fontSize: 11,
                }}
              >
                {JSON.stringify(event.input, null, 2)}
              </pre>
            )}
            {event.output !== undefined && (
              <pre
                style={{
                  margin: '8px 0 0',
                  padding: 8,
                  borderRadius: 8,
                  background: 'rgba(13,143,111,0.08)',
                  overflowX: 'auto',
                  fontSize: 11,
                }}
              >
                {JSON.stringify(event.output, null, 2)}
              </pre>
            )}
            {event.error && <p style={{ margin: '8px 0 0', color: 'var(--danger)', fontSize: 12 }}>{event.error}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
