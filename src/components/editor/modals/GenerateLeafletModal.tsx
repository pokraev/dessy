'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Sparkles, Camera, Pencil } from 'lucide-react';
import { useBrandStore } from '@/stores/brandStore';
import { PromptTab } from './tabs/PromptTab';
import { PhotoTab } from './tabs/PhotoTab';
import { SketchTab } from './tabs/SketchTab';
import { GenerationPreview } from './GenerationPreview';
import type { GenerationMode, FoldType, GenerationResponse } from '@/types/generation';
import { getApiKey, setApiKey } from '@/lib/storage/apiKeyStorage';
import { generateLeaflet } from '@/lib/ai/generate-leaflet';

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
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyDraft, setKeyDraft] = useState('');

  useEffect(() => {
    const stored = getApiKey();
    setApiKeyState(stored);
    if (!stored) setShowKeyInput(true);
  }, []);

  function handleSaveKey() {
    const trimmed = keyDraft.trim();
    if (trimmed) {
      setApiKey(trimmed);
      setApiKeyState(trimmed);
      setShowKeyInput(false);
    }
  }

  async function handleGenerate(data: { prompt?: string; imageBase64?: string }) {
    if (!apiKey) {
      setShowKeyInput(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResponse(null);

    const brandState = useBrandStore.getState();

    try {
      const result = await generateLeaflet(apiKey, {
        mode: activeTab,
        foldType,
        prompt: data.prompt,
        imageBase64: data.imageBase64,
        brandColors: brandState.brandColors.map((c) => c.hex),
        typographyPresets: brandState.typographyPresets,
        style,
      });
      setResponse(result);
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
              {apiKey && !showKeyInput && (
                <button
                  type="button"
                  onClick={() => setShowKeyInput(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#555',
                    fontSize: '11px',
                    padding: '4px 8px',
                  }}
                >
                  API Key
                </button>
              )}
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
              {showKeyInput && (
                <div style={{
                  marginBottom: '12px',
                  padding: '12px',
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#ccc', marginBottom: '6px' }}>
                    Gemini API Key
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="password"
                      value={keyDraft}
                      onChange={(e) => setKeyDraft(e.target.value)}
                      placeholder="Enter your Gemini API key"
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        fontSize: '13px',
                        background: '#0a0a0a',
                        border: '1px solid #333',
                        borderRadius: '6px',
                        color: '#f5f5f5',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSaveKey}
                      style={{
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: 500,
                        background: '#6366f1',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      Save
                    </button>
                  </div>
                  <p style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>
                    Get a free key at{' '}
                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1' }}>
                      aistudio.google.com/apikey
                    </a>
                  </p>
                </div>
              )}
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
