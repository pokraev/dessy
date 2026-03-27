'use client';

import type { FoldType } from '@/types/generation';

interface FoldTypePickerProps {
  value: FoldType;
  onChange: (ft: FoldType) => void;
}

interface FoldOption {
  type: FoldType;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
}

function SingleIcon() {
  return (
    <svg width="40" height="30" viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="36" height="26" rx="1" fill="white" stroke="#555" strokeWidth="1.5" />
    </svg>
  );
}

function BifoldIcon() {
  return (
    <svg width="40" height="30" viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="36" height="26" rx="1" fill="white" stroke="#555" strokeWidth="1.5" />
      <line x1="20" y1="2" x2="20" y2="28" stroke="#888" strokeWidth="1" strokeDasharray="3 2" />
    </svg>
  );
}

function TrifoldIcon() {
  return (
    <svg width="40" height="30" viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="36" height="26" rx="1" fill="white" stroke="#555" strokeWidth="1.5" />
      <line x1="14" y1="2" x2="14" y2="28" stroke="#888" strokeWidth="1" strokeDasharray="3 2" />
      <line x1="26" y1="2" x2="26" y2="28" stroke="#888" strokeWidth="1" strokeDasharray="3 2" />
    </svg>
  );
}

function ZfoldIcon() {
  return (
    <svg width="40" height="30" viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="36" height="26" rx="1" fill="white" stroke="#555" strokeWidth="1.5" />
      <line x1="14" y1="2" x2="14" y2="28" stroke="#888" strokeWidth="1" strokeDasharray="3 2" />
      <line x1="26" y1="2" x2="26" y2="28" stroke="#888" strokeWidth="1" strokeDasharray="3 2" />
      <path d="M14 15 L26 15" stroke="#888" strokeWidth="1" strokeDasharray="2 2" />
    </svg>
  );
}

const FOLD_OPTIONS: FoldOption[] = [
  { type: 'single', label: 'Single Page', subtitle: 'A4 - 1 page', icon: <SingleIcon /> },
  { type: 'bifold', label: 'Bi-fold', subtitle: '4 panels', icon: <BifoldIcon /> },
  { type: 'trifold', label: 'Tri-fold', subtitle: '6 panels', icon: <TrifoldIcon /> },
  { type: 'zfold', label: 'Z-fold', subtitle: '6 panels', icon: <ZfoldIcon /> },
];

export function FoldTypePicker({ value, onChange }: FoldTypePickerProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
      }}
    >
      {FOLD_OPTIONS.map((option) => {
        const isSelected = value === option.type;
        return (
          <button
            key={option.type}
            type="button"
            onClick={() => onChange(option.type)}
            style={{
              height: '80px',
              borderRadius: '8px',
              border: isSelected ? '2px solid #6366f1' : '2px solid #2a2a2a',
              background: '#1e1e1e',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '8px',
              transition: 'border-color 0.15s',
            }}
          >
            {option.icon}
            <span style={{ fontSize: '12px', color: '#f5f5f5', fontWeight: 500 }}>
              {option.label}
            </span>
            <span style={{ fontSize: '11px', color: '#888888' }}>
              {option.subtitle}
            </span>
          </button>
        );
      })}
    </div>
  );
}
