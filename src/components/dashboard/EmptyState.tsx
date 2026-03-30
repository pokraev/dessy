'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getTemplates } from '@/lib/templates/templates-index';
import type { TemplateEntry } from '@/lib/templates/templates-index';
import { useAppStore } from '@/stores/appStore';
import { CATEGORY_COLORS, createProjectFromTemplate } from '@/lib/templates/template-utils';
import { useTemplateThumbnails } from '@/hooks/useTemplateThumbnails';

interface Props {
  onNewLeaflet: () => void;
}

export function EmptyState({ onNewLeaflet }: Props) {
  const { t, i18n } = useTranslation();

  const templates = useMemo(() => getTemplates(i18n.language), [i18n.language]);
  const suggestedTemplates = useMemo(() => templates.slice(0, 3), [templates]);
  const thumbnails = useTemplateThumbnails(suggestedTemplates, i18n.language);

  function handleTemplateClick(template: TemplateEntry) {
    const newId = createProjectFromTemplate(template);
    useAppStore.getState().openProject(newId);
  }

  return (
    <div className="flex flex-col items-center px-6 py-16">
      {/* SVG Illustration — stacked rectangles suggesting leaflet pages */}
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Back page */}
        <rect x="30" y="40" width="64" height="60" rx="6" fill="#2a2a2a" />
        {/* Middle page */}
        <rect x="22" y="32" width="64" height="60" rx="6" fill="#6366f1" opacity="0.4" />
        {/* Front page */}
        <rect x="14" y="24" width="64" height="60" rx="6" fill="#6366f1" />
        {/* Front page content lines */}
        <rect x="24" y="36" width="30" height="4" rx="2" fill="white" opacity="0.6" />
        <rect x="24" y="46" width="44" height="3" rx="1.5" fill="white" opacity="0.3" />
        <rect x="24" y="54" width="38" height="3" rx="1.5" fill="white" opacity="0.3" />
        <rect x="24" y="62" width="42" height="3" rx="1.5" fill="white" opacity="0.3" />
      </svg>

      {/* Heading */}
      <h2 className="text-[28px] font-semibold text-text-primary mt-6 mb-0">
        {t('dashboard.emptyHeading')}
      </h2>

      {/* Body */}
      <p className="text-sm font-normal text-text-secondary max-w-[320px] text-center leading-[1.5] mt-2 mb-0">
        {t('dashboard.emptyBody')}
      </p>

      {/* CTA button */}
      <button
        onClick={onNewLeaflet}
        className="mt-6 bg-accent hover:bg-accent-hover text-text-primary border-none rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer transition-colors duration-150"
      >
        {t('dashboard.emptyCtaLabel')}
      </button>

      {/* Template suggestion strip — first 3 real templates */}
      <div className="mt-8 flex flex-row gap-3">
        {suggestedTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleTemplateClick(template)}
            className="w-[140px] bg-surface border border-border rounded-lg overflow-hidden cursor-pointer transition-colors duration-150 hover:border-accent"
          >
            {/* Template preview */}
            <div
              className="h-20 flex items-center justify-center overflow-hidden"
              style={{ background: CATEGORY_COLORS[template.category] ?? '#4b5563' }}
            >
              {thumbnails[template.id] ? (
                <img src={thumbnails[template.id]} alt={template.name} className="w-full h-full object-contain p-1.5" />
              ) : (
                <span className="text-[10px] text-white/50">{template.format}</span>
              )}
            </div>
            {/* Template name */}
            <div className="text-xs font-semibold text-text-primary px-2 pt-2 pb-1">
              {t(`templates.${template.id}`, template.name)}
            </div>
            {/* Category label */}
            <div className="text-xs font-normal text-text-secondary px-2 pb-2">
              {t(`templates.cat${template.category.replace(/\s+/g, '')}`, template.category)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
