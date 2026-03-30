import type { TemplateEntry } from '@/lib/templates/templates-index';
import { FORMATS } from '@/constants/formats';
import { getDocDimensions } from '@/lib/fabric/canvas-config';
import { saveProject } from '@/lib/storage/projectStorage';
import type { ProjectMeta } from '@/types/project';

export const CATEGORY_COLORS: Record<string, string> = {
  Sale: '#ef4444',
  Event: '#8b5cf6',
  Restaurant: '#f59e0b',
  'Real Estate': '#3b82f6',
  Corporate: '#6b7280',
  Fitness: '#22c55e',
  Beauty: '#ec4899',
  Education: '#06b6d4',
};

export function createProjectFromTemplate(template: TemplateEntry): string {
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();
  const meta: ProjectMeta = {
    id: newId,
    name: template.name,
    format: template.format,
    createdAt: now,
    updatedAt: now,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasJSON = JSON.parse(JSON.stringify(template.canvasJSON)) as { objects?: any[] };

  // Fix for Fabric.js 7: default originX/originY changed to 'center'
  const format = FORMATS[template.format] ?? FORMATS['A4'];
  const doc = getDocDimensions(format);
  for (const obj of canvasJSON.objects ?? []) {
    if (!obj.originX) obj.originX = 'left';
    if (!obj.originY) obj.originY = 'top';
    if (obj._isDocBackground) {
      obj.left = -doc.bleedPx;
      obj.top = -doc.bleedPx;
      obj.width = doc.width;
      obj.height = doc.height;
    }
  }

  const pages = Array.from({ length: template.pageCount }, () => ({
    id: crypto.randomUUID(),
    elements: [],
    background: '#FFFFFF',
  }));

  saveProject(newId, { meta, canvasJSON, pageData: { pages, currentPageIndex: 0 } });

  // Store additional page canvasJSONs in sessionStorage for page switching
  if (template.allPagesJSON && template.allPagesJSON.length > 1) {
    for (let i = 1; i < template.allPagesJSON.length; i++) {
      const pageJSON = JSON.parse(JSON.stringify(template.allPagesJSON[i]));
      // Apply same origin/bleed fixes as first page
      for (const obj of (pageJSON.objects ?? [])) {
        if (!obj.originX) obj.originX = 'left';
        if (!obj.originY) obj.originY = 'top';
        if (obj._isDocBackground) {
          obj.left = -doc.bleedPx;
          obj.top = -doc.bleedPx;
          obj.width = doc.width;
          obj.height = doc.height;
        }
      }
      sessionStorage.setItem(
        `dessy-generated-page-${newId}-${i}`,
        JSON.stringify(pageJSON)
      );
    }
  }

  return newId;
}
