'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';

interface SectionHeaderProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
}

function SectionHeader({ title, isOpen, onToggle }: SectionHeaderProps) {
  return (
    <button
      className="flex items-center justify-between w-full px-4 transition-colors hover:bg-surface-raised"
      style={{
        height: '32px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
      }}
      onClick={onToggle}
    >
      <span
        className="text-text-secondary uppercase tracking-wider"
        style={{
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.08em',
        }}
      >
        {title}
      </span>
      <ChevronDown
        size={16}
        className="text-text-secondary transition-transform"
        style={{
          transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
          transition: 'transform 150ms ease-in-out',
        }}
      />
    </button>
  );
}

export function PropertiesPanel() {
  const [propertiesOpen, setPropertiesOpen] = useState(true);
  const selectedObjectIds = useCanvasStore((s) => s.selectedObjectIds);
  const hasSelection = selectedObjectIds.length > 0;

  return (
    <div
      className="bg-surface flex flex-col h-full"
      style={{ width: '320px', overflow: 'auto' }}
    >
      {!hasSelection ? (
        /* Empty state */
        <div
          className="flex items-center justify-center flex-1 px-4 text-center"
        >
          <p
            className="text-text-secondary"
            style={{ fontSize: '12px' }}
          >
            Select an element to edit its properties
          </p>
        </div>
      ) : (
        /* Selection placeholder — Phase 2 fills detail */
        <div className="flex flex-col">
          <SectionHeader
            title="Properties"
            isOpen={propertiesOpen}
            onToggle={() => setPropertiesOpen((v) => !v)}
          />
          {propertiesOpen && (
            <div className="px-4 py-3">
              <p
                className="text-text-secondary"
                style={{ fontSize: '12px' }}
              >
                Properties panel — Phase 2
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
