export interface ShortcutDef {
  key: string;
  modifiers?: ('ctrl' | 'shift' | 'alt')[];
  label: string;
  description: string;
  section: 'Tools' | 'Canvas' | 'Edit' | 'File';
}

export const SHORTCUTS: ShortcutDef[] = [
  // Tools
  { key: 'v', label: 'V', description: 'Select tool', section: 'Tools' },
  { key: 't', label: 'T', description: 'Text tool', section: 'Tools' },
  { key: 'r', label: 'R', description: 'Rectangle tool', section: 'Tools' },
  { key: 'c', label: 'C', description: 'Circle tool', section: 'Tools' },
  { key: 'l', label: 'L', description: 'Line tool', section: 'Tools' },
  { key: 'i', label: 'I', description: 'Image tool', section: 'Tools' },
  { key: 'h', label: 'H', description: 'Pan tool', section: 'Tools' },
  // Canvas
  { key: '+', modifiers: ['ctrl'], label: 'Ctrl +', description: 'Zoom in', section: 'Canvas' },
  { key: '-', modifiers: ['ctrl'], label: 'Ctrl -', description: 'Zoom out', section: 'Canvas' },
  { key: '0', modifiers: ['ctrl'], label: 'Ctrl 0', description: 'Zoom to fit', section: 'Canvas' },
  { key: '1', modifiers: ['ctrl'], label: 'Ctrl 1', description: 'Zoom to 100%', section: 'Canvas' },
  // Edit
  { key: 'z', modifiers: ['ctrl'], label: 'Ctrl Z', description: 'Undo', section: 'Edit' },
  { key: 'z', modifiers: ['ctrl', 'shift'], label: 'Ctrl Shift Z', description: 'Redo', section: 'Edit' },
  { key: 'c', modifiers: ['ctrl'], label: 'Ctrl C', description: 'Copy', section: 'Edit' },
  { key: 'v', modifiers: ['ctrl'], label: 'Ctrl V', description: 'Paste', section: 'Edit' },
  { key: 'Delete', label: 'Delete', description: 'Delete selected', section: 'Edit' },
  { key: 'Backspace', label: 'Backspace', description: 'Delete selected', section: 'Edit' },
  { key: 'ArrowUp', label: 'Arrow Up', description: 'Nudge up 1px', section: 'Edit' },
  { key: 'ArrowDown', label: 'Arrow Down', description: 'Nudge down 1px', section: 'Edit' },
  { key: 'ArrowLeft', label: 'Arrow Left', description: 'Nudge left 1px', section: 'Edit' },
  { key: 'ArrowRight', label: 'Arrow Right', description: 'Nudge right 1px', section: 'Edit' },
  { key: 'ArrowUp', modifiers: ['shift'], label: 'Shift Up', description: 'Nudge up 10px', section: 'Edit' },
  { key: 'ArrowDown', modifiers: ['shift'], label: 'Shift Down', description: 'Nudge down 10px', section: 'Edit' },
  { key: 'ArrowLeft', modifiers: ['shift'], label: 'Shift Left', description: 'Nudge left 10px', section: 'Edit' },
  { key: 'ArrowRight', modifiers: ['shift'], label: 'Shift Right', description: 'Nudge right 10px', section: 'Edit' },
  { key: 'g', modifiers: ['ctrl'], label: 'Ctrl G', description: 'Group selected', section: 'Edit' },
  { key: 'g', modifiers: ['ctrl', 'shift'], label: 'Ctrl Shift G', description: 'Ungroup', section: 'Edit' },
  // File
  { key: 's', modifiers: ['ctrl'], label: 'Ctrl S', description: 'Save project', section: 'File' },
  { key: '?', label: '?', description: 'Show keyboard shortcuts', section: 'File' },
];
