
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Upload, Loader2 } from 'lucide-react';
import { FoldTypePicker } from '../FoldTypePicker';
import { StylePicker } from '../StylePicker';
import type { FoldType } from '@/types/generation';
import { readImageFile } from '@/lib/image-utils';

interface PhotoTabProps {
  foldType: FoldType;
  onFoldTypeChange: (ft: FoldType) => void;
  style: string;
  onStyleChange: (s: string) => void;
  onGenerate: (imageBase64: string) => void;
  isGenerating: boolean;
}

export function PhotoTab({
  foldType,
  onFoldTypeChange,
  style,
  onStyleChange,
  onGenerate,
  isGenerating,
}: PhotoTabProps) {
  const { t } = useTranslation();
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isConverting, setIsConverting] = useState(false);
  const canGenerate = imageBase64 !== null && !isGenerating && !isConverting;

  async function handleFileChange(file: File | null) {
    if (!file) return;
    setIsConverting(true);
    try {
      const dataUrl = await readImageFile(file);
      setImagePreview(dataUrl);
      setImageBase64(dataUrl);
    } catch {
      setImagePreview(null);
      setImageBase64(null);
    } finally {
      setIsConverting(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files[0] ?? null;
    handleFileChange(file);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

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
        {t('generate.uploadPhoto')}
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{
          border: '2px dashed #2a2a2a',
          borderRadius: '8px',
          height: '192px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          overflow: 'hidden',
          position: 'relative',
          background: '#1e1e1e',
        }}
      >
        {isConverting ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Loader2 size={32} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '13px', color: '#888888' }}>{t('generate.convertingImage')}</span>
          </div>
        ) : imagePreview ? (
          <img
            src={imagePreview}
            alt={t('generate.photo')}
            style={{ maxHeight: '176px', objectFit: 'contain' }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Upload size={32} style={{ color: '#888888' }} />
            <span style={{ fontSize: '13px', color: '#888888' }}>
              {t('generate.clickOrDrag')}
            </span>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        style={{ display: 'none' }}
        onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
      />

      {/* Note */}
      <p
        style={{
          fontSize: '11px',
          color: '#888888',
          fontStyle: 'italic',
          margin: 0,
        }}
      >
        {t('generate.photoNote')}
      </p>

      {/* Fold type picker */}
      <FoldTypePicker value={foldType} onChange={onFoldTypeChange} />

      {/* Style picker */}
      <StylePicker value={style} onChange={onStyleChange} />

      {/* Generate button */}
      <button
        type="button"
        disabled={!canGenerate}
        onClick={() => imageBase64 && onGenerate(imageBase64)}
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
        {t('generate.generateFromPhoto')}
      </button>
    </div>
  );
}
