'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Type,
  Image,
  Square,
  RectangleHorizontal,
  Eye,
  EyeOff,
  Lock,
  Unlock,
} from 'lucide-react';
import { useCanvasLayers, type LayerItem } from '@/hooks/useCanvasLayers';
import { useCanvasStore } from '@/stores/canvasStore';

// ── LayerRow ─────────────────────────────────────────────────────────────────

interface LayerRowProps {
  layer: LayerItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

function TypeIcon({ type }: { type: LayerItem['type'] }) {
  const props = { size: 16, color: '#888888' };
  switch (type) {
    case 'text': return <Type {...props} />;
    case 'image': return <Image {...props} />;
    case 'colorBlock': return <RectangleHorizontal {...props} />;
    case 'shape':
    default: return <Square {...props} />;
  }
}

function LayerRow({
  layer,
  isSelected,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onRename,
}: LayerRowProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(layer.name);
  const [isHovered, setIsHovered] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: layer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function handleDoubleClick(e: React.MouseEvent) {
    e.stopPropagation();
    setRenameValue(layer.name);
    setIsRenaming(true);
  }

  function commitRename() {
    onRename(layer.id, renameValue);
    setIsRenaming(false);
  }

  function handleRenameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      commitRename();
    } else if (e.key === 'Escape') {
      setRenameValue(layer.name);
      setIsRenaming(false);
    }
  }

  const bgColor = isSelected
    ? '#1e1e1e'
    : isHovered
    ? 'rgba(30,30,30,0.6)'
    : 'transparent';

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        height: '32px',
        paddingLeft: '8px',
        paddingRight: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        background: bgColor,
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => !isRenaming && onSelect(layer.id)}
    >
      {/* Drag handle */}
      <span
        {...attributes}
        {...listeners}
        style={{
          display: 'flex',
          alignItems: 'center',
          color: '#555555',
          opacity: isHovered ? 1 : 0,
          cursor: 'grab',
          flexShrink: 0,
          width: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={16} />
      </span>

      {/* Type icon */}
      <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, width: '16px' }}>
        <TypeIcon type={layer.type} />
      </span>

      {/* Name text / rename input */}
      <span
        style={{
          flex: 1,
          overflow: 'hidden',
          minWidth: 0,
        }}
        onDoubleClick={handleDoubleClick}
      >
        {isRenaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleRenameKeyDown}
            placeholder="Layer name"
            onClick={(e) => e.stopPropagation()}
            style={{
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              color: '#f5f5f5',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid #6366f1',
              outline: 'none',
              width: '100%',
              padding: '0',
            }}
          />
        ) : (
          <span
            style={{
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              color: '#f5f5f5',
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {layer.name}
          </span>
        )}
      </span>

      {/* Eye icon */}
      <button
        aria-label={`Toggle visibility for ${layer.name}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility(layer.id);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px',
          height: '20px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#888888',
          flexShrink: 0,
          padding: 0,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = '#f5f5f5';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = '#888888';
        }}
      >
        {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>

      {/* Lock icon */}
      <button
        aria-label={`Toggle lock for ${layer.name}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleLock(layer.id);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px',
          height: '20px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#888888',
          flexShrink: 0,
          padding: 0,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = '#f5f5f5';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = '#888888';
        }}
      >
        {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
      </button>
    </div>
  );
}

// ── LayersPanel ───────────────────────────────────────────────────────────────

export function LayersPanel() {
  const { layers, moveLayer, toggleVisibility, toggleLock, renameLayer, selectLayer } =
    useCanvasLayers();
  const selectedObjectIds = useCanvasStore((s) => s.selectedObjectIds);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromIndex = layers.findIndex((l) => l.id === active.id);
    const toIndex = layers.findIndex((l) => l.id === over.id);
    if (fromIndex === -1 || toIndex === -1) return;

    moveLayer(fromIndex, toIndex);
  }

  if (layers.length === 0) {
    return (
      <div
        style={{
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <p
          style={{
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
            color: '#f5f5f5',
            margin: 0,
            fontWeight: 600,
          }}
        >
          No layers yet
        </p>
        <p
          style={{
            fontSize: '11px',
            fontFamily: 'Inter, sans-serif',
            color: '#888888',
            margin: 0,
          }}
        >
          Add elements to the canvas to see them here.
        </p>
      </div>
    );
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={layers.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div style={{ paddingTop: '4px', paddingBottom: '4px' }}>
          {layers.map((layer) => (
            <LayerRow
              key={layer.id}
              layer={layer}
              isSelected={selectedObjectIds.includes(layer.id)}
              onSelect={selectLayer}
              onToggleVisibility={toggleVisibility}
              onToggleLock={toggleLock}
              onRename={renameLayer}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
