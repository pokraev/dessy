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

  const isCustomValid = parseFloat(customWidth) > 0 && parseFloat(customHeight) > 0;

  return (
    // Backdrop
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Modal panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
        className="bg-surface border border-border rounded-xl w-[480px] max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal={true}
        aria-labelledby="new-leaflet-title"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <span
            id="new-leaflet-title"
            className="text-sm font-semibold text-text-primary font-sans"
          >
            {t('dashboard.newLeafletTitle')}
          </span>
          <button
            onClick={onClose}
            className="bg-transparent border-none cursor-pointer text-text-secondary flex items-center hover:text-text-primary"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab bar */}
        <div className="border-b border-border flex px-6">
          <button
            className={[
              'px-4 py-2 text-sm font-semibold border-b-2 bg-transparent border-x-0 border-t-0 cursor-pointer font-sans',
              activeTab === 'blank'
                ? 'text-text-primary border-accent'
                : 'text-text-secondary border-transparent',
            ].join(' ')}
            onClick={() => setActiveTab('blank')}
          >
            {t('dashboard.tabBlank')}
          </button>
          <button
            className={[
              'px-4 py-2 text-sm font-semibold border-b-2 bg-transparent border-x-0 border-t-0 cursor-pointer font-sans',
              activeTab === 'templates'
                ? 'text-text-primary border-accent'
                : 'text-text-secondary border-transparent',
            ].join(' ')}
            onClick={() => setActiveTab('templates')}
          >
            {t('dashboard.tabTemplates')}
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'blank' && (
          <div>
            {/* Format cards grid */}
            <div className="grid grid-cols-3 gap-3 px-6 py-4">
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
                  className="bg-surface-raised border border-border hover:border-accent rounded-lg py-4 px-2 text-center cursor-pointer transition-colors"
                >
                  <div className="text-sm font-semibold text-text-primary font-sans">
                    {card.label}
                  </div>
                  <div className="text-xs font-normal text-text-secondary mt-1 font-sans">
                    {card.dimensions}
                  </div>
                </div>
              ))}
            </div>

            {/* Custom dimension inputs */}
            {showCustomInputs && (
              <div className="px-6 pb-4 flex flex-col gap-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-text-secondary font-sans mb-1">
                      {t('dashboard.customWidthLabel')}
                    </label>
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      className="bg-surface-raised border border-border rounded px-2 py-2 text-text-primary text-sm w-full box-border font-sans focus:outline-none focus:border-accent"
                      min="1"
                      placeholder="210"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-text-secondary font-sans mb-1">
                      {t('dashboard.customHeightLabel')}
                    </label>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      className="bg-surface-raised border border-border rounded px-2 py-2 text-text-primary text-sm w-full box-border font-sans focus:outline-none focus:border-accent"
                      min="1"
                      placeholder="297"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCreateCustom}
                  disabled={!isCustomValid}
                  className={[
                    'bg-accent text-text-primary px-4 py-2 rounded-lg border-none cursor-pointer text-sm font-semibold font-sans hover:bg-accent-hover transition-colors',
                    !isCustomValid ? 'opacity-40 cursor-not-allowed' : '',
                  ].join(' ')}
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
