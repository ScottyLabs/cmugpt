import type { UIMessage } from 'ai';

export type ChatMessage = UIMessage;

export type ToolPhase = 'queued' | 'running' | 'success' | 'error';

export interface ToolEvent {
  id: string;
  toolName: string;
  phase: ToolPhase;
  input?: unknown;
  output?: unknown;
  error?: string;
  startedAt: number;
  endedAt?: number;
}

export interface MapArtifact {
  title?: string;
  center: {
    lat: number;
    lng: number;
  };
  zoom?: number;
  markers?: Array<{
    id: string;
    lat: number;
    lng: number;
    label?: string;
  }>;
}

export interface Conversation {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface MCPServerConfig {
  id: string;
  type: 'http' | 'sse';
  url: string;
  headers?: Record<string, string>;
}
