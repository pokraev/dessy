'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  onNewLeaflet: () => void;
}

const TEMPLATE_PLACEHOLDERS = [
  { label: 'A4 Single', color: '#6366f1' },
  { label: 'Bifold', color: '#818cf8' },
  { label: 'Trifold', color: '#4f46e5' },
];

export function EmptyState({ onNewLeaflet }: Props) {
  const { t } = useTranslation();
  const [ctaHovered, setCtaHovered] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '64px 24px',
      }}
    >
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
      <h2
        style={{
          fontSize: '28px',
          fontWeight: 600,
          color: '#f5f5f5',
          marginTop: '24px',
          marginBottom: 0,
        }}
      >
        {t('dashboard.emptyHeading')}
      </h2>

      {/* Body */}
      <p
        style={{
          fontSize: '14px',
          fontWeight: 400,
          color: '#888',
          maxWidth: '320px',
          textAlign: 'center',
          lineHeight: 1.5,
          marginTop: '8px',
          marginBottom: 0,
        }}
      >
        {t('dashboard.emptyBody')}
      </p>

      {/* CTA button */}
      <button
        onClick={onNewLeaflet}
        onMouseEnter={() => setCtaHovered(true)}
        onMouseLeave={() => setCtaHovered(false)}
        style={{
          marginTop: '24px',
          background: ctaHovered ? '#818cf8' : '#6366f1',
          color: '#f5f5f5',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
      >
        {t('dashboard.emptyCtaLabel')}
      </button>

      {/* Template suggestion strip */}
      <div
        style={{
          marginTop: '32px',
          display: 'flex',
          flexDirection: 'row',
          gap: '12px',
        }}
      >
        {TEMPLATE_PLACEHOLDERS.map((tpl) => (
          <div
            key={tpl.label}
            style={{
              width: '140px',
              background: '#141414',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              overflow: 'hidden',
              cursor: 'pointer',
            }}
          >
            {/* Colored preview rectangle */}
            <div
              style={{
                height: '80px',
                background: tpl.color,
                opacity: 0.6,
              }}
            />
            {/* Label */}
            <div
              style={{
                padding: '8px 10px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#888',
              }}
            >
              {tpl.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
