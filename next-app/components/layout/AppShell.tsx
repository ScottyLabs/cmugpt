'use client';

import { motion } from 'framer-motion';

export function AppShell({
  sidebar,
  main,
  right,
}: {
  sidebar: React.ReactNode;
  main: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <motion.div
        className="workspace-grid"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <aside className="panel" style={{ overflow: 'hidden' }}>
          {sidebar}
        </aside>
        <main className="panel" style={{ overflow: 'hidden' }}>
          {main}
        </main>
        <aside className="panel" style={{ overflow: 'hidden' }}>
          {right}
        </aside>
      </motion.div>
    </div>
  );
}
