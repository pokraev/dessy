
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
  getApiKey, setApiKey, clearApiKey,
  getClaudeApiKey, setClaudeApiKey, clearClaudeApiKey,
  getOpenAIApiKey, setOpenAIApiKey, clearOpenAIApiKey,
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
  const [geminiKeyDraft, setGeminiKeyDraft] = useState('');
  const [claudeKeyDraft, setClaudeKeyDraft] = useState('');
  const [openaiKeyDraft, setOpenAIKeyDraft] = useState('');

  useEffect(() => {
    const storedGemini = getApiKey();
    const storedClaude = getClaudeApiKey();
    const storedOpenAI = getOpenAIApiKey();
    const storedProvider = getProvider();
    setGeminiKeyState(storedGemini);
    setClaudeKeyState(storedClaude);
    setOpenAIKeyState(storedOpenAI);
    setProviderState(storedProvider);
    if (storedProvider === 'claude' && !storedClaude) setShowKeyInput(true);
    else if (storedProvider === 'openai' && !storedOpenAI) setShowKeyInput(true);
    else if (storedProvider === 'gemini' && !storedGemini) setShowKeyInput(true);
  }, []);

  // Reset generation state when modal opens so user sees the initial screen
  useEffect(() => {
    if (open) {
      setResponse(null);
      setError(null);
      setIsGenerating(false);
    }
  }, [open]);

  const activeKey = provider === 'claude' ? claudeKey : provider === 'openai' ? openaiKey : geminiKey;

  function handleSaveGeminiKey() {
    const trimmed = geminiKeyDraft.trim();
    if (trimmed) {
      setApiKey(trimmed);
      setGeminiKeyState(trimmed);
      setGeminiKeyDraft('');
    }
  }

  function handleSaveClaudeKey() {
    const trimmed = claudeKeyDraft.trim();
    if (trimmed) {
      setClaudeApiKey(trimmed);
      setClaudeKeyState(trimmed);
      setClaudeKeyDraft('');
    }
  }

  function handleSaveOpenAIKey() {
    const trimmed = openaiKeyDraft.trim();
    if (trimmed) {
      setOpenAIApiKey(trimmed);
      setOpenAIKeyState(trimmed);
      setOpenAIKeyDraft('');
    }
  }

  function handleClearGeminiKey() {
    clearApiKey();
    setGeminiKeyState(null);
  }

  function handleClearClaudeKey() {
    clearClaudeApiKey();
    setClaudeKeyState(null);
  }

  function handleClearOpenAIKey() {
    clearOpenAIApiKey();
    setOpenAIKeyState(null);
  }

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
                  {/* Provider toggle */}
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                    {(['gemini', 'claude', 'openai'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleProviderChange(p)}
                        style={{
                          padding: '6px 14px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: provider === p ? '#6366f1' : '#0a0a0a',
                          color: provider === p ? '#fff' : '#888',
                          border: `1px solid ${provider === p ? '#6366f1' : '#333'}`,
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        {p === 'gemini' ? 'Gemini' : p === 'claude' ? 'Claude' : 'OpenAI'}
                      </button>
                    ))}
                  </div>

                  {/* Gemini key */}
                  <label style={{ display: 'block', fontSize: '13px', color: '#ccc', marginBottom: '6px' }}>
                    {t('generate.geminiKey')} {geminiKey && <span style={{ color: '#4ade80', fontSize: '11px' }}>{t('generate.saved')}</span>}
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <input
                      type="password"
                      value={geminiKeyDraft}
                      onChange={(e) => setGeminiKeyDraft(e.target.value)}
                      placeholder={geminiKey ? '••••••••' : t('generate.enterGeminiKey')}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveGeminiKey()}
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
                      onClick={handleSaveGeminiKey}
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
                      {t('generate.save')}
                    </button>
                    {geminiKey && (
                      <button
                        type="button"
                        onClick={handleClearGeminiKey}
                        style={{
                          padding: '8px 12px',
                          fontSize: '13px',
                          background: 'transparent',
                          color: '#ef4444',
                          border: '1px solid #333',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Claude key */}
                  <label style={{ display: 'block', fontSize: '13px', color: '#ccc', marginBottom: '6px' }}>
                    {t('generate.claudeKey')} {claudeKey && <span style={{ color: '#4ade80', fontSize: '11px' }}>{t('generate.saved')}</span>}
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <input
                      type="password"
                      value={claudeKeyDraft}
                      onChange={(e) => setClaudeKeyDraft(e.target.value)}
                      placeholder={claudeKey ? '••••••••' : t('generate.enterClaudeKey')}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveClaudeKey()}
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
                      onClick={handleSaveClaudeKey}
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
                      {t('generate.save')}
                    </button>
                    {claudeKey && (
                      <button
                        type="button"
                        onClick={handleClearClaudeKey}
                        style={{
                          padding: '8px 12px',
                          fontSize: '13px',
                          background: 'transparent',
                          color: '#ef4444',
                          border: '1px solid #333',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* OpenAI key */}
                  <label style={{ display: 'block', fontSize: '13px', color: '#ccc', marginBottom: '6px' }}>
                    OpenAI API Key {openaiKey && <span style={{ color: '#4ade80', fontSize: '11px' }}>{t('generate.saved')}</span>}
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <input
                      type="password"
                      value={openaiKeyDraft}
                      onChange={(e) => setOpenAIKeyDraft(e.target.value)}
                      placeholder={openaiKey ? '••••••••' : 'sk-...'}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveOpenAIKey()}
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
                      onClick={handleSaveOpenAIKey}
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
                      {t('generate.save')}
                    </button>
                    {openaiKey && (
                      <button
                        type="button"
                        onClick={handleClearOpenAIKey}
                        style={{
                          padding: '8px 12px',
                          fontSize: '13px',
                          background: 'transparent',
                          color: '#ef4444',
                          border: '1px solid #333',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <p style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                    Gemini:{' '}
                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1' }}>
                      aistudio.google.com/apikey
                    </a>
                    {' | '}
                    Claude:{' '}
                    <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1' }}>
                      console.anthropic.com
                    </a>
                    {' | '}
                    OpenAI:{' '}
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1' }}>
                      platform.openai.com/api-keys
                    </a>
                  </p>

                  {activeKey && (
                    <button
                      type="button"
                      onClick={() => setShowKeyInput(false)}
                      style={{
                        marginTop: '8px',
                        padding: '4px 12px',
                        fontSize: '12px',
                        background: 'transparent',
                        border: '1px solid #333',
                        borderRadius: '4px',
                        color: '#888',
                        cursor: 'pointer',
                      }}
                    >
                      {t('generate.closeSettings')}
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
