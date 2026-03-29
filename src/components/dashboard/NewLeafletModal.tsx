'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FORMATS } from '@/constants/formats';
import { saveProject } from '@/lib/storage/projectStorage';
import { useAppStore } from '@/stores/appStore';
import { TemplateGallery } from './TemplateGallery';
import type { ProjectMeta, LeafletFormatId } from '@/types/project';

type ActiveTab = 'blank' | 'templates';

interface FormatCard {
  id: LeafletFormatId;
  label: string;
  dimensions: string;
}

const FORMAT_CARDS: FormatCard[] = [
  { id: 'A4',      label: 'A4',      dimensions: '210 x 297 mm' },
  { id: 'A5',      label: 'A5',      dimensions: '148 x 210 mm' },
  { id: 'DL',      label: 'DL',      dimensions: '99 x 210 mm' },
  { id: 'bifold',  label: 'Bifold',  dimensions: '420 x 297 mm' },
  { id: 'trifold', label: 'Trifold', dimensions: '630 x 297 mm' },
  { id: 'custom',  label: 'Custom',  dimensions: 'Custom size' },
];

interface NewLeafletModalProps {
  onClose: () => void;
}

export function NewLeafletModal({ onClose }: NewLeafletModalProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ActiveTab>('blank');
  const [showCustomInputs, setShowCustomInputs] = useState(false);
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');

  function createBlankProject(formatId: LeafletFormatId) {
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    const meta: ProjectMeta = {
      id: newId,
      name: t('app.untitledLeaflet'),
      format: formatId,
      createdAt: now,
      updatedAt: now,
    };
    const pageCount = FORMATS[formatId]?.pages ?? 1;
    const pages = Array.from({ length: pageCount }, () => ({
      id: crypto.randomUUID(),
      elements: [],
      background: '#FFFFFF',
    }));
    saveProject(newId, { meta, canvasJSON: {}, pageData: { pages, currentPageIndex: 0 } });
    useAppStore.getState().openProject(newId);
    onClose();
  }

  function handleFormatClick(card: FormatCard) {
    if (card.id === 'custom') {
      setShowCustomInputs(true);
      return;
    }
    createBlankProject(card.id);
  }

  function handleCreateCustom() {
    const w = parseFloat(customWidth);
    const h = parseFloat(customHeight);
    if (!w || !h || w <= 0 || h <= 0) return;
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    const meta: ProjectMeta = {
      id: newId,
      name: t('app.untitledLeaflet'),
      format: 'custom',
      createdAt: now,
      updatedAt: now,
    };
    const pages = [{ id: crypto.randomUUID(), elements: [], background: '#FFFFFF' }];
    saveProject(newId, {
      meta,
      canvasJSON: {},
      pageData: { pages, currentPageIndex: 0, customWidthMm: w, customHeightMm: h },
    });
    useAppStore.getState().openProject(newId);
    onClose();
  }

  const tabButtonStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: active ? '#f5f5f5' : '#888',
    borderBottom: active ? '2px solid #6366f1' : '2px solid transparent',
    fontFamily: 'Arial',
  });

  return (
    // Backdrop
    <div
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
      {/* Modal panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
        style={{
          background: '#141414',
          border: '1px solid #2a2a2a',
          borderRadius: '12px',
          width: '480px',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal={true}
        aria-labelledby="new-leaflet-title"
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 24px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            id="new-leaflet-title"
            style={{ fontSize: '16px', fontWeight: 600, color: '#f5f5f5', fontFamily: 'Arial' }}
          >
            {t('dashboard.newLeafletTitle')}
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center' }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab bar */}
        <div style={{ borderBottom: '1px solid #2a2a2a', display: 'flex', padding: '0 24px' }}>
          <button style={tabButtonStyle(activeTab === 'blank')} onClick={() => setActiveTab('blank')}>
            {t('dashboard.tabBlank')}
          </button>
          <button style={tabButtonStyle(activeTab === 'templates')} onClick={() => setActiveTab('templates')}>
            {t('dashboard.tabTemplates')}
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'blank' && (
          <div>
            {/* Format cards grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                padding: '16px 24px',
              }}
            >
              {FORMAT_CARDS.map((card) => (
                <div
                  key={card.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleFormatClick(card)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleFormatClick(card);
                    }
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = '#6366f1';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = '#2a2a2a';
                  }}
                  style={{
                    background: '#1e1e1e',
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                    padding: '16px 8px',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#f5f5f5', fontFamily: 'Arial' }}>
                    {card.label}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 400, color: '#888', marginTop: '4px', fontFamily: 'Arial' }}>
                    {card.dimensions}
                  </div>
                </div>
              ))}
            </div>

            {/* Custom dimension inputs */}
            {showCustomInputs && (
              <div style={{ padding: '0 24px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#888', fontFamily: 'Arial', marginBottom: '4px' }}>
                      {t('dashboard.customWidthLabel')}
                    </label>
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      style={{
                        background: '#1e1e1e',
                        border: '1px solid #2a2a2a',
                        borderRadius: '4px',
                        padding: '8px',
                        color: '#f5f5f5',
                        fontSize: '14px',
                        width: '100%',
                        boxSizing: 'border-box',
                        fontFamily: 'Arial',
                      }}
                      min="1"
                      placeholder="210"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#888', fontFamily: 'Arial', marginBottom: '4px' }}>
                      {t('dashboard.customHeightLabel')}
                    </label>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      style={{
                        background: '#1e1e1e',
                        border: '1px solid #2a2a2a',
                        borderRadius: '4px',
                        padding: '8px',
                        color: '#f5f5f5',
                        fontSize: '14px',
                        width: '100%',
                        boxSizing: 'border-box',
                        fontFamily: 'Arial',
                      }}
                      min="1"
                      placeholder="297"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCreateCustom}
                  disabled={!(parseFloat(customWidth) > 0 && parseFloat(customHeight) > 0)}
                  style={{
                    background: '#6366f1',
                    color: '#f5f5f5',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily: 'Arial',
                    opacity: parseFloat(customWidth) > 0 && parseFloat(customHeight) > 0 ? 1 : 0.4,
                  }}
                >
                  Create
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'templates' && (
          <TemplateGallery onClose={onClose} />
        )}
      </motion.div>
    </div>
  );
}
