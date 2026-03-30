'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TEMPLATES, TEMPLATE_CATEGORIES } from '@/lib/templates/templates-index';
import type { TemplateEntry, TemplateCategory } from '@/lib/templates/templates-index';
import { useAppStore } from '@/stores/appStore';
import { CATEGORY_COLORS, createProjectFromTemplate } from '@/lib/templates/template-utils';

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

  function handleUseTemplate() {
    if (!selectedTemplate) return;
    const newId = createProjectFromTemplate(selectedTemplate);
    useAppStore.getState().openProject(newId);
    onClose();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Category tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '16px 24px 0' }}>
        {(['All', ...TEMPLATE_CATEGORIES] as Array<'All' | TemplateCategory>).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              background: activeCategory === cat ? '#6366f1' : '#1e1e1e',
              color: activeCategory === cat ? '#f5f5f5' : '#888',
              border: activeCategory === cat ? 'none' : '1px solid #2a2a2a',
              borderRadius: '20px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 400,
              cursor: 'pointer',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template card grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '12px',
          padding: '16px 24px',
        }}
      >
        {filtered.map((tmpl) => (
          <button
            key={tmpl.id}
            onClick={() => setSelectedTemplate(tmpl)}
            style={{
              background: '#1e1e1e',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              overflow: 'hidden',
              cursor: 'pointer',
              textAlign: 'left',
              padding: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#6366f1';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2a2a';
            }}
          >
            {/* Thumbnail */}
            <div
              style={{
                height: '120px',
                background: CATEGORY_COLORS[tmpl.category] ?? '#4b5563',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontFamily: 'Arial' }}>
                {tmpl.format}
              </span>
            </div>
            <div style={{ padding: '8px 8px 4px', fontSize: '12px', fontWeight: 600, color: '#f5f5f5', fontFamily: 'Arial' }}>
              {tmpl.name}
            </div>
            <div style={{ padding: '0 8px 8px', fontSize: '12px', fontWeight: 400, color: '#888', fontFamily: 'Arial' }}>
              {tmpl.category}
            </div>
          </button>
        ))}
      </div>

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setSelectedTemplate(null)}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              background: '#141414',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
              width: '640px',
              padding: '24px',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setSelectedTemplate(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#888',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Close preview"
            >
              <X size={16} />
            </button>

            {/* Two-column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Preview area */}
              <div
                style={{
                  height: '300px',
                  background: CATEGORY_COLORS[selectedTemplate.category] ?? '#4b5563',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontFamily: 'Arial' }}>
                  {selectedTemplate.format}
                </span>
              </div>

              {/* Metadata */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#f5f5f5', fontFamily: 'Arial', marginBottom: '8px' }}>
                  {selectedTemplate.name}
                </div>
                <div style={{ fontSize: '14px', color: '#888', fontFamily: 'Arial', marginBottom: '12px' }}>
                  {selectedTemplate.category}
                </div>
                <div
                  style={{
                    display: 'inline-block',
                    background: '#1e1e1e',
                    border: '1px solid #2a2a2a',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    color: '#9ca3af',
                    fontFamily: 'Arial',
                    marginBottom: '8px',
                    width: 'fit-content',
                  }}
                >
                  {selectedTemplate.format}
                </div>
                <div style={{ fontSize: '14px', color: '#888', fontFamily: 'Arial', marginBottom: '4px' }}>
                  {t('dashboard.templatePages', { count: selectedTemplate.pageCount })}
                </div>

                <button
                  onClick={handleUseTemplate}
                  style={{
                    background: '#6366f1',
                    color: '#f5f5f5',
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    marginTop: '16px',
                    fontFamily: 'Arial',
                  }}
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
