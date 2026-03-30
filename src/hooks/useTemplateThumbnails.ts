import { useEffect, useMemo, useState } from 'react';
import type { TemplateEntry } from '@/lib/templates/templates-index';
import { renderPageToBlob } from '@/lib/export/raster-export';
import { getDocDimensions } from '@/lib/fabric/canvas-config';
import { FORMATS } from '@/constants/formats';

// Cache thumbnails across component mounts — keyed by "lang:templateId"
const thumbnailCache: Record<string, string> = {};

/**
 * Fix template canvas JSON for rendering — same fixes as createProjectFromTemplate:
 * - Set originX/originY to 'left'/'top' (Fabric 7 defaults to center)
 * - Fix _isDocBackground position with bleed offset
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fixTemplateJSON(canvasJSON: Record<string, unknown>, formatId: string): { objects?: any[] } {
  const fixed = JSON.parse(JSON.stringify(canvasJSON));
  const format = FORMATS[formatId] ?? FORMATS['A4'];
  const doc = getDocDimensions(format);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const obj of (fixed.objects ?? []) as any[]) {
    if (!obj.originX) obj.originX = 'left';
    if (!obj.originY) obj.originY = 'top';
    if (obj._isDocBackground) {
      obj.left = -doc.bleedPx;
      obj.top = -doc.bleedPx;
      obj.width = doc.width;
      obj.height = doc.height;
    }
  }
  return fixed;
}

export function useTemplateThumbnails(templates: TemplateEntry[], lang = 'en') {
  // Stable identity: only rebuild when template IDs or lang actually change
  const templateIds = useMemo(() => templates.map((t) => t.id).join(','), [templates]);

  const [thumbnails, setThumbnails] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const tmpl of templates) {
      const key = `${lang}:${tmpl.id}`;
      if (thumbnailCache[key]) initial[tmpl.id] = thumbnailCache[key];
    }
    return initial;
  });

  useEffect(() => {
    if (templates.length === 0) return;
    let cancelled = false;

    // Reset thumbnails for new language, pulling from cache
    const cached: Record<string, string> = {};
    for (const tmpl of templates) {
      const key = `${lang}:${tmpl.id}`;
      if (thumbnailCache[key]) cached[tmpl.id] = thumbnailCache[key];
    }
    setThumbnails(cached);

    async function generate() {
      for (const tmpl of templates) {
        if (cancelled) break;
        const cacheKey = `${lang}:${tmpl.id}`;
        if (thumbnailCache[cacheKey]) continue;
        try {
          const format = FORMATS[tmpl.format] ?? FORMATS['A4'];
          const doc = getDocDimensions(format);
          const fixedJSON = fixTemplateJSON(tmpl.canvasJSON as Record<string, unknown>, tmpl.format);
          const pageData = { pageIndex: 0, canvasJSON: fixedJSON, pageId: '', background: '#FFFFFF' };
          const blob = await renderPageToBlob(pageData, doc.width, doc.height, 'png', 1);
          const url = URL.createObjectURL(blob);
          thumbnailCache[cacheKey] = url;
          if (!cancelled) setThumbnails((prev) => ({ ...prev, [tmpl.id]: url }));
        } catch (err) {
          console.warn(`[useTemplateThumbnails] Failed for ${tmpl.id}:`, err);
        }
      }
    }

    generate();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateIds, lang]);

  return thumbnails;
}
