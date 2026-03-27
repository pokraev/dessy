'use client';

import { useState, useRef } from 'react';
import { Sparkles, Upload } from 'lucide-react';
import { FoldTypePicker } from '../FoldTypePicker';
import { StylePicker } from '../StylePicker';
import type { FoldType } from '@/types/generation';

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
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canGenerate = imageBase64 !== null && !isGenerating;

  function handleFileChange(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
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
        Upload a photo of an existing leaflet
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
        {imagePreview ? (
          <img
            src={imagePreview}
            alt="Preview"
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
              Click or drag to upload
            </span>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
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
        The AI will analyze the layout structure and create an editable version with placeholder text
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
        Generate from Photo
      </button>
    </div>
  );
}
