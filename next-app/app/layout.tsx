import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CMUGPT Next',
  description: 'Next.js rewrite with MCP-aware streaming chat',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
