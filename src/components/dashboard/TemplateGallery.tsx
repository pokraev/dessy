'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TEMPLATES, TEMPLATE_CATEGORIES } from '@/lib/templates/templates-index';
import type { TemplateEntry, TemplateCategory } from '@/lib/templates/templates-index';
import { useAppStore } from '@/stores/appStore';
import { CATEGORY_COLORS, createProjectFromTemplate } from '@/lib/templates/template-utils';
import { useTemplateThumbnails } from '@/hooks/useTemplateThumbnails';

interface TemplateGalleryProps {
  onClose: () => void;
}

export function TemplateGallery({ onClose }: TemplateGalleryProps) {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<'All' | TemplateCategory>('All');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateEntry | null>(null);

  const filtered = activeCategory === 'All'
    ? TEMPLATES
    : TEMPLATES.filter((tmpl) => tmpl.category === activeCategory);

  const thumbnails = useTemplateThumbnails(TEMPLATES);

  function handleUseTemplate() {
    if (!selectedTemplate) return;
    const newId = createProjectFromTemplate(selectedTemplate);
    useAppStore.getState().openProject(newId);
    onClose();
  }

  return (
    <div className="flex flex-col">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5 px-6 pt-3">
        {(['All', ...TEMPLATE_CATEGORIES] as Array<'All' | TemplateCategory>).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={[
              'rounded-full px-2.5 py-1 text-[11px] font-normal cursor-pointer border font-sans transition-colors',
              activeCategory === cat
                ? 'bg-accent text-text-primary border-transparent'
                : 'bg-surface-raised text-text-secondary border-border hover:text-text-primary',
            ].join(' ')}
          >
            {t(`templates.cat${cat.replace(/\s+/g, '')}`, cat)}
          </button>
        ))}
      </div>

      {/* Template card grid */}
      <div className="grid gap-3 px-6 py-4 [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))]">
        {filtered.map((tmpl) => (
          <button
            key={tmpl.id}
            onClick={() => setSelectedTemplate(tmpl)}
            className="bg-surface-raised border border-border hover:border-accent rounded-lg overflow-hidden cursor-pointer text-left p-0 transition-colors"
          >
            {/* Thumbnail */}
            <div
              className="h-[120px] flex items-center justify-center overflow-hidden"
              style={{ background: CATEGORY_COLORS[tmpl.category] ?? '#4b5563' }}
            >
              {thumbnails[tmpl.id] ? (
                <img src={thumbnails[tmpl.id]} alt={tmpl.name} className="w-full h-full object-contain p-2" />
              ) : (
                <span className="text-[11px] text-white/60 font-sans">{tmpl.format}</span>
              )}
            </div>
            <div className="px-2 pt-2 pb-1 text-xs font-semibold text-text-primary font-sans">
              {t(`templates.${tmpl.id}`, tmpl.name)}
            </div>
            <div className="px-2 pb-2 text-xs font-normal text-text-secondary font-sans">
              {t(`templates.cat${tmpl.category.replace(/\s+/g, '')}`, tmpl.category)}
            </div>
          </button>
        ))}
      </div>

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <div
          className="fixed inset-0 bg-black/75 z-[60] flex items-center justify-center"
          onClick={() => setSelectedTemplate(null)}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-surface border border-border rounded-xl w-[640px] p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setSelectedTemplate(null)}
              className="absolute top-4 right-4 bg-transparent border-none cursor-pointer text-text-secondary flex items-center justify-center hover:text-text-primary"
              aria-label="Close preview"
            >
              <X size={16} />
            </button>

            {/* Two-column layout */}
            <div className="grid grid-cols-2 gap-6">
              {/* Preview area */}
              <div
                className="h-[300px] rounded-lg flex items-center justify-center overflow-hidden"
                style={{ background: CATEGORY_COLORS[selectedTemplate.category] ?? '#4b5563' }}
              >
                {thumbnails[selectedTemplate.id] ? (
                  <img src={thumbnails[selectedTemplate.id]} alt={selectedTemplate.name} className="w-full h-full object-contain p-3" />
                ) : (
                  <span className="text-[13px] text-white/50 font-sans">{selectedTemplate.format}</span>
                )}
              </div>

              {/* Metadata */}
              <div className="flex flex-col justify-start">
                <div className="text-base font-semibold text-text-primary font-sans mb-2">
                  {t(`templates.${selectedTemplate.id}`, selectedTemplate.name)}
                </div>
                <div className="text-sm text-text-secondary font-sans mb-3">
                  {t(`templates.cat${selectedTemplate.category.replace(/\s+/g, '')}`, selectedTemplate.category)}
                </div>
                <div className="inline-block bg-surface-raised border border-border rounded px-2 py-1 text-xs text-[#9ca3af] font-sans mb-2 w-fit">
                  {selectedTemplate.format}
                </div>
                <div className="text-sm text-text-secondary font-sans mb-1">
                  {t('dashboard.templatePages', { count: selectedTemplate.pageCount })}
                </div>

                <button
                  onClick={handleUseTemplate}
                  className="bg-accent text-text-primary w-full py-3 text-sm font-semibold rounded-lg border-none cursor-pointer mt-4 font-sans hover:bg-accent-hover transition-colors"
                >
                  {t('dashboard.useTemplate')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
