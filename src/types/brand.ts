export interface ColorSwatch {
  id: string;
  hex: string;
  name?: string;
}

export interface TypographyPreset {
  id: string;
  name: string;         // 'Headline' | 'Subhead' | 'Body' | 'Caption' | 'CTA'
  fontFamily: string;
  fontSize: number;     // pt
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  color: string;        // hex
}
