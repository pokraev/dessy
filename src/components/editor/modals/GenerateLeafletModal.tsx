
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { X, Sparkles, Camera, Pencil } from 'lucide-react';
import { useBrandStore } from '@/stores/brandStore';
import { PromptTab } from './tabs/PromptTab';
import { PhotoTab } from './tabs/PhotoTab';
import { SketchTab } from './tabs/SketchTab';
import { GenerationPreview } from './GenerationPreview';
import type { GenerationMode, FoldType, GenerationResponse } from '@/types/generation';
import type { AIProvider } from '@/lib/storage/apiKeyStorage';
import {
  getApiKey,
  getClaudeApiKey,
  getOpenAIApiKey,
  getProvider, setProvider,
} from '@/lib/storage/apiKeyStorage';
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
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<GenerationMode>('prompt');
  const [foldType, setFoldType] = useState<FoldType>('single');
  const [style, setStyle] = useState('minimal');
  const [maxObjects, setMaxObjects] = useState(50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [response, setResponse] = useState<GenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showKeyInput, setShowKeyInput] = useState(false);

  const [provider, setProviderState] = useState<AIProvider>('gemini');
  const [geminiKey, setGeminiKeyState] = useState<string | null>(null);
  const [claudeKey, setClaudeKeyState] = useState<string | null>(null);
  const [openaiKey, setOpenAIKeyState] = useState<string | null>(null);
  // Reset generation state when modal opens so user sees the initial screen
  useEffect(() => {
    if (open) {
      setGeminiKeyState(getApiKey());
      setClaudeKeyState(getClaudeApiKey());
      setOpenAIKeyState(getOpenAIApiKey());
      setProviderState(getProvider());
      setResponse(null);
      setError(null);
      setIsGenerating(false);
    }
  }, [open]);

  const activeKey = provider === 'claude' ? claudeKey : provider === 'openai' ? openaiKey : geminiKey;

  function handleProviderChange(p: AIProvider) {
    setProviderState(p);
    setProvider(p);
    if (p === 'claude' && !claudeKey) setShowKeyInput(true);
    else if (p === 'openai' && !openaiKey) setShowKeyInput(true);
    else if (p === 'gemini' && !geminiKey) setShowKeyInput(true);
    else setShowKeyInput(false);
  }

  async function handleGenerate(data: { prompt?: string; imageBase64?: string }) {
    if (!activeKey) {
      setShowKeyInput(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResponse(null);

    const brandState = useBrandStore.getState();

    try {
      const result = await generateLeaflet(activeKey, {
        mode: activeTab,
        foldType,
        prompt: data.prompt,
        imageBase64: data.imageBase64,
        brandColors: brandState.brandColors.map((c) => c.hex),
        typographyPresets: brandState.typographyPresets,
        style,
        maxObjects: activeTab === 'sketch' ? undefined : maxObjects,
      }, provider);
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  }

  function handleRegenerate() {
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
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#f5f5f5' }}>
                {t('generate.title')}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {!showKeyInput && (
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
                    {t('generate.settings')}
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
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid #2a2a2a' }}>
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
                    {t(`generate.tab${tab.id.charAt(0).toUpperCase() + tab.id.slice(1)}`)}
                  </button>
                );
              })}
            </div>

            {/* Tab content OR preview */}
            <div style={{ padding: '16px' }}>
              {showKeyInput && (
                <div style={{ padding: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', marginBottom: '12px' }}>
                  <p style={{ fontSize: '13px', color: '#ccc', margin: '0 0 8px' }}>
                    {activeKey
                      ? `${provider === 'gemini' ? 'Gemini' : provider === 'claude' ? 'Claude' : 'OpenAI'} API key configured`
                      : 'No API key configured'}
                  </p>
                  <p style={{ fontSize: '11px', color: '#666', margin: '0 0 8px' }}>
                    Manage API keys and providers in Settings (gear icon in the header).
                  </p>
                  {activeKey && (
                    <button
                      type="button"
                      onClick={() => setShowKeyInput(false)}
                      style={{
                        padding: '6px 12px', fontSize: '12px', background: 'transparent',
                        border: '1px solid #333', borderRadius: '6px', color: '#888', cursor: 'pointer',
                      }}
                    >
                      {t('generate.close')}
                    </button>
                  )}
                </div>
              )}
              {/* Max objects selector — shown for photo and prompt modes */}
              {!showPreview && activeTab !== 'sketch' && (
                <div style={{
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>{t('generate.maxObjects')}</span>
                  {[20, 50, 100].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setMaxObjects(n)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: maxObjects === n ? '#6366f1' : '#0a0a0a',
                        color: maxObjects === n ? '#fff' : '#888',
                        border: `1px solid ${maxObjects === n ? '#6366f1' : '#333'}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}
              {showPreview ? (
                <GenerationPreview
                  pages={response?.pages ?? []}
                  isLoading={isGenerating}
                  error={error}
                  formatId={response?.formatId}
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
