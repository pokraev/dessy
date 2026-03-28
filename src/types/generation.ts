export type GenerationMode = 'prompt' | 'photo' | 'sketch';
export type FoldType = 'single' | 'bifold' | 'tripanel' | 'trifold' | 'zfold';

export interface GenerationRequest {
  mode: GenerationMode;
  foldType: FoldType;
  prompt?: string;           // for mode='prompt'
  imageBase64?: string;      // for mode='photo' or 'sketch' — base64 data URL
  brandColors?: string[];    // hex values from brandStore
  typographyPresets?: Array<{
    name: string;
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    color: string;
  }>;
  style?: string;            // 'minimal' | 'bold' | 'corporate' | 'playful' | 'elegant'
  logoBase64?: string;       // optional logo upload
}

export interface GeneratedPage {
  canvasJSON: Record<string, unknown>;  // Fabric.js toDatalessJSON output for one page
  pageLabel: string;                     // e.g. 'Front', 'Back', 'Inside Left'
}

export interface GenerationResponse {
  pages: GeneratedPage[];
  formatId: string;          // 'A4' | 'bifold' | 'trifold' etc.
  suggestedName: string;     // AI-suggested project name
}
