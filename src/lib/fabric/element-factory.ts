import { Textbox, Rect, Ellipse, Line, Triangle } from 'fabric';
import type { ShapeKind } from '@/types/elements';

/**
 * Custom properties that must be included when serializing Fabric.js objects.
 * Pass this array to canvas.toDatalessJSON(CUSTOM_PROPS) or obj.toObject(CUSTOM_PROPS).
 */
export const CUSTOM_PROPS = [
  'customType',
  'imageId',
  'locked',
  'name',
  'id',
  'shapeKind',
  'fitMode',
  'swatchId',
  'presetId',
  '_isDocBackground',
  'layerId',
] as const;

interface BaseOpts {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Create a text frame (Fabric.js Textbox).
 * CRITICAL: originX/originY must be 'left'/'top' — Fabric.js 7 changed default to 'center'.
 */
export function createTextFrame(opts: BaseOpts) {
  const { left, top, width, height } = opts;

  // Scale font size to ~1/4 of drawn frame height for natural sizing
  const fontSize = Math.max(8, Math.min(120, Math.round(height / 4)));

  const textbox = new Textbox('', {
    left,
    top,
    width,
    originX: 'left',
    originY: 'top',
    fontSize,
    fontFamily: 'Inter',
    fill: '#333333',
  });

  Object.assign(textbox, {
    customType: 'text',
    name: 'Text',
    id: crypto.randomUUID(),
    locked: false,
    visible: true,
  });

  return textbox;
}

/**
 * Create an image frame placeholder (Fabric.js Rect with dashed border).
 * CRITICAL: originX/originY must be 'left'/'top'.
 */
export function createImageFrame(opts: BaseOpts) {
  const { left, top, width, height } = opts;

  const frame = new Rect({
    left,
    top,
    width,
    height,
    originX: 'left',
    originY: 'top',
    fill: '#1e1e1e',
    stroke: '#2a2a2a',
    strokeWidth: 1,
    strokeDashArray: [6, 4],
  });

  Object.assign(frame, {
    customType: 'image',
    name: 'Image Frame',
    id: crypto.randomUUID(),
    locked: false,
    visible: true,
    imageId: null,
    fitMode: 'fill',
  });

  return frame;
}

/**
 * Create a shape element: rect, circle (Ellipse), or line.
 * CRITICAL: originX/originY must be 'left'/'top'.
 */
export function createShape(kind: ShapeKind, opts: BaseOpts) {
  const { left, top, width, height } = opts;

  const kindCapitalized = kind.charAt(0).toUpperCase() + kind.slice(1);

  let obj: Record<string, unknown>;

  if (kind === 'triangle') {
    obj = new Triangle({
      left,
      top,
      width,
      height,
      originX: 'left',
      originY: 'top',
      fill: '#6366f1',
      stroke: 'transparent',
      strokeWidth: 0,
    });
  } else if (kind === 'rect') {
    obj = new Rect({
      left,
      top,
      width,
      height,
      originX: 'left',
      originY: 'top',
      fill: '#6366f1',
      stroke: 'transparent',
      strokeWidth: 0,
      rx: 0,
      ry: 0,
    });
  } else if (kind === 'circle') {
    obj = new Ellipse({
      left,
      top,
      width,
      height,
      originX: 'left',
      originY: 'top',
      rx: width / 2,
      ry: height / 2,
      fill: '#6366f1',
    });
  } else {
    // line
    obj = new Line([left, top, left + width, top + height], {
      stroke: '#6366f1',
      strokeWidth: 2,
      originX: 'left',
      originY: 'top',
      left,
      top,
    });
  }

  (obj as Record<string, unknown>).customType = 'shape';
  (obj as Record<string, unknown>).shapeKind = kind;
  (obj as Record<string, unknown>).name = kindCapitalized;
  (obj as Record<string, unknown>).id = crypto.randomUUID();
  (obj as Record<string, unknown>).locked = false;
  (obj as Record<string, unknown>).visible = true;

  return obj;
}

/**
 * Create a solid or gradient color block (Fabric.js Rect).
 * CRITICAL: originX/originY must be 'left'/'top'.
 */
export function createColorBlock(opts: BaseOpts & { fill?: string }) {
  const { left, top, width, height, fill = '#6366f1' } = opts;

  const block = new Rect({
    left,
    top,
    width,
    height,
    originX: 'left',
    originY: 'top',
    fill,
    stroke: 'transparent',
    strokeWidth: 0,
  });

  Object.assign(block, {
    customType: 'colorBlock',
    name: 'Color Block',
    id: crypto.randomUUID(),
    locked: false,
    visible: true,
  });

  return block;
}

/**
 * Unified factory — convenience wrapper for all element types.
 */
export function createElement(
  type: 'text' | 'image' | 'triangle' | 'rect' | 'circle' | 'line' | 'colorBlock',
  opts: BaseOpts & { fill?: string }
) {
  switch (type) {
    case 'text':
      return createTextFrame(opts);
    case 'image':
      return createImageFrame(opts);
    case 'triangle':
      return createShape('triangle', opts);
    case 'rect':
      return createShape('rect', opts);
    case 'circle':
      return createShape('circle', opts);
    case 'line':
      return createShape('line', opts);
    case 'colorBlock':
      return createColorBlock(opts);
  }
}
