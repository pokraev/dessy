import type { Canvas } from 'fabric';
import type { ProjectMeta } from '@/types/project';
import { CUSTOM_PROPS } from './element-factory';
import { loadCanvasJSON } from './load-canvas-json';

const FILE_VERSION = '1.0';

export function exportProjectJSON(canvas: Canvas, meta: ProjectMeta): void {
  const data = {
    version: FILE_VERSION,
    exportedAt: new Date().toISOString(),
    meta,
    canvas: canvas.toObject([...CUSTOM_PROPS]),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${meta.name.replace(/\s+/g, '-').toLowerCase()}.dessy.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importProjectJSON(
  canvas: Canvas,
  file: File
): Promise<ProjectMeta> {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data.version || !data.canvas || !data.meta) {
    throw new Error('Invalid Dessy project file');
  }
  await loadCanvasJSON(canvas, data.canvas);
  canvas.renderAll();
  return data.meta;
}
