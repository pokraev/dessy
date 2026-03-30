
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
  const props = { size: 16, className: 'text-text-secondary' };
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

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: layer.id });

  const dndStyle = {
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

  return (
    <div
      ref={setNodeRef}
      style={dndStyle}
      className={`h-8 px-2 flex items-center gap-1 cursor-pointer select-none group ${isSelected ? 'bg-surface-raised' : 'hover:bg-surface-raised/60'}`}
      onClick={() => !isRenaming && onSelect(layer.id)}
    >
      {/* Drag handle */}
      <span
        {...attributes}
        {...listeners}
        className="flex items-center text-[#555555] opacity-0 group-hover:opacity-100 cursor-grab shrink-0 w-4"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={16} />
      </span>

      {/* Type icon */}
      <span className="flex items-center shrink-0 w-4">
        <TypeIcon type={layer.type} />
      </span>

      {/* Name text / rename input */}
      <span
        className="flex-1 overflow-hidden min-w-0"
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
            className="text-[13px] font-sans text-text-primary bg-transparent border-0 border-b border-accent outline-none w-full p-0"
          />
        ) : (
          <span className="text-[13px] font-sans text-text-primary block overflow-hidden text-ellipsis whitespace-nowrap">
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
        className="flex items-center justify-center w-5 h-5 bg-transparent border-0 cursor-pointer text-text-secondary hover:text-text-primary shrink-0 p-0"
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
        className="flex items-center justify-center w-5 h-5 bg-transparent border-0 cursor-pointer text-text-secondary hover:text-text-primary shrink-0 p-0"
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
      <div className="px-4 py-6 flex flex-col gap-2">
        <p className="text-[13px] font-sans text-text-primary m-0 font-semibold">
          {t('layers.noLayers')}
        </p>
        <p className="text-[11px] font-sans text-text-secondary m-0">
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
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          className={`flex items-center gap-1 pr-2 h-8 cursor-pointer text-[13px] font-sans text-text-primary select-none ${isSelected ? 'bg-surface-raised' : 'hover:bg-surface-raised/60'}`}
          onClick={() => {
            if (isGroup) {
              setTreeCollapsed((c) => ({ ...c, [node.id]: !c[node.id] }));
            } else {
              selectLayer(node.id);
            }
          }}
        >
          {isGroup ? (
            <ChevronRight
              size={12}
              style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s' }}
              className="shrink-0 text-[#666] w-4"
            />
          ) : (
            <span className="flex items-center shrink-0 w-4">
              <TypeIcon type={node.type as LayerItem['type']} />
            </span>
          )}
          <span className={`flex-1 overflow-hidden text-ellipsis whitespace-nowrap ${isGroup ? 'font-semibold text-[#aaa]' : 'font-normal text-text-primary'}`}>
            {node.name}
          </span>
          {isGroup && (
            <span className="text-[10px] text-[#555] shrink-0 mr-1">
              {node.childCount}
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); toggleVisibility(node.id); }}
            className="flex items-center justify-center w-5 h-5 bg-transparent border-0 cursor-pointer text-text-secondary hover:text-text-primary shrink-0 p-0"
          >
            {layer?.visible !== false ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); toggleLock(node.id); }}
            className="flex items-center justify-center w-5 h-5 bg-transparent border-0 cursor-pointer text-text-secondary hover:text-text-primary shrink-0 p-0"
          >
            {layer?.locked ? <Lock size={14} /> : <Unlock size={14} />}
          </button>
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
      <div className="flex border-b border-border">
        {(['type', 'grouping'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex-1 py-[5px] text-[10px] font-semibold uppercase tracking-[0.08em] font-sans bg-transparent border-0 cursor-pointer border-b-2 ${viewMode === mode ? 'text-text-primary border-accent' : 'text-[#555] border-transparent'}`}
          >
            {t(mode === 'type' ? 'layerGroups.byType' : 'layerGroups.byGrouping')}
          </button>
        ))}
      </div>

      {viewMode === 'type' ? (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={layers.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <div className="py-1">
              {groupOrder.map((groupKey) => {
                const items = grouped.get(groupKey)!;
                if (items.length === 0) return null;
                const isCollapsed = collapsed[groupKey] === true;
                return (
                  <div key={groupKey}>
                    <button
                      onClick={() => setCollapsed((c) => ({ ...c, [groupKey]: !c[groupKey] }))}
                      className="w-full px-3 py-[6px] text-[10px] font-semibold text-[#666] uppercase tracking-[0.08em] font-sans bg-transparent border-0 cursor-pointer flex items-center gap-1 text-left"
                    >
                      <ChevronRight
                        size={12}
                        style={{
                          transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                          transition: 'transform 0.15s',
                        }}
                        className="shrink-0"
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
        <div className="py-1">
          {groupTree.length > 0 ? (
            groupTree.map((node) => (
              <TreeNode key={node.id} node={node} />
            ))
          ) : (
            <p className="p-4 text-[11px] font-sans text-[#555] m-0">
              {t('layers.noLayers')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
