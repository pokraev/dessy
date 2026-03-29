export type PromptStep = 'idle' | 'enriching' | 'customizing' | 'generating' | 'result';

export interface PromptVariations {
  editorial: string;
  lifestyle: string;
  bold: string;
}

export interface PromptCustomization {
  mood: string;        // e.g. 'warm', 'cool', 'dramatic', 'neutral'
  lighting: string;    // e.g. 'natural daylight', 'studio', 'golden hour'
  composition: string; // e.g. 'close-up', 'wide shot', 'overhead'
  style: string;       // e.g. 'photorealistic', 'editorial', 'product'
  background: string;  // e.g. 'white', 'bokeh', 'solid color'
}

export interface FrameContext {
  frameId: string;
  widthPx: number;
  heightPx: number;
  left: number;
  top: number;
  scaleX: number;
  scaleY: number;
  aspectRatio: string;
  positionHint: string;
  brandColors: string[];
  frameName: string;
}

export interface ImageHistoryEntry {
  id: string;
  imageId: string;           // IndexedDB key
  thumbnailDataUrl: string;  // Small JPEG data URL for grid display
  prompt: string;
  generatedAt: string;       // ISO timestamp
}
