'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useEditorStore } from '@/stores/editorStore';
import { SHORTCUTS, type ShortcutDef } from '@/constants/shortcuts';

/**
 * KeyboardShortcutsModal — overlay showing all keyboard shortcuts grouped by section.
 *
 * Trigger: ? key (via useKeyboardShortcuts) → sets editorStore.shortcutsModalOpen = true
 * Close: Escape key or backdrop click
 *
 * Styling (per UI-SPEC Keyboard Shortcuts Overlay section):
 *   Width: 600px
 *   Background: #141414, border-radius 12px, border 1px #2a2a2a
 *   Backdrop: rgba(0,0,0,0.6)
 *   Sections: 11px Inter uppercase 500, #888888
 *   Rows: shortcut 12px JetBrains Mono #888888 + description 13px Inter #f5f5f5
 */
export function KeyboardShortcutsModal() {
  const isOpen = useEditorStore((s) => s.shortcutsModalOpen);
  const setShortcutsModalOpen = useEditorStore((s) => s.setShortcutsModalOpen);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShortcutsModalOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setShortcutsModalOpen]);

  // Group shortcuts by section
  const sections: ShortcutDef['section'][] = ['Tools', 'Canvas', 'Edit', 'File'];
  const grouped = sections.map((section) => ({
    section,
    shortcuts: SHORTCUTS.filter((s) => s.section === section),
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        // Backdrop
        <motion.div
          key="shortcuts-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShortcutsModalOpen(false)}
        >
          {/* Modal panel */}
          <motion.div
            key="shortcuts-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative overflow-y-auto"
            style={{
              width: '600px',
              maxHeight: '80vh',
              background: '#141414',
              borderRadius: '12px',
              border: '1px solid #2a2a2a',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <h2
              style={{
                fontSize: '13px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                color: '#f5f5f5',
                marginBottom: '20px',
              }}
            >
              Keyboard Shortcuts
            </h2>

            {/* Sections */}
            <div className="flex flex-col gap-6">
              {grouped.map(({ section, shortcuts }) => (
                <div key={section}>
                  {/* Section heading */}
                  <div
                    style={{
                      fontSize: '11px',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      color: '#888888',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '8px',
                    }}
                  >
                    {section}
                  </div>

                  {/* Shortcut rows */}
                  <div className="flex flex-col">
                    {shortcuts.map((shortcut, idx) => (
                      <ShortcutRow key={idx} shortcut={shortcut} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── ShortcutRow ──────────────────────────────────────────────────────────────

interface ShortcutRowProps {
  shortcut: ShortcutDef;
}

function ShortcutRow({ shortcut }: ShortcutRowProps) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ height: '28px' }}
    >
      {/* Description */}
      <span
        style={{
          fontSize: '13px',
          fontFamily: 'Inter, sans-serif',
          color: '#f5f5f5',
        }}
      >
        {shortcut.description}
      </span>

      {/* Key label */}
      <span
        style={{
          fontSize: '12px',
          fontFamily: '"JetBrains Mono", monospace',
          color: '#888888',
        }}
      >
        {shortcut.label}
      </span>
    </div>
  );
}
