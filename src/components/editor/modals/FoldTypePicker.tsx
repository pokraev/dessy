'use client';

import type { FoldType } from '@/types/generation';

interface FoldTypePickerProps {
  value: FoldType;
  onChange: (ft: FoldType) => void;
}

interface FoldOption {
  type: FoldType;
  label: string;
  description: string;
  pages: string;
  icon: React.ReactNode;
}

function SingleIcon() {
  return (
    <svg width="80" height="56" viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="16" y="4" width="48" height="48" rx="2" fill="#2a2a2a" stroke="#555" strokeWidth="1.5" />
      {/* Content lines */}
      <rect x="24" y="12" width="32" height="3" rx="1" fill="#666" />
      <rect x="24" y="19" width="24" height="2" rx="1" fill="#444" />
      <rect x="24" y="24" width="28" height="2" rx="1" fill="#444" />
      <rect x="24" y="32" width="32" height="14" rx="1" fill="#3a3a3a" stroke="#555" strokeWidth="0.5" />
      <text x="40" y="41" textAnchor="middle" fill="#666" fontSize="6">IMG</text>
    </svg>
  );
}

function BifoldIcon() {
  return (
    <svg width="80" height="56" viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Left panel */}
      <rect x="4" y="4" width="34" height="48" rx="2" fill="#2a2a2a" stroke="#555" strokeWidth="1.5" />
      <rect x="10" y="10" width="22" height="10" rx="1" fill="#3a3a3a" stroke="#555" strokeWidth="0.5" />
      <rect x="10" y="24" width="18" height="2" rx="1" fill="#666" />
      <rect x="10" y="29" width="22" height="2" rx="1" fill="#444" />
      {/* Right panel */}
      <rect x="42" y="4" width="34" height="48" rx="2" fill="#2a2a2a" stroke="#555" strokeWidth="1.5" />
      <rect x="48" y="10" width="14" height="3" rx="1" fill="#666" />
      <rect x="48" y="17" width="22" height="2" rx="1" fill="#444" />
      <rect x="48" y="22" width="22" height="2" rx="1" fill="#444" />
      <rect x="48" y="30" width="22" height="16" rx="1" fill="#3a3a3a" stroke="#555" strokeWidth="0.5" />
      {/* Fold line */}
      <line x1="40" y1="2" x2="40" y2="54" stroke="#6366f1" strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
    </svg>
  );
}

function TripanelIcon() {
  return (
    <svg width="80" height="56" viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Panel 1 */}
      <rect x="2" y="4" width="23" height="48" rx="2" fill="#2a2a2a" stroke="#555" strokeWidth="1.5" />
      <rect x="6" y="10" width="15" height="8" rx="1" fill="#3a3a3a" stroke="#555" strokeWidth="0.5" />
      <rect x="6" y="22" width="12" height="2" rx="1" fill="#666" />
      <rect x="6" y="27" width="15" height="2" rx="1" fill="#444" />
      {/* Panel 2 */}
      <rect x="29" y="4" width="23" height="48" rx="2" fill="#2a2a2a" stroke="#555" strokeWidth="1.5" />
      <rect x="33" y="10" width="10" height="3" rx="1" fill="#666" />
      <rect x="33" y="17" width="15" height="2" rx="1" fill="#444" />
      <rect x="33" y="22" width="15" height="2" rx="1" fill="#444" />
      {/* Panel 3 */}
      <rect x="56" y="4" width="23" height="48" rx="2" fill="#2a2a2a" stroke="#555" strokeWidth="1.5" />
      <rect x="60" y="10" width="15" height="12" rx="1" fill="#3a3a3a" stroke="#555" strokeWidth="0.5" />
      <rect x="60" y="26" width="12" height="2" rx="1" fill="#666" />
      <rect x="60" y="31" width="15" height="2" rx="1" fill="#444" />
    </svg>
  );
}

