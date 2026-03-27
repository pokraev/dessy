'use client';

interface StylePickerProps {
  value: string;
  onChange: (style: string) => void;
}

const STYLES = ['minimal', 'bold', 'corporate', 'playful', 'elegant'] as const;

export function StylePicker({ value, onChange }: StylePickerProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {STYLES.map((style) => {
        const isSelected = value === style;
        return (
          <button
            key={style}
            type="button"
            onClick={() => onChange(style)}
            style={{
              paddingLeft: '12px',
              paddingRight: '12px',
              paddingTop: '6px',
              paddingBottom: '6px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              background: isSelected ? '#6366f1' : '#1e1e1e',
              color: isSelected ? '#ffffff' : '#888888',
              textTransform: 'capitalize',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {style}
          </button>
        );
      })}
    </div>
  );
}
