
import { useState, useEffect, useRef, useCallback } from 'react';

interface NumberInputProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  label?: string;
  disabled?: boolean;
}

function clamp(v: number, min?: number, max?: number): number {
  let result = v;
  if (min !== undefined && result < min) result = min;
  if (max !== undefined && result > max) result = max;
  return result;
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  label,
  disabled = false,
}: NumberInputProps) {
  const [inputValue, setInputValue] = useState<string>(disabled ? '--' : String(value));
  const committedRef = useRef<number>(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) {
      setInputValue(String(value));
      committedRef.current = value;
    }
  }, [value, disabled]);

  const commit = useCallback(
    (raw: string) => {
      const parsed = parseFloat(raw);
      if (!isNaN(parsed)) {
        const clamped = clamp(parsed, min, max);
        committedRef.current = clamped;
        onChange(clamped);
        setInputValue(String(clamped));
      } else {
        setInputValue(String(committedRef.current));
      }
    },
    [min, max, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const multiplier = e.shiftKey ? 10 : 1;
        const delta = e.key === 'ArrowUp' ? step * multiplier : -step * multiplier;
        const current = parseFloat(inputValue) ?? committedRef.current;
        const next = clamp((isNaN(current) ? committedRef.current : current) + delta, min, max);
        committedRef.current = next;
        onChange(next);
        setInputValue(String(next));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        commit(inputValue);
        inputRef.current?.blur();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setInputValue(String(committedRef.current));
        inputRef.current?.blur();
      }
    },
    [disabled, step, inputValue, min, max, onChange, commit]
  );

  if (disabled) {
    return (
      <div
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {label && (
          <span
            style={{
              position: 'absolute',
              left: '8px',
              fontSize: '11px',
              color: '#888888',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {label}
          </span>
        )}
        <div
          style={{
            height: '28px',
            width: '100%',
            background: '#1e1e1e',
            border: '1px solid #2a2a2a',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: label ? '28px' : '8px',
            paddingRight: suffix ? '24px' : '8px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
            fontWeight: 400,
            color: '#888888',
            fontStyle: 'italic',
            userSelect: 'none',
          }}
        >
          --
        </div>
        {suffix && (
          <span
            style={{
              position: 'absolute',
              right: '8px',
              fontSize: '11px',
              color: '#888888',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {suffix}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: '100%',
      }}
    >
      {label && (
        <span
          style={{
            position: 'absolute',
            left: '8px',
            fontSize: '11px',
            color: '#888888',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 1,
          }}
        >
          {label}
        </span>
      )}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          height: '28px',
          width: '100%',
          background: '#1e1e1e',
          border: '1px solid #2a2a2a',
          borderRadius: '4px',
          outline: 'none',
          padding: `0 ${suffix ? '24px' : '8px'} 0 ${label ? '28px' : '8px'}`,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '13px',
          fontWeight: 400,
          color: '#f5f5f5',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => {
          (e.currentTarget as HTMLInputElement).style.border = '1px solid #6366f1';
        }}
        onBlurCapture={(e) => {
          (e.currentTarget as HTMLInputElement).style.border = '1px solid #2a2a2a';
        }}
      />
      {suffix && (
        <span
          style={{
            position: 'absolute',
            right: '8px',
            fontSize: '11px',
            color: '#888888',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}
