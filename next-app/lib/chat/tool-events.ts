import type { ChatMessage, ToolEvent, ToolPhase } from '@/types/chat';

const getPhase = (state: unknown): ToolPhase => {
  if (state === 'output-available') return 'success';
  if (state === 'output-error') return 'error';
  if (state === 'input-streaming' || state === 'input-available') return 'running';
  return 'queued';
};

const asParts = (message: ChatMessage): Array<Record<string, unknown>> => {
  const parts = (message as { parts?: unknown }).parts;
  if (!Array.isArray(parts)) return [];
  return parts.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null);
};

export const extractToolEvents = (messages: ChatMessage[]): ToolEvent[] => {
  const events: ToolEvent[] = [];

  for (const message of messages) {
    const timestamp = Date.now();
    for (const part of asParts(message)) {
      const rawType = part.type;
      if (typeof rawType !== 'string' || !rawType.startsWith('tool-')) continue;

      const toolName = rawType.replace(/^tool-/, '') || 'tool';
      const toolCallId = typeof part.toolCallId === 'string' ? part.toolCallId : `${message.id}-${toolName}`;
      const phase = getPhase(part.state);
      const input = part.input;
      const output = part.output;
      const error = typeof part.errorText === 'string' ? part.errorText : undefined;

      events.push({
        id: toolCallId,
        toolName,
        phase,
        input,
        output,
        error,
        startedAt: timestamp,
        endedAt: phase === 'running' || phase === 'queued' ? undefined : timestamp,
      });
    }
  }

  return events;
};
