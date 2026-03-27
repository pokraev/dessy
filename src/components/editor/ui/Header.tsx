'use client';

import { useState, useRef } from 'react';
import { Undo2, Redo2, Download, Upload, Save, Sparkles } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { useEditorStore } from '@/stores/editorStore';
import { GenerateLeafletModal } from '@/components/editor/modals/GenerateLeafletModal';

export function Header() {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const generateModalOpen = useEditorStore((s) => s.generateModalOpen);

  const canUndo = useCanvasStore((s) => s.canUndo);
  const canRedo = useCanvasStore((s) => s.canRedo);
  const triggerUndo = useCanvasStore((s) => s.triggerUndo);
  const triggerRedo = useCanvasStore((s) => s.triggerRedo);
  const triggerSave = useCanvasStore((s) => s.triggerSave);
  const triggerExport = useCanvasStore((s) => s.triggerExport);
  const triggerImport = useCanvasStore((s) => s.triggerImport);
  const currentProject = useProjectStore((s) => s.currentProject);
  const updateProjectName = useProjectStore((s) => s.updateProjectName);

  const projectName = currentProject?.meta.name ?? 'Untitled Leaflet';

  function handleNameClick() {
    setNameInput(projectName);
    setIsEditingName(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleNameSave() {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== projectName) {
      updateProjectName(trimmed);
    }
    setIsEditingName(false);
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
    }
  }

  return (
    <header
      className="flex items-center justify-between px-4 bg-surface border-b border-border"
      style={{ height: '48px', minHeight: '48px' }}
    >
      {/* Left: Project name + AI Generate */}
      <div className="flex items-center gap-3 min-w-0">
        {isEditingName ? (
          <input
            ref={inputRef}
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={handleNameKeyDown}
            className="bg-surface-raised text-text-primary border border-border rounded-lg px-2 py-1 outline-none focus:border-accent"
            style={{ fontSize: '13px', fontWeight: 500, height: '32px', minWidth: '200px' }}
          />
        ) : (
          <span
            className="text-text-primary cursor-pointer hover:bg-surface-raised rounded px-2 py-1 transition-colors truncate"
            style={{ fontSize: '13px', fontWeight: 500, height: '32px', lineHeight: '32px' }}
            onClick={handleNameClick}
            title="Click to rename"
          >
            {projectName}
          </span>
        )}

        {/* AI Generate button */}
        <button
          aria-label="Open AI leaflet generator"
          className="flex items-center gap-1.5 text-white font-medium"
          style={{
            height: '32px',
            paddingLeft: '12px',
            paddingRight: '12px',
            borderRadius: '8px',
            fontSize: '13px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)'; }}
          onClick={() => { useEditorStore.getState().setGenerateModalOpen(true); }}
        >
          <Sparkles size={14} />
          AI Generate
        </button>
      </div>

      {/* Center: Undo/Redo */}
      <div className="flex items-center gap-1">
        <button
          aria-label="Undo"
          disabled={!canUndo}
          className="flex items-center justify-center rounded-lg transition-colors"
          style={{
            height: '32px',
            paddingLeft: '8px',
            paddingRight: '8px',
            borderRadius: '8px',
            background: 'transparent',
            cursor: canUndo ? 'pointer' : 'default',
          }}
          onClick={() => {
            triggerUndo?.();
          }}
        >
          <Undo2
            size={16}
            className={canUndo ? 'text-text-primary hover:text-text-primary' : ''}
            style={{ color: canUndo ? undefined : '#2a2a2a' }}
          />
        </button>
        <button
          aria-label="Redo"
          disabled={!canRedo}
          className="flex items-center justify-center rounded-lg transition-colors"
          style={{
            height: '32px',
            paddingLeft: '8px',
            paddingRight: '8px',
            borderRadius: '8px',
            background: 'transparent',
            cursor: canRedo ? 'pointer' : 'default',
          }}
          onClick={() => {
            triggerRedo?.();
          }}
        >
          <Redo2
            size={16}
            className={canRedo ? 'text-text-primary' : ''}
            style={{ color: canRedo ? undefined : '#2a2a2a' }}
          />
        </button>
      </div>

      {/* Right: Save Project + Export/Import JSON */}
      <div className="flex items-center gap-2">
        <button
          aria-label="Save project"
          className="flex items-center gap-1.5 justify-center text-text-primary font-medium transition-colors"
          style={{
            height: '32px',
            paddingLeft: '12px',
            paddingRight: '12px',
            borderRadius: '8px',
            fontSize: '13px',
            background: '#6366f1',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#818cf8'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#6366f1'; }}
          onClick={() => {
            triggerSave?.();
          }}
        >
          <Save size={14} />
          Save Project
        </button>
        <button
          aria-label="Export project as JSON"
          className="flex items-center gap-1.5 justify-center text-text-primary transition-colors hover:bg-surface-raised"
          style={{
            height: '32px',
            paddingLeft: '12px',
            paddingRight: '12px',
            borderRadius: '8px',
            fontSize: '13px',
            background: 'transparent',
            border: '1px solid #2a2a2a',
            cursor: 'pointer',
          }}
          onClick={() => {
            triggerExport?.();
          }}
        >
          <Download size={14} />
          Export JSON
        </button>
        <button
          aria-label="Import project from JSON"
          className="flex items-center gap-1.5 justify-center text-text-primary transition-colors hover:bg-surface-raised"
          style={{
            height: '32px',
            paddingLeft: '12px',
            paddingRight: '12px',
            borderRadius: '8px',
            fontSize: '13px',
            background: 'transparent',
            border: '1px solid #2a2a2a',
            cursor: 'pointer',
          }}
          onClick={() => {
            triggerImport?.();
          }}
        >
          <Upload size={14} />
          Import JSON
        </button>
      </div>
      <GenerateLeafletModal
        open={generateModalOpen}
        onClose={() => useEditorStore.getState().setGenerateModalOpen(false)}
        onLoadPages={() => {
          useEditorStore.getState().setGenerateModalOpen(false);
          // Loading into canvas happens in Plan 03
        }}
      />
    </header>
  );
}
