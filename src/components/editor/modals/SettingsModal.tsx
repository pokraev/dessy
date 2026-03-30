import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import type { AIProvider } from '@/lib/storage/apiKeyStorage';
import {
  getApiKey, setApiKey, clearApiKey,
  getClaudeApiKey, setClaudeApiKey, clearClaudeApiKey,
  getOpenAIApiKey, setOpenAIApiKey, clearOpenAIApiKey,
  getProvider, setProvider,
} from '@/lib/storage/apiKeyStorage';
import { setLanguage } from '@/i18n';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

interface ProviderConfig {
  id: AIProvider;
  label: string;
  keyLabel: string;
  placeholder: string;
  helpUrl: string;
  helpLabel: string;
  getKey: () => string | null;
  setKey: (k: string) => void;
  clearKey: () => void;
  capabilities: string[];
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'gemini',
    label: 'Google Gemini',
    keyLabel: 'Gemini API Key',
    placeholder: 'AIza...',
    helpUrl: 'https://aistudio.google.com/apikey',
    helpLabel: 'aistudio.google.com',
    getKey: getApiKey,
    setKey: setApiKey,
    clearKey: clearApiKey,
    capabilities: ['Leaflet generation', 'Image generation'],
  },
  {
    id: 'claude',
    label: 'Anthropic Claude',
    keyLabel: 'Claude API Key',
    placeholder: 'sk-ant-...',
    helpUrl: 'https://console.anthropic.com/settings/keys',
    helpLabel: 'console.anthropic.com',
    getKey: getClaudeApiKey,
    setKey: setClaudeApiKey,
    clearKey: clearClaudeApiKey,
    capabilities: ['Leaflet generation'],
  },
  {
    id: 'openai',
    label: 'OpenAI',
    keyLabel: 'OpenAI API Key',
    placeholder: 'sk-...',
    helpUrl: 'https://platform.openai.com/api-keys',
    helpLabel: 'platform.openai.com',
    getKey: getOpenAIApiKey,
    setKey: setOpenAIApiKey,
    clearKey: clearOpenAIApiKey,
    capabilities: ['Leaflet generation', 'Image generation (DALL-E 3)'],
  },
];

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { t, i18n } = useTranslation();
  const [activeProvider, setActiveProvider] = useState<AIProvider>('gemini');
  const [keys, setKeys] = useState<Record<AIProvider, string | null>>({ gemini: null, claude: null, openai: null });
  const [drafts, setDrafts] = useState<Record<AIProvider, string>>({ gemini: '', claude: '', openai: '' });

  useEffect(() => {
    if (!open) return;
    setActiveProvider(getProvider());
    setKeys({
      gemini: getApiKey(),
      claude: getClaudeApiKey(),
      openai: getOpenAIApiKey(),
    });
  }, [open]);

  function handleSetActive(id: AIProvider) {
    setActiveProvider(id);
    setProvider(id);
  }

  function handleSaveKey(p: ProviderConfig) {
    const trimmed = drafts[p.id].trim();
    if (!trimmed) return;
    p.setKey(trimmed);
    setKeys((prev) => ({ ...prev, [p.id]: trimmed }));
    setDrafts((prev) => ({ ...prev, [p.id]: '' }));
  }

  function handleClearKey(p: ProviderConfig) {
    p.clearKey();
    setKeys((prev) => ({ ...prev, [p.id]: null }));
    if (activeProvider === p.id) {
      // Switch to first provider that has a key
      const fallback = PROVIDERS.find((prov) => prov.id !== p.id && keys[prov.id]);
      if (fallback) handleSetActive(fallback.id);
    }
  }

  function handleLanguageChange(lang: string) {
    setLanguage(lang);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-surface border border-border rounded-xl w-[520px] max-h-[80vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary m-0">{t('settings.title', 'Settings')}</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-md bg-transparent border-none cursor-pointer text-text-secondary hover:text-text-primary"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* Language */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
              {t('settings.language', 'Language')}
            </h3>
            <div className="flex gap-2">
              {[
                { code: 'en', label: 'English' },
                { code: 'bg', label: 'Български' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`px-4 py-2 text-sm rounded-lg border cursor-pointer transition-colors ${
                    i18n.language === lang.code
                      ? 'bg-accent text-white border-accent'
                      : 'bg-transparent text-text-secondary border-border hover:border-text-secondary'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </section>

          {/* Active AI Provider */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
              {t('settings.activeProvider', 'Active AI Provider')}
            </h3>
            <div className="flex gap-2 mb-4">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSetActive(p.id)}
                  className={`flex-1 px-3 py-2.5 text-sm font-medium rounded-lg border cursor-pointer transition-colors ${
                    activeProvider === p.id
                      ? 'bg-accent text-white border-accent'
                      : 'bg-transparent text-text-secondary border-border hover:border-text-secondary'
                  }`}
                >
                  {p.label}
                  {keys[p.id] && <span className="ml-1.5 text-[10px] opacity-70">✓</span>}
                </button>
              ))}
            </div>
            {activeProvider && (
              <div className="bg-surface-raised rounded-lg px-4 py-3 text-xs text-text-secondary">
                <span className="font-medium text-text-primary">
                  {PROVIDERS.find((p) => p.id === activeProvider)?.label}
                </span>
                {' — '}
                {PROVIDERS.find((p) => p.id === activeProvider)?.capabilities.join(', ')}
              </div>
            )}
          </section>

          {/* API Keys */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
              {t('settings.apiKeys', 'API Keys')}
            </h3>
            <div className="flex flex-col gap-4">
              {PROVIDERS.map((p) => (
                <div key={p.id} className="bg-surface-raised rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-text-primary font-medium">{p.keyLabel}</label>
                    {keys[p.id] ? (
                      <span className="text-[11px] text-success font-medium">{t('settings.configured', 'Configured')}</span>
                    ) : (
                      <span className="text-[11px] text-text-secondary">{t('settings.notSet', 'Not set')}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={drafts[p.id]}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder={keys[p.id] ? '••••••••' : p.placeholder}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveKey(p)}
                      className="flex-1 px-3 py-2 text-sm bg-bg border border-border rounded-md text-text-primary outline-none focus:border-accent"
                    />
                    <button
                      onClick={() => handleSaveKey(p)}
                      className="px-4 py-2 text-sm font-medium bg-accent text-white border-none rounded-md cursor-pointer hover:bg-accent-hover transition-colors"
                    >
                      {t('settings.save', 'Save')}
                    </button>
                    {keys[p.id] && (
                      <button
                        onClick={() => handleClearKey(p)}
                        className="px-3 py-2 text-sm text-danger bg-transparent border border-border rounded-md cursor-pointer hover:bg-danger/10 transition-colors"
                      >
                        {t('settings.clear', 'Clear')}
                      </button>
                    )}
                  </div>
                  <a
                    href={p.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-accent hover:underline mt-2 inline-block"
                  >
                    {t('settings.getKey', 'Get key')} → {p.helpLabel}
                  </a>
                </div>
              ))}
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
