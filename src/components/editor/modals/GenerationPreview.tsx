
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { GeneratedPage } from '@/types/generation';
import { renderPageToBlob } from '@/lib/export/raster-export';
import { getDocDimensions } from '@/lib/fabric/canvas-config';
import { FORMATS } from '@/constants/formats';

function usePageThumbnails(pages: GeneratedPage[], formatId?: string) {
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});

  useEffect(() => {
    if (pages.length === 0) return;
    let cancelled = false;
    const urls: string[] = [];

    async function generate() {
      const format = FORMATS[formatId ?? 'A4'] ?? FORMATS['A4'];
      const doc = getDocDimensions(format);
      for (let i = 0; i < pages.length; i++) {
        if (cancelled) break;
        try {
          const pageData = { pageIndex: i, canvasJSON: pages[i].canvasJSON, pageId: '', background: '#FFFFFF' };
          const blob = await renderPageToBlob(pageData, doc.width, doc.height, 'png', 0.3);
          const url = URL.createObjectURL(blob);
          urls.push(url);
          if (!cancelled) setThumbnails((prev) => ({ ...prev, [i]: url }));
        } catch {
          // Skip failed thumbnails
        }
      }
    }

    generate();
    return () => {
      cancelled = true;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [pages, formatId]);

  return thumbnails;
}

interface GenerationPreviewProps {
  pages: GeneratedPage[];
  isLoading: boolean;
  error: string | null;
  formatId?: string;
  onRegenerate: () => void;
  onLoadIntoEditor: () => void;
}

export function GenerationPreview({
  pages,
  isLoading,
  error,
  formatId,
  onRegenerate,
  onLoadIntoEditor,
}: GenerationPreviewProps) {
  const { t } = useTranslation();
  const thumbnails = usePageThumbnails(pages, formatId);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid #6366f1',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: '13px', color: '#888888' }}>{t('generate.generating')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          padding: '24px 16px',
        }}
      >
        <span style={{ fontSize: '13px', color: '#ef4444' }}>{error}</span>
        <button
          type="button"
          onClick={onRegenerate}
          style={{
            height: '36px',
            paddingLeft: '16px',
            paddingRight: '16px',
            borderRadius: '8px',
            border: '1px solid #2a2a2a',
            background: 'transparent',
            color: '#f5f5f5',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          {t('generate.tryAgain')}
        </button>
      </div>
    );
  }

  if (pages.length === 0) {
    return null;
  }

  return (
    <div style={{ padding: '16px 0 0 0' }}>
      {/* Page preview cards */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '16px',
        }}
      >
        {pages.map((page, idx) => (
          <div
            key={idx}
            style={{
              flexShrink: 0,
              width: '120px',
              borderRadius: '8px',
              border: '1px solid #2a2a2a',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '90px',
                background: '#2a2a2a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {thumbnails[idx] ? (
                <img src={thumbnails[idx]} alt={page.pageLabel} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: '11px', color: '#888888' }}>Page {idx + 1}</span>
              )}
            </div>
            <div
              style={{
                padding: '6px 8px',
                fontSize: '11px',
                color: '#f5f5f5',
                textAlign: 'center',
                background: '#1e1e1e',
                borderTop: '1px solid #2a2a2a',
              }}
            >
              {page.pageLabel}
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={onLoadIntoEditor}
          style={{
            height: '36px',
            paddingLeft: '16px',
            paddingRight: '16px',
            borderRadius: '8px',
            background: '#6366f1',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {t('generate.loadIntoEditor')}
        </button>
        <button
          type="button"
          onClick={onRegenerate}
          style={{
            height: '36px',
            paddingLeft: '16px',
            paddingRight: '16px',
            borderRadius: '8px',
            border: '1px solid #2a2a2a',
            background: 'transparent',
            color: '#f5f5f5',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          {t('generate.regenerate')}
        </button>
      </div>
    </div>
  );
}
