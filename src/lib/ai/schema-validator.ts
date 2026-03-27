const VALID_CUSTOM_TYPES = new Set(['text', 'image', 'shape', 'colorBlock']);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a Fabric.js canvas JSON object produced by AI.
 * Checks for required custom properties on every element.
 */
export function validateCanvasJSON(json: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof json !== 'object' || json === null) {
    return { valid: false, errors: ['Canvas JSON must be an object'] };
  }

  const canvas = json as Record<string, unknown>;

  if (!Array.isArray(canvas.objects)) {
    errors.push('Missing "objects" array');
    return { valid: false, errors };
  }

  const objects = canvas.objects as unknown[];

  if (objects.length === 0) {
    errors.push('objects array is empty — expected at least a background rect');
    return { valid: false, errors };
  }

  // Check first object has _isDocBackground
  const firstObj = objects[0] as Record<string, unknown>;
  if (!firstObj._isDocBackground) {
    errors.push('First object in objects array must have "_isDocBackground" property');
  }

  // Validate all objects after background
  for (let i = 1; i < objects.length; i++) {
    const obj = objects[i] as Record<string, unknown>;
    const prefix = `objects[${i}]`;

    // customType
    if (!obj.customType) {
      errors.push(`${prefix}: missing "customType"`);
    } else if (!VALID_CUSTOM_TYPES.has(obj.customType as string)) {
      errors.push(`${prefix}: "customType" must be one of: text, image, shape, colorBlock (got "${obj.customType}")`);
    }

    // id
    if (!obj.id || typeof obj.id !== 'string' || (obj.id as string).trim() === '') {
      errors.push(`${prefix}: "id" must be a non-empty string`);
    }

    // originX / originY (Fabric.js 7 requirement)
    if (obj.originX !== 'left') {
      errors.push(`${prefix}: "originX" must be "left" (got "${obj.originX}")`);
    }
    if (obj.originY !== 'top') {
      errors.push(`${prefix}: "originY" must be "top" (got "${obj.originY}")`);
    }

    // name
    if (!obj.name || typeof obj.name !== 'string' || (obj.name as string).trim() === '') {
      errors.push(`${prefix}: "name" must be a non-empty string`);
    }

    // locked
    if (typeof obj.locked !== 'boolean') {
      errors.push(`${prefix}: "locked" must be a boolean`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Repairs common issues in AI-generated canvas JSON.
 * Returns a corrected copy — does not mutate the original.
 */
export function repairCanvasJSON(json: unknown): Record<string, unknown> {
  // If not an object at all, wrap it
  if (!Array.isArray(json) && (typeof json !== 'object' || json === null)) {
    return { version: '6.0.0', objects: [] };
  }

  // If it's an array, the AI returned pages array — caller handles this case;
  // here we treat it as a single-canvas input
  let canvas: Record<string, unknown>;

  if (Array.isArray(json)) {
    // Should not normally reach here, but handle gracefully
    canvas = { version: '6.0.0', objects: json };
  } else {
    canvas = { ...(json as Record<string, unknown>) };
  }

  // Ensure version
  if (!canvas.version) {
    canvas.version = '6.0.0';
  }

  // Ensure objects array
  if (!Array.isArray(canvas.objects)) {
    canvas.objects = [];
  }

  const objects = (canvas.objects as unknown[]).map((raw, index) => {
    if (typeof raw !== 'object' || raw === null) return raw;

    const obj = { ...(raw as Record<string, unknown>) };

    // id
    if (!obj.id || typeof obj.id !== 'string' || (obj.id as string).trim() === '') {
      obj.id = crypto.randomUUID();
    }

    // originX / originY
    if (obj.originX !== 'left') obj.originX = 'left';
    if (obj.originY !== 'top') obj.originY = 'top';

    // name
    if (!obj.name || typeof obj.name !== 'string' || (obj.name as string).trim() === '') {
      const typeNameMap: Record<string, string> = {
        text: 'Text',
        image: 'Image Frame',
        shape: 'Rectangle',
        colorBlock: 'Color Block',
      };
      obj.name = typeNameMap[obj.customType as string] ?? `Element ${index + 1}`;
    }

    // locked
    if (typeof obj.locked !== 'boolean') {
      // Background stays locked, everything else unlocked
      obj.locked = Boolean(obj._isDocBackground);
    }

    // visible
    if (typeof obj.visible !== 'boolean') {
      obj.visible = true;
    }

    // image-specific props
    if (obj.customType === 'image') {
      if (!('imageId' in obj)) obj.imageId = null;
      if (!obj.fitMode) obj.fitMode = 'fill';
    }

    return obj;
  });

  canvas.objects = objects;
  return canvas;
}
