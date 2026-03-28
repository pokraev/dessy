'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Sparkles, Camera, Pencil } from 'lucide-react';
import { useBrandStore } from '@/stores/brandStore';
import { PromptTab } from './tabs/PromptTab';
import { PhotoTab } from './tabs/PhotoTab';
import { SketchTab } from './tabs/SketchTab';
import { GenerationPreview } from './GenerationPreview';
import type { GenerationMode, FoldType, GenerationResponse } from '@/types/generation';

interface GenerateLeafletModalProps {
  open: boolean;
  onClose: () => void;
  onLoadPages: (response: GenerationResponse) => void;
}

interface TabDef {
  id: GenerationMode;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  { id: 'prompt', label: 'Prompt', icon: <Sparkles size={14} /> },
  { id: 'photo', label: 'Photo', icon: <Camera size={14} /> },
  { id: 'sketch', label: 'Sketch', icon: <Pencil size={14} /> },
];

export function GenerateLeafletModal({ open, onClose, onLoadPages }: GenerateLeafletModalProps) {
  const [activeTab, setActiveTab] = useState<GenerationMode>('prompt');
  const [foldType, setFoldType] = useState<FoldType>('single');
  const [style, setStyle] = useState('minimal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [response, setResponse] = useState<GenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(data: { prompt?: string; imageBase64?: string }) {
    setIsGenerating(true);
    setError(null);
    setResponse(null);

    const brandState = useBrandStore.getState();

    try {
      const res = await fetch('/api/generate-leaflet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: activeTab,
          foldType,
          prompt: data.prompt,
          imageBase64: data.imageBase64,
          brandColors: brandState.brandColors.map((c) => c.hex),
          typographyPresets: brandState.typographyPresets,
          style,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Generation failed (${res.status})`);
      }

      const json = await res.json() as GenerationResponse;
      setResponse(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  }

  function handleRegenerate() {
    // Clear response to allow user to adjust and re-trigger from the tab
    setResponse(null);
    setError(null);
  }

  function handleLoadIntoEditor() {
    if (response) {
      onLoadPages(response);
    }
  }

  const showPreview = isGenerating || response !== null || error !== null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="generate-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={onClose}
        >
          <motion.div
            key="generate-modal-panel"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#141414',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
              width: '640px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            }}
          >
            {/* Modal header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                borderBottom: '1px solid #2a2a2a',
              }}
            >
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#f5f5f5',
                }}
              >
                AI Leaflet Generator
              </span>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#888888',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                  borderRadius: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Tab bar */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid #2a2a2a',
              }}
            >
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 16px',
                      fontSize: '13px',
                      fontWeight: 500,
                      background: 'transparent',
                      border: 'none',
                      borderBottom: isActive ? '2px solid #6366f1' : '2px solid transparent',
                      color: isActive ? '#6366f1' : '#888888',
                      cursor: 'pointer',
                      transition: 'color 0.15s, border-color 0.15s',
                      marginBottom: '-1px',
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content OR preview */}
            <div style={{ padding: '16px' }}>
              {showPreview ? (
                <GenerationPreview
                  pages={response?.pages ?? []}
                  isLoading={isGenerating}
                  error={error}
                  onRegenerate={handleRegenerate}
                  onLoadIntoEditor={handleLoadIntoEditor}
                />
              ) : (
                <>
                  {activeTab === 'prompt' && (
                    <PromptTab
                      foldType={foldType}
                      onFoldTypeChange={setFoldType}
                      style={style}
                      onStyleChange={setStyle}
                      onGenerate={(prompt) => handleGenerate({ prompt })}
                      isGenerating={isGenerating}
                    />
                  )}
                  {activeTab === 'photo' && (
                    <PhotoTab
                      foldType={foldType}
                      onFoldTypeChange={setFoldType}
                      style={style}
                      onStyleChange={setStyle}
                      onGenerate={(imageBase64) => handleGenerate({ imageBase64 })}
                      isGenerating={isGenerating}
                    />
                  )}
                  {activeTab === 'sketch' && (
                    <SketchTab
                      foldType={foldType}
                      onFoldTypeChange={setFoldType}
                      style={style}
                      onStyleChange={setStyle}
                      onGenerate={(imageBase64) => handleGenerate({ imageBase64 })}
                      isGenerating={isGenerating}
                    />
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
