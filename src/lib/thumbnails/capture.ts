import type { Canvas } from 'fabric';
import type { LeafletFormatId } from '@/types/project';
import { renderPageToBlob } from '@/lib/export/raster-export';
import { getDocDimensions } from '@/lib/fabric/canvas-config';
import { FORMATS } from '@/constants/formats';
import { CUSTOM_PROPS } from '@/lib/fabric/element-factory';
import { saveThumbnail } from '@/lib/storage/thumbnailDb';

export async function captureThumbnail(
  canvas: Canvas,
  projectId: string,
  formatId: LeafletFormatId
): Promise<void> {
  const format = FORMATS[formatId] ?? FORMATS['A4'];
  const doc = getDocDimensions(format);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasJSON = canvas.toObject([...CUSTOM_PROPS]) as { objects?: any[]; [k: string]: unknown };

  // Strip image objects with blob/data URLs that can't be loaded by the temp canvas
  if (canvasJSON.objects) {
    canvasJSON.objects = canvasJSON.objects.filter((obj: { type?: string; src?: string }) => {
      if (obj.type?.toLowerCase() === 'image' && obj.src?.startsWith('blob:')) return false;
      return true;
    });
  }

  const pageData = { pageIndex: 0, canvasJSON, pageId: '', background: '#FFFFFF' };

  const blob = await renderPageToBlob(pageData, doc.width, doc.height, 'png', 1);
  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });

  await saveThumbnail(projectId, dataUrl);
}
