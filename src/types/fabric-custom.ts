import type { FabricObject } from 'fabric';

export type FabricObjectWithCustom = FabricObject & {
  id?: string;
  name?: string;
  customType?: string;
  locked?: boolean;
  _isDocBackground?: boolean;
  layerId?: string;
  imageId?: string;
  shapeKind?: string;
  fitMode?: string;
  swatchId?: string;
  presetId?: string;
};