function TrifoldIcon() {
  return (
    <svg width="80" height="56" viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="76" height="48" rx="2" fill="#2a2a2a" stroke="#555" strokeWidth="1.5" />
      {/* Fold lines */}
      <line x1="27" y1="4" x2="27" y2="52" stroke="#6366f1" strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
      <line x1="53" y1="4" x2="53" y2="52" stroke="#6366f1" strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
      {/* Panel 1 content */}
      <rect x="7" y="10" width="16" height="3" rx="1" fill="#666" />
      <rect x="7" y="16" width="14" height="2" rx="1" fill="#444" />
      {/* Panel 2 content */}
      <rect x="32" y="10" width="16" height="8" rx="1" fill="#3a3a3a" stroke="#555" strokeWidth="0.5" />
      <rect x="32" y="22" width="12" height="2" rx="1" fill="#444" />
      {/* Panel 3 content */}
      <rect x="58" y="10" width="14" height="3" rx="1" fill="#666" />
      <rect x="58" y="16" width="16" height="2" rx="1" fill="#444" />
      {/* Fold arrows */}
      <path d="M24 52 L27 56 L30 52" fill="none" stroke="#6366f1" strokeWidth="1" opacity="0.4" />
      <path d="M50 52 L53 56 L56 52" fill="none" stroke="#6366f1" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

function ZfoldIcon() {
  return (
    <svg width="80" height="56" viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="76" height="48" rx="2" fill="#2a2a2a" stroke="#555" strokeWidth="1.5" />
      {/* Fold lines */}
      <line x1="27" y1="4" x2="27" y2="52" stroke="#6366f1" strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
      <line x1="53" y1="4" x2="53" y2="52" stroke="#6366f1" strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
      {/* Panel content */}
      <rect x="7" y="10" width="16" height="3" rx="1" fill="#666" />
      <rect x="7" y="16" width="14" height="2" rx="1" fill="#444" />
      <rect x="32" y="10" width="16" height="8" rx="1" fill="#3a3a3a" stroke="#555" strokeWidth="0.5" />
      <rect x="58" y="10" width="14" height="3" rx="1" fill="#666" />
      <rect x="58" y="16" width="16" height="2" rx="1" fill="#444" />
      {/* Z pattern arrows */}
      <path d="M24 52 L27 56 L30 52" fill="none" stroke="#6366f1" strokeWidth="1" opacity="0.4" />
      <path d="M50 4 L53 0 L56 4" fill="none" stroke="#6366f1" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

const FOLD_OPTIONS: FoldOption[] = [
  { type: 'single', label: 'Single Page', description: 'One flat page, front only', pages: '1 page', icon: <SingleIcon /> },
  { type: 'bifold', label: 'Bi-fold', description: 'Folded in half, 4 printable sides', pages: '4 panels', icon: <BifoldIcon /> },
  { type: 'tripanel', label: '3-Panel', description: '3 separate pages side by side', pages: '3 pages', icon: <TripanelIcon /> },
  { type: 'trifold', label: 'Tri-fold', description: 'Letter fold, 6 printable panels', pages: '6 panels', icon: <TrifoldIcon /> },
  { type: 'zfold', label: 'Z-fold', description: 'Accordion fold, 6 printable panels', pages: '6 panels', icon: <ZfoldIcon /> },
];

export function FoldTypePicker({ value, onChange }: FoldTypePickerProps) {
  return (
    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
      {FOLD_OPTIONS.map((option) => {
        const isSelected = value === option.type;
        return (
          <button
            key={option.type}
            type="button"
            onClick={() => onChange(option.type)}
            style={{
              flexShrink: 0,
              width: '108px',
              borderRadius: '8px',
              border: isSelected ? '2px solid #6366f1' : '2px solid #2a2a2a',
              background: isSelected ? '#1a1a2e' : '#1e1e1e',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 6px 8px',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            {option.icon}
            <span style={{ fontSize: '12px', color: '#f5f5f5', fontWeight: 600 }}>
              {option.label}
            </span>
            <span style={{ fontSize: '10px', color: '#888888', textAlign: 'center', lineHeight: 1.3 }}>
              {option.description}
            </span>
            <span style={{
              fontSize: '10px',
              color: isSelected ? '#818cf8' : '#666',
              fontWeight: 500,
            }}>
              {option.pages}
            </span>
          </button>
        );
      })}
    </div>
  );
}
