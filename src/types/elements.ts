export type ElementType = 'text' | 'image' | 'shape' | 'colorBlock' | 'group';
export type ShapeKind = 'rect' | 'triangle' | 'circle' | 'line';
export type ImageFitMode = 'fill' | 'fit' | 'stretch';

export interface BaseElement {
  id: string;
  customType: ElementType;
  name: string;
  locked: boolean;
  visible: boolean;
}

export interface TextFrame extends BaseElement {
  customType: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;      // pt
  fontWeight: number;
  fill: string;          // hex
  textAlign: 'left' | 'center' | 'right' | 'justify';
}

export interface ImageFrame extends BaseElement {
  customType: 'image';
  imageId: string | null;  // UUID referencing IndexedDB
  fitMode: ImageFitMode;
}

export interface ShapeElement extends BaseElement {
  customType: 'shape';
  shapeKind: ShapeKind;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rx: number;  // corner radius
  ry: number;
}

export interface ColorBlock extends BaseElement {
  customType: 'colorBlock';
  fill: string;          // hex or gradient string
  gradientType?: 'linear' | 'radial';
  gradientStops?: Array<{ offset: number; color: string }>;
}

export interface GroupElement extends BaseElement {
  customType: 'group';
  childIds: string[];
}

export type DesignElement = TextFrame | ImageFrame | ShapeElement | ColorBlock | GroupElement;
