import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { X, Loader2 } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useBrandStore } from '@/stores/brandStore';
import { usePromptCrafterStore } from '@/stores/promptCrafterStore';
import { getApiKey } from '@/lib/storage/apiKeyStorage';
import {
  enrichPrompt,
  callGeminiImage,
  assemblePrompt,
  snapAspectRatio,
  base64ToBlob,
  generateThumbnail,
  placeImageIntoFrame,
} from '@/lib/ai/generate-image';
import { storeImage, getImage } from '@/lib/storage/imageDb';
import type {
  PromptStep,
  PromptVariations,
  PromptCustomization,
  FrameContext,
} from '@/types/promptCrafter';
import toast from 'react-hot-toast';

interface PromptCrafterModalProps {
  open: boolean;
  onClose: () => void;
}

const MOOD_OPTIONS = ['', 'warm', 'cool', 'dramatic', 'neutral', 'serene', 'energetic'];
const LIGHTING_OPTIONS = ['', 'natural daylight', 'studio', 'golden hour', 'soft diffused', 'dramatic shadow'];
const COMPOSITION_OPTIONS = ['', 'close-up', 'wide shot', 'overhead', 'eye level', 'macro detail'];
const STYLE_OPTIONS = ['', 'photorealistic', 'editorial', 'product', 'lifestyle', 'artistic'];
const BACKGROUND_OPTIONS = ['', 'white', 'bokeh', 'solid color', 'natural', 'gradient', 'contextual'];

const DEFAULT_CUSTOMIZATION: PromptCustomization = {
  mood: '',
  lighting: '',
  composition: '',
  style: '',
  background: '',
};

function getPositionHint(left: number, top: number, canvasWidth: number, canvasHeight: number): string {
  const hThird = canvasWidth / 3;
  const vThird = canvasHeight / 3;
  const hPos = left < hThird ? 'left' : left < hThird * 2 ? 'center' : 'right';
  const vPos = top < vThird ? 'top' : top < vThird * 2 ? 'middle' : 'bottom';
  if (hPos === 'center' && vPos === 'middle') return 'center';
  return `${vPos}-${hPos}`;
}

