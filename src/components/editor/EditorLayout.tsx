
import { AnimatePresence, motion } from 'motion/react';
import { useEditorStore } from '@/stores/editorStore';

interface EditorLayoutProps {
  header: React.ReactNode;
  leftPanel: React.ReactNode;
  canvas: React.ReactNode;
  rightPanel: React.ReactNode;
  bottomBar: React.ReactNode;
  toastProvider?: React.ReactNode;
}

export function EditorLayout({
  header,
  leftPanel,
  canvas,
  rightPanel,
  bottomBar,
  toastProvider,
}: EditorLayoutProps) {
  const leftPanelOpen = useEditorStore((s) => s.leftPanelOpen);
  const rightPanelOpen = useEditorStore((s) => s.rightPanelOpen);

  return (
    <div
      className="bg-bg flex flex-col overflow-hidden"
      style={{ height: '100vh', width: '100vw' }}
    >
      {/* Header row */}
      <div style={{ flexShrink: 0 }}>
        {header}
      </div>

      {/* Main area: left panel + canvas + right panel */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {/* Left Panel */}
        <AnimatePresence initial={false}>
          {leftPanelOpen && (
            <motion.div
              key="left-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-surface border-r border-border overflow-hidden flex-shrink-0"
              style={{ height: '100%' }}
            >
              <div style={{ width: '280px', height: '100%' }}>
                {leftPanel}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas area */}
        <div className="flex-1 overflow-hidden bg-bg" style={{ minWidth: 0 }}>
          {canvas}
        </div>

        {/* Right Panel */}
        <AnimatePresence initial={false}>
          {rightPanelOpen && (
            <motion.div
              key="right-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-surface border-l border-border overflow-hidden flex-shrink-0"
              style={{ height: '100%' }}
            >
              <div style={{ width: '320px', height: '100%' }}>
                {rightPanel}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom bar row */}
      <div style={{ flexShrink: 0 }}>
        {bottomBar}
      </div>

      {/* Toast provider (editor-only) */}
      {toastProvider}
    </div>
  );
}
