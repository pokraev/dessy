
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  ChevronRight,
} from 'lucide-react';
import { useCanvasLayers, type LayerItem, type GroupTreeNode } from '@/hooks/useCanvasLayers';
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
  const { t } = useTranslation();
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
            placeholder={t('layers.layerName')}
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
  const { t } = useTranslation();
  const { layers, groupTree, moveLayer, toggleVisibility, toggleLock, renameLayer, selectLayer } =
    useCanvasLayers();
  const selectedObjectIds = useCanvasStore((s) => s.selectedObjectIds);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [treeCollapsed, setTreeCollapsed] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'type' | 'grouping'>('type');

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
          {t('layers.noLayers')}
        </p>
        <p
          style={{
            fontSize: '11px',
            fontFamily: 'Inter, sans-serif',
            color: '#888888',
            margin: 0,
          }}
        >
          {t('layers.noLayersHint')}
        </p>
      </div>
    );
  }

  // Group layers by type
  type GroupKey = 'backgrounds' | 'text' | 'images' | 'lines';
  const groupLabels: Record<GroupKey, string> = {
    backgrounds: t('layerGroups.backgrounds'),
    text: t('layerGroups.text'),
    images: t('layerGroups.images'),
    lines: t('layerGroups.lines'),
  };

  function getGroup(layer: LayerItem): GroupKey {
    if (layer.type === 'text') return 'text';
    if (layer.type === 'image') return 'images';
    // shapes, colorBlocks, rects, triangles, circles = backgrounds
    return 'backgrounds';
  }

  const groupOrder: GroupKey[] = ['text', 'images', 'backgrounds', 'lines'];
  const grouped = new Map<GroupKey, LayerItem[]>();
  for (const g of groupOrder) grouped.set(g, []);
  for (const layer of layers) {
    const g = getGroup(layer);
    grouped.get(g)!.push(layer);
  }
  // Sort within each group by position: top first, then left
  for (const items of grouped.values()) {
    items.sort((a, b) => a.top - b.top || a.left - b.left);
  }

  const hasGroups = groupTree.some((n) => n.type === 'group');

  function TreeNode({ node, depth = 0 }: { node: GroupTreeNode; depth?: number }) {
    const isOpen = treeCollapsed[node.id] !== true;
    const isGroup = node.type === 'group';
    const isSelected = selectedObjectIds.includes(node.id);
    const layer = layers.find((l) => l.id === node.id);

    return (
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            paddingLeft: `${8 + depth * 16}px`,
            paddingRight: '8px',
            height: '32px',
            cursor: 'pointer',
            background: isSelected ? '#1e1e1e' : 'transparent',
            fontSize: '13px',
            color: '#f5f5f5',
            fontFamily: 'Inter, sans-serif',
            userSelect: 'none',
          }}
          onClick={() => {
            if (isGroup) {
              setTreeCollapsed((c) => ({ ...c, [node.id]: !c[node.id] }));
            } else {
              selectLayer(node.id);
            }
          }}
          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(30,30,30,0.6)'; }}
          onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
        >
          {isGroup ? (
            <ChevronRight
              size={12}
              style={{
                transform: isOpen ? 'rotate(90deg)' : 'rotate(0)',
                transition: 'transform 0.15s',
                flexShrink: 0,
                color: '#666',
                width: '16px',
              }}
            />
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, width: '16px' }}>
              <TypeIcon type={node.type as LayerItem['type']} />
            </span>
          )}
          <span style={{
            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontWeight: isGroup ? 600 : 400,
            color: isGroup ? '#aaa' : '#f5f5f5',
          }}>
            {node.name}
          </span>
          {isGroup && (
            <span style={{ fontSize: '10px', color: '#555', flexShrink: 0 }}>
              {node.childCount}
            </span>
          )}
          {!isGroup && layer && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); toggleVisibility(node.id); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '20px', height: '20px', background: 'transparent',
                  border: 'none', cursor: 'pointer', color: '#888', flexShrink: 0, padding: 0,
                }}
              >
                {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); toggleLock(node.id); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '20px', height: '20px', background: 'transparent',
                  border: 'none', cursor: 'pointer', color: '#888', flexShrink: 0, padding: 0,
                }}
              >
                {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
              </button>
            </>
          )}
        </div>
        {isGroup && isOpen && node.children.map((child) => (
          <TreeNode key={child.id} node={child} depth={depth + 1} />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* View toggle */}
      <div style={{ display: 'flex', borderBottom: '1px solid #2a2a2a' }}>
          {(['type', 'grouping'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                flex: 1, padding: '5px', fontSize: '10px', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: viewMode === mode ? '#f5f5f5' : '#555',
                borderBottom: viewMode === mode ? '2px solid #6366f1' : '2px solid transparent',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {t(mode === 'type' ? 'layerGroups.byType' : 'layerGroups.byGrouping')}
            </button>
          ))}
        </div>

      {viewMode === 'type' ? (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={layers.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <div style={{ paddingTop: '4px', paddingBottom: '4px' }}>
              {groupOrder.map((groupKey) => {
                const items = grouped.get(groupKey)!;
                if (items.length === 0) return null;
                const isCollapsed = collapsed[groupKey] === true;
                return (
                  <div key={groupKey}>
                    <button
                      onClick={() => setCollapsed((c) => ({ ...c, [groupKey]: !c[groupKey] }))}
                      style={{
                        width: '100%', padding: '6px 12px', fontSize: '10px',
                        fontWeight: 600, color: '#666', textTransform: 'uppercase',
                        letterSpacing: '0.08em', fontFamily: 'Inter, sans-serif',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '4px', textAlign: 'left',
                      }}
                    >
                      <ChevronRight
                        size={12}
                        style={{
                          transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                          transition: 'transform 0.15s', flexShrink: 0,
                        }}
                      />
                      {groupLabels[groupKey]} ({items.length})
                    </button>
                    {!isCollapsed && items.map((layer) => (
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
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div style={{ paddingTop: '4px', paddingBottom: '4px' }}>
          {hasGroups ? (
            groupTree.map((node) => (
              <TreeNode key={node.id} node={node} />
            ))
          ) : (
            <p style={{ padding: '16px', fontSize: '11px', color: '#555', fontFamily: 'Inter, sans-serif', margin: 0 }}>
              {t('layerGroups.noGroups')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
