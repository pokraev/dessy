
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { FoldTypePicker } from '../FoldTypePicker';
import { StylePicker } from '../StylePicker';
import type { FoldType } from '@/types/generation';

interface PromptTabProps {
  foldType: FoldType;
  onFoldTypeChange: (ft: FoldType) => void;
  style: string;
  onStyleChange: (s: string) => void;
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
}

export function PromptTab({
  foldType,
  onFoldTypeChange,
  style,
  onStyleChange,
  onGenerate,
  isGenerating,
}: PromptTabProps) {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState('');

  const canGenerate = prompt.trim().length > 0 && !isGenerating;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Label */}
      <div
        style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#888888',
          fontWeight: 500,
        }}
      >
        {t('generate.describeLeaflet')}
      </div>

      {/* Textarea */}
      <textarea
        rows={4}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={t('generate.promptPlaceholder')}
        style={{
          width: '100%',
          background: '#1e1e1e',
          border: '1px solid #2a2a2a',
          borderRadius: '8px',
          color: '#f5f5f5',
          padding: '12px',
          fontSize: '13px',
          resize: 'none',
          outline: 'none',
          fontFamily: 'Inter, sans-serif',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = '#6366f1'; }}
        onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = '#2a2a2a'; }}
      />

      {/* Fold type picker */}
      <FoldTypePicker value={foldType} onChange={onFoldTypeChange} />

      {/* Style picker */}
      <StylePicker value={style} onChange={onStyleChange} />

      {/* Generate button */}
      <button
        type="button"
        disabled={!canGenerate}
        onClick={() => onGenerate(prompt)}
        style={{
          width: '100%',
          height: '40px',
          borderRadius: '8px',
          background: '#6366f1',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: 500,
          border: 'none',
          cursor: canGenerate ? 'pointer' : 'not-allowed',
          opacity: canGenerate ? 1 : 0.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          transition: 'opacity 0.15s',
        }}
      >
        <Sparkles size={16} />
        {t('generate.generateBtn')}
      </button>
    </div>
  );
}
