import type { Canvas } from 'fabric';
import { CUSTOM_PROPS } from './element-factory';

/**
 * Wrapper around canvas.loadFromJSON that re-applies custom properties
 * which Fabric.js drops during deserialization.
 */
export async function loadCanvasJSON(
  canvas: Canvas,
  json: { objects?: Record<string, unknown>[]; [k: string]: unknown }
): Promise<void> {
  const rawObjects = (json.objects ?? []) as Record<string, unknown>[];
  await canvas.loadFromJSON(json);
  // Re-apply custom properties that loadFromJSON drops
  const loaded = canvas.getObjects();
  for (let i = 0; i < loaded.length && i < rawObjects.length; i++) {
    const raw = rawObjects[i];
    const obj = loaded[i] as Record<string, unknown>;
    for (const key of CUSTOM_PROPS) {
      if (key in raw) obj[key] = raw[key];
    }
  }
}
