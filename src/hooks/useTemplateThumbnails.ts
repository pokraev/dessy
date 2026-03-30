import { useEffect, useState } from 'react';
import type { TemplateEntry } from '@/lib/templates/templates-index';
import { renderPageToBlob } from '@/lib/export/raster-export';
import { getDocDimensions } from '@/lib/fabric/canvas-config';
import { FORMATS } from '@/constants/formats';

// Cache thumbnails across component mounts so they're only generated once
const thumbnailCache: Record<string, string> = {};

export function useTemplateThumbnails(templates: TemplateEntry[]) {
  const [thumbnails, setThumbnails] = useState<Record<string, string>>(thumbnailCache);

  useEffect(() => {
    if (templates.length === 0) return;
    let cancelled = false;

    async function generate() {
      for (const tmpl of templates) {
        if (cancelled) break;
        if (thumbnailCache[tmpl.id]) continue; // already cached
        try {
          const format = FORMATS[tmpl.format] ?? FORMATS['A4'];
          const doc = getDocDimensions(format);
          const pageData = { pageIndex: 0, canvasJSON: tmpl.canvasJSON as Record<string, unknown>, pageId: '', background: '#FFFFFF' };
          const blob = await renderPageToBlob(pageData, doc.width, doc.height, 'png', 0.3);
          const url = URL.createObjectURL(blob);
          thumbnailCache[tmpl.id] = url;
          if (!cancelled) setThumbnails((prev) => ({ ...prev, [tmpl.id]: url }));
        } catch {
          // Skip failed template thumbnails
        }
      }
    }

    generate();
    return () => { cancelled = true; };
  }, [templates]);

  return thumbnails;
}
