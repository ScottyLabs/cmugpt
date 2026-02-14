'use client';

import { useEffect, useState } from 'react';

interface MCPResponse {
  servers: Array<{
    id: string;
    type: string;
    url: string;
  }>;
}

export function MCPStatus() {
  const [data, setData] = useState<MCPResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/mcp')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load MCP servers');
        return res.json() as Promise<MCPResponse>;
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div style={{ padding: 14, borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 13, fontWeight: 700 }}>MCP Servers</div>
      {error && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>{error}</div>}
      {!error && !data && <div style={{ color: 'var(--text-soft)', fontSize: 12, marginTop: 6 }}>Loading...</div>}
      {data && (
        <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
          {data.servers.length === 0 && <div style={{ color: 'var(--text-soft)', fontSize: 12 }}>No MCP servers configured.</div>}
          {data.servers.map((server) => (
            <div key={server.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 8, fontSize: 12 }}>
              <strong>{server.id}</strong> ({server.type})
              <div style={{ color: 'var(--text-soft)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis' }}>{server.url}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
