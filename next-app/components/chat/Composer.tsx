'use client';

import { useRef, useState } from 'react';

export function Composer({
  onSend,
  status,
}: {
  onSend: (text: string, files: File[]) => Promise<void>;
  status: string;
}) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canSend = (text.trim().length > 0 || files.length > 0) && status !== 'streaming' && status !== 'submitted';

  return (
    <div style={{ borderTop: '1px solid var(--border)', padding: 14, display: 'grid', gap: 10 }}>
      {files.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {files.map((file) => (
            <span
              key={`${file.name}-${file.size}`}
              style={{ border: '1px solid var(--border)', borderRadius: 999, padding: '4px 10px', fontSize: 12 }}
            >
              {file.name}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Ask anything, invoke tools, or request maps..."
          rows={3}
          style={{
            flex: 1,
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 10,
            resize: 'vertical',
            minHeight: 72,
            background: 'var(--surface-strong)',
          }}
        />
        <div style={{ display: 'grid', gap: 8, width: 120 }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              background: 'var(--surface-strong)',
              cursor: 'pointer',
            }}
          >
            Attach
          </button>
          <button
            type="button"
            disabled={!canSend}
            onClick={async () => {
              await onSend(text, files);
              setText('');
              setFiles([]);
            }}
            style={{
              border: 'none',
              borderRadius: 12,
              background: canSend ? 'var(--accent)' : 'rgba(17,35,31,0.2)',
              color: '#fff',
              cursor: canSend ? 'pointer' : 'not-allowed',
              fontWeight: 700,
            }}
          >
            {status === 'streaming' || status === 'submitted' ? 'Working...' : 'Send'}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf"
        style={{ display: 'none' }}
        onChange={(event) => {
          const next = Array.from(event.target.files ?? []);
          setFiles((prev) => [...prev, ...next]);
          event.currentTarget.value = '';
        }}
      />
    </div>
  );
}