export function PromptCrafterModal({ open, onClose }: PromptCrafterModalProps) {
  const { t } = useTranslation();

  const [step, setStep] = useState<PromptStep>('idle');
  const [baseDescription, setBaseDescription] = useState('');
  const [variations, setVariations] = useState<PromptVariations | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<'editorial' | 'lifestyle' | 'bold' | null>(null);
  const [customization, setCustomization] = useState<PromptCustomization>(DEFAULT_CUSTOMIZATION);
  const [assembledPromptText, setAssembledPromptText] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedImageId, setGeneratedImageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [frameSnapshot, setFrameSnapshot] = useState<FrameContext | null>(null);

  const objectUrlsRef = useRef<string[]>([]);

  const { history, addToHistory, clearHistory } = usePromptCrafterStore();

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // Initialize when modal opens
  useEffect(() => {
    if (!open) return;

    const apiKey = getApiKey();
    if (!apiKey) {
      setError(t('promptCrafter.apiKeyMissing'));
      setStep('idle');
      return;
    }

    const canvas = useCanvasStore.getState().canvasRef;
    if (!canvas) {
      setError(t('promptCrafter.noFrame'));
      setStep('idle');
      return;
    }

    const obj = canvas.getActiveObject() as (import('fabric').FabricObject & Record<string, unknown>) | null;
    if (!obj || (obj as Record<string, unknown>).customType !== 'image') {
      setError(t('promptCrafter.noFrame'));
      setStep('idle');
      return;
    }

    const scaleX = (obj.scaleX as number) ?? 1;
    const scaleY = (obj.scaleY as number) ?? 1;
    const widthPx = ((obj.width as number) ?? 100) * scaleX;
    const heightPx = ((obj.height as number) ?? 100) * scaleY;
    const left = (obj.left as number) ?? 0;
    const top = (obj.top as number) ?? 0;

    const canvasEl = canvas.getElement();
    const canvasWidth = canvasEl?.width ?? 800;
    const canvasHeight = canvasEl?.height ?? 600;

    const brandColors = useBrandStore.getState().brandColors.map((s) => s.hex);

    const snapshot: FrameContext = {
      frameId: (obj.id as string) ?? '',
      widthPx,
      heightPx,
      left,
      top,
      scaleX,
      scaleY,
      aspectRatio: snapAspectRatio(widthPx, heightPx),
      positionHint: getPositionHint(left, top, canvasWidth, canvasHeight),
      brandColors,
      frameName: (obj.name as string) ?? 'Image Frame',
    };

    setFrameSnapshot(snapshot);
    setStep('idle');
    setVariations(null);
    setSelectedVariation(null);
    setAssembledPromptText('');
    setGeneratedImageUrl(null);
    setGeneratedImageId(null);
    setError(null);
  }, [open, t]);

  // Trigger generation when step transitions to 'generating'
  useEffect(() => {
    if (step !== 'generating') return;

    const apiKey = getApiKey();
    if (!apiKey || !frameSnapshot) {
      setError(t('promptCrafter.generateError'));
      setStep('customizing');
      return;
    }

    let cancelled = false;

    async function doGenerate() {
      try {
        const dataUrl = await callGeminiImage(apiKey!, assembledPromptText, frameSnapshot!.aspectRatio);
        if (cancelled) return;

        const blob = base64ToBlob(dataUrl);
        const imageId = await storeImage(blob);
        if (cancelled) return;

        const thumbnailDataUrl = await generateThumbnail(dataUrl);
        if (cancelled) return;

        addToHistory({
          id: crypto.randomUUID(),
          imageId,
          thumbnailDataUrl,
          prompt: assembledPromptText,
          generatedAt: new Date().toISOString(),
        });

        setGeneratedImageUrl(dataUrl);
        setGeneratedImageId(imageId);
        setStep('result');
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : t('promptCrafter.generateError'));
        setStep('customizing');
      }
    }

    doGenerate();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function handleEnrich() {
    const apiKey = getApiKey();
    if (!apiKey || !frameSnapshot) return;

    setError(null);
    setStep('enriching');

    try {
      const result = await enrichPrompt(apiKey, baseDescription, frameSnapshot);
      setVariations(result);
      setStep('customizing');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('promptCrafter.enrichError'));
      setStep('idle');
    }
  }

  function handleSelectVariation(key: 'editorial' | 'lifestyle' | 'bold') {
    if (!variations) return;
    setSelectedVariation(key);
    const assembled = assemblePrompt(variations[key], customization);
    setAssembledPromptText(assembled);
    setError(null);
  }

  function handleCustomizationChange(field: keyof PromptCustomization, value: string) {
    const newCustomization = { ...customization, [field]: value };
    setCustomization(newCustomization);
    if (selectedVariation && variations) {
      const assembled = assemblePrompt(variations[selectedVariation], newCustomization);
      setAssembledPromptText(assembled);
    }
    setError(null);
  }

  async function handleUseThis() {
    if (!generatedImageUrl || !generatedImageId || !frameSnapshot) return;

    const canvas = useCanvasStore.getState().canvasRef;
    if (!canvas) return;

    const frame = canvas.getObjects().find(
      (o) => (o as import('fabric').FabricObject & Record<string, unknown>).id === frameSnapshot.frameId
    );

    if (frame) {
      await placeImageIntoFrame(
        canvas,
        frame as import('fabric').FabricObject & Record<string, unknown>,
        generatedImageUrl,
        generatedImageId
      );
      onClose();
    } else {
      // Frame not found — place at canvas center
      toast(t('promptCrafter.frameLost'));
      const { FabricImage } = await import('fabric');
      const blob = base64ToBlob(generatedImageUrl);
      const objectUrl = URL.createObjectURL(blob);
      objectUrlsRef.current.push(objectUrl);
      try {
        const img = await FabricImage.fromURL(objectUrl);
        const canvasEl = canvas.getElement();
        const cx = (canvasEl?.width ?? 800) / 2;
        const cy = (canvasEl?.height ?? 600) / 2;
        img.set({ left: cx - (img.width ?? 100) / 2, top: cy - (img.height ?? 100) / 2, originX: 'left', originY: 'top' });
        canvas.add(img as unknown as import('fabric').FabricObject);
        canvas.setActiveObject(img as unknown as import('fabric').FabricObject);
        canvas.requestRenderAll();
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
      onClose();
    }
  }

  async function handleHistoryEntryClick(imageId: string) {
    const objectUrl = await getImage(imageId);
    if (!objectUrl) return;
    objectUrlsRef.current.push(objectUrl);
    setGeneratedImageUrl(objectUrl);
    setGeneratedImageId(imageId);
    setStep('result');
  }

  const dropdownStyle: React.CSSProperties = {
    flex: 1,
    padding: '6px 8px',
    fontSize: '12px',
    background: '#252525',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    color: '#f5f5f5',
    outline: 'none',
    cursor: 'pointer',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#666',
    marginBottom: '4px',
    display: 'block',
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="prompt-crafter-backdrop"
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
            key="prompt-crafter-panel"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
              width: '640px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
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
                {t('promptCrafter.title')}
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

            {/* Content */}
            <div style={{ padding: '16px' }}>
              {/* Error banner */}
              {error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#ef4444',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '13px',
                    marginBottom: '12px',
                    gap: '8px',
                  }}
                >
                  <span style={{ flex: 1 }}>{error}</span>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', padding: '2px', flexShrink: 0 }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Step: idle */}
              {(step === 'idle') && (
                <div>
                  <label style={{ ...labelStyle, marginBottom: '8px' }}>
                    {t('promptCrafter.descriptionPlaceholder')}
                  </label>
                  <textarea
                    value={baseDescription}
                    onChange={(e) => { setBaseDescription(e.target.value); setError(null); }}
                    placeholder={t('promptCrafter.descriptionPlaceholder')}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '13px',
                      background: '#252525',
                      border: '1px solid #2a2a2a',
                      borderRadius: '8px',
                      color: '#f5f5f5',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'Inter, sans-serif',
                      lineHeight: 1.5,
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleEnrich}
                    disabled={!baseDescription.trim()}
                    style={{
                      marginTop: '12px',
                      padding: '10px 20px',
                      fontSize: '13px',
                      fontWeight: 600,
                      background: baseDescription.trim() ? '#6366f1' : '#333',
                      color: baseDescription.trim() ? '#fff' : '#666',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: baseDescription.trim() ? 'pointer' : 'default',
                      width: '100%',
                    }}
                  >
                    {t('promptCrafter.enrich')}
                  </button>
                </div>
              )}

              {/* Step: enriching */}
              {step === 'enriching' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: '12px' }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  >
                    <Loader2 size={28} color="#6366f1" />
                  </motion.div>
                  <span style={{ fontSize: '14px', color: '#888' }}>{t('promptCrafter.enriching')}</span>
                </div>
              )}

              {/* Step: generating */}
              {step === 'generating' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: '12px' }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  >
                    <Loader2 size={28} color="#6366f1" />
                  </motion.div>
                  <span style={{ fontSize: '14px', color: '#888' }}>{t('promptCrafter.generating')}</span>
                </div>
              )}

              {/* Step: customizing */}
              {step === 'customizing' && variations && (
                <div>
                  {/* Variation cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {(['editorial', 'lifestyle', 'bold'] as const).map((key) => {
                      const isSelected = selectedVariation === key;
                      const text = variations[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleSelectVariation(key)}
                          style={{
                            padding: '12px 14px',
                            background: '#252525',
                            border: `2px solid ${isSelected ? '#6366f1' : '#2a2a2a'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            color: '#f5f5f5',
                          }}
                        >
                          <div style={{ fontSize: '11px', fontWeight: 600, color: isSelected ? '#6366f1' : '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                            {t(`promptCrafter.${key}`)}
                          </div>
                          <div style={{ fontSize: '12px', color: '#ccc', lineHeight: 1.4 }}>
                            {text.length > 80 ? text.slice(0, 80) + '…' : text}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Customization knobs */}
                  {selectedVariation ? (
                    <>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        {(
                          [
                            { field: 'mood' as const, label: t('promptCrafter.mood'), options: MOOD_OPTIONS },
                            { field: 'lighting' as const, label: t('promptCrafter.lighting'), options: LIGHTING_OPTIONS },
                            { field: 'composition' as const, label: t('promptCrafter.composition'), options: COMPOSITION_OPTIONS },
                            { field: 'style' as const, label: t('promptCrafter.style'), options: STYLE_OPTIONS },
                            { field: 'background' as const, label: t('promptCrafter.background'), options: BACKGROUND_OPTIONS },
                          ]
                        ).map(({ field, label, options }) => (
                          <div key={field} style={{ flex: '1 1 calc(50% - 4px)', minWidth: '120px' }}>
                            <label style={labelStyle}>{label}</label>
                            <select
                              value={customization[field]}
                              onChange={(e) => handleCustomizationChange(field, e.target.value)}
                              style={dropdownStyle}
                            >
                              {options.map((opt) => (
                                <option key={opt} value={opt}>{opt || '—'}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>

                      {/* Assembled prompt textarea */}
                      <div style={{ marginBottom: '12px' }}>
                        <label style={labelStyle}>{t('promptCrafter.generate')}</label>
                        <textarea
                          value={assembledPromptText}
                          onChange={(e) => setAssembledPromptText(e.target.value)}
                          rows={3}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            fontSize: '12px',
                            background: '#252525',
                            border: '1px solid #2a2a2a',
                            borderRadius: '8px',
                            color: '#ccc',
                            outline: 'none',
                            resize: 'vertical',
                            fontFamily: 'Inter, sans-serif',
                            lineHeight: 1.5,
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setStep('generating')}
                        disabled={!selectedVariation}
                        style={{
                          padding: '10px 20px',
                          fontSize: '13px',
                          fontWeight: 600,
                          background: '#6366f1',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          width: '100%',
                        }}
                      >
                        {t('promptCrafter.generate')}
                      </button>
                    </>
                  ) : (
                    <p style={{ fontSize: '12px', color: '#666', textAlign: 'center', padding: '8px 0' }}>
                      {t('promptCrafter.selectVariation')}
                    </p>
                  )}

                  {/* History strip */}
                  <HistoryStrip
                    history={history}
                    onSelect={handleHistoryEntryClick}
                    onClear={clearHistory}
                    t={t}
                  />
                </div>
              )}

              {/* Step: result */}
              {step === 'result' && generatedImageUrl && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                    <img
                      src={generatedImageUrl}
                      alt="Generated"
                      style={{ maxHeight: '400px', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <button
                      type="button"
                      onClick={handleUseThis}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        fontSize: '13px',
                        fontWeight: 600,
                        background: '#6366f1',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      {t('promptCrafter.useThis')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('generating')}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        fontSize: '13px',
                        fontWeight: 500,
                        background: 'transparent',
                        color: '#f5f5f5',
                        border: '1px solid #2a2a2a',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      {t('promptCrafter.regenerate')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('customizing')}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        fontSize: '13px',
                        fontWeight: 500,
                        background: 'transparent',
                        color: '#f5f5f5',
                        border: '1px solid #2a2a2a',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      {t('promptCrafter.editPrompt')}
                    </button>
                  </div>

                  {/* History strip in result step too */}
                  <HistoryStrip
                    history={history}
                    onSelect={handleHistoryEntryClick}
                    onClear={clearHistory}
                    t={t}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface HistoryStripProps {
  history: import('@/types/promptCrafter').ImageHistoryEntry[];
  onSelect: (imageId: string) => void;
  onClear: () => void;
  t: (key: string) => string;
}

function HistoryStrip({ history, onSelect, onClear, t }: HistoryStripProps) {
  if (history.length === 0) {
    return (
      <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #2a2a2a' }}>
        <span style={{ fontSize: '11px', color: '#555' }}>{t('promptCrafter.noHistory')}</span>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #2a2a2a' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {t('promptCrafter.history')} ({history.length})
        </span>
        <button
          type="button"
          onClick={onClear}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#555' }}
        >
          {t('promptCrafter.clearHistory')}
        </button>
      </div>
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
        {history.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => onSelect(entry.imageId)}
            title={entry.prompt}
            style={{
              flexShrink: 0,
              width: '48px',
              height: '48px',
              borderRadius: '6px',
              overflow: 'hidden',
              border: '2px solid #2a2a2a',
              cursor: 'pointer',
              padding: 0,
              background: '#252525',
            }}
          >
            <img
              src={entry.thumbnailDataUrl}
              alt={entry.prompt}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
