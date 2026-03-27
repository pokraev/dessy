export type LeafletFormatId = 'A4' | 'A5' | 'DL' | 'bifold' | 'trifold' | 'custom';

export interface ProjectMeta {
  id: string;
  name: string;
  format: LeafletFormatId;
  createdAt: string;  // ISO 8601
  updatedAt: string;
}

export interface Page {
  id: string;
  elements: string[];  // element IDs, order = z-order
  background: string;  // hex color, default '#FFFFFF'
}

export interface Project {
  meta: ProjectMeta;
  pages: Page[];
  currentPageIndex: number;
  brandColors: string[];  // hex values
}
