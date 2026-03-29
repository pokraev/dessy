'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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
import { Plus } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { FORMATS } from '@/constants/formats';
import type { Page } from '@/types/project';

// ── Delete confirmation dialog ─────────────────────────────────────────────────

interface DeleteConfirmProps {
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmDialog({ onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        zIndex: 200,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1e1e1e',
          borderRadius: '8px',
          border: '1px solid #2a2a2a',
          padding: '20px',
          width: '280px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <p
          style={{
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
            color: '#f5f5f5',
            margin: 0,
          }}
        >
          Delete this page? This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              height: '32px',
              padding: '0 12px',
              background: 'transparent',
              border: '1px solid #2a2a2a',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              color: '#f5f5f5',
            }}
          >
            Keep Page
          </button>
          <button
            onClick={onConfirm}
            style={{
              height: '32px',
              padding: '0 12px',
              background: '#ef4444',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              color: '#f5f5f5',
            }}
          >
            Delete Page
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PageThumbnailRow ──────────────────────────────────────────────────────────

interface PageThumbnailRowProps {
  page: Page;
  pageIndex: number;
  isActive: boolean;
  thumbnail: string | undefined;
  onSelect: (index: number) => void;
  onContextMenu: (e: React.MouseEvent, index: number) => void;
}

function PageThumbnailRow({
  page,
  pageIndex,
  isActive,
  thumbnail,
  onSelect,
  onContextMenu,
}: PageThumbnailRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: page.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        padding: '8px',
        cursor: 'pointer',
      }}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(pageIndex)}
      onContextMenu={(e) => onContextMenu(e, pageIndex)}
    >
      {/* Thumbnail area */}
      <div
        style={{
          height: '64px',
          background: isActive ? '#1a1a2e' : '#1e1e1e',
          border: `1px solid ${isActive ? '#6366f1' : '#2a2a2a'}`,
          borderRadius: '4px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={`Page ${pageIndex + 1}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        ) : (
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'Inter, sans-serif',
              color: '#555555',
            }}
          >
            {pageIndex + 1}
          </span>
        )}
      </div>

      {/* Page label */}
      <p
        style={{
          fontSize: '11px',
          fontFamily: 'Inter, sans-serif',
          color: '#888888',
          margin: '4px 0 0 0',
          textAlign: 'center',
        }}
      >
        Page {pageIndex + 1}
      </p>
    </div>
  );
}

// ── PagesPanel ────────────────────────────────────────────────────────────────

export function PagesPanel() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);
  const setCurrentPageIndex = useProjectStore((s) => s.setCurrentPageIndex);
  const triggerSwitchPage = useCanvasStore((s) => s.triggerSwitchPage);

  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [menuState, setMenuState] = useState<{
    visible: boolean;
    x: number;
    y: number;
    pageIndex: number;
  }>({ visible: false, x: 0, y: 0, pageIndex: -1 });
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const captureCurrentThumbnail = useCallback(() => {
    if (!currentProject) return;
    const canvas = useCanvasStore.getState().canvasRef;
    if (canvas) {
      const dataUrl = canvas.toDataURL({ multiplier: 0.15, format: 'jpeg', quality: 0.6 });
      setThumbnails((prev) => ({ ...prev, [currentProject.currentPageIndex]: dataUrl }));
    }
  }, [currentProject]);

  // Capture thumbnail on mount and whenever active page changes
  useEffect(() => {
    captureCurrentThumbnail();
  }, [captureCurrentThumbnail, currentProject?.currentPageIndex]);

  // Close context menu on outside click / Escape
  useEffect(() => {
    if (!menuState.visible) return;

    function onMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuState((m) => ({ ...m, visible: false }));
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuState((m) => ({ ...m, visible: false }));
    }

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuState.visible]);

  if (!currentProject) return null;

  const pages = currentProject.pages;
  const currentPageIndex = currentProject.currentPageIndex;
  const projectId = currentProject.meta.id;
  // Calculate aspect ratio from document format for thumbnail proportions
  const format = FORMATS[currentProject.meta.format] ?? FORMATS['A4'];
  void (format.widthMm / format.heightMm);

  function handleSelectPage(index: number) {
    if (!currentProject) return;
    captureCurrentThumbnail();
    if (triggerSwitchPage) {
      triggerSwitchPage(index);
    } else {
      setCurrentPageIndex(index);
    }
  }

  function handleContextMenu(e: React.MouseEvent, pageIndex: number) {
    e.preventDefault();
    setMenuState({ visible: true, x: e.clientX, y: e.clientY, pageIndex });
  }

  function handleDuplicatePage() {
    if (!currentProject) return;
    const sourceIndex = menuState.pageIndex;
    const sourcePage = pages[sourceIndex];
    if (!sourcePage) return;

    const sourceKey = `dessy-generated-page-${projectId}-${sourceIndex}`;
    const sourceJson = sessionStorage.getItem(sourceKey);

    const newPage: Page = {
      id: crypto.randomUUID(),
      elements: [...sourcePage.elements],
      background: sourcePage.background,
    };

    const newPages = [...pages];
    const insertIndex = sourceIndex + 1;
    newPages.splice(insertIndex, 0, newPage);

    // Shift sessionStorage keys forward from the end down to insertIndex
    for (let i = newPages.length - 1; i > insertIndex; i--) {
      const prevKey = `dessy-generated-page-${projectId}-${i - 1}`;
      const nextKey = `dessy-generated-page-${projectId}-${i}`;
      const data = sessionStorage.getItem(prevKey);
      if (data) {
        sessionStorage.setItem(nextKey, data);
      } else {
        sessionStorage.removeItem(nextKey);
      }
    }

    // Write duplicated page JSON at the insert position
    if (sourceJson) {
      sessionStorage.setItem(`dessy-generated-page-${projectId}-${insertIndex}`, sourceJson);
    } else {
      sessionStorage.removeItem(`dessy-generated-page-${projectId}-${insertIndex}`);
    }

    setMenuState((m) => ({ ...m, visible: false }));
    setCurrentProject({ ...currentProject, pages: newPages, currentPageIndex: insertIndex });

    if (triggerSwitchPage) {
      triggerSwitchPage(insertIndex);
    }
  }

  function handleDeletePageRequest() {
    if (pages.length <= 1) return;
    setDeleteConfirmIndex(menuState.pageIndex);
    setMenuState((m) => ({ ...m, visible: false }));
  }

  function handleDeletePageConfirm() {
    if (deleteConfirmIndex === null || !currentProject) return;
    const delIndex = deleteConfirmIndex;

    const newPages = pages.filter((_, i) => i !== delIndex);

    // Remove sessionStorage key and shift remaining keys down
    sessionStorage.removeItem(`dessy-generated-page-${projectId}-${delIndex}`);
    for (let i = delIndex; i < newPages.length; i++) {
      const nextKey = `dessy-generated-page-${projectId}-${i + 1}`;
      const currKey = `dessy-generated-page-${projectId}-${i}`;
      const data = sessionStorage.getItem(nextKey);
      if (data) {
        sessionStorage.setItem(currKey, data);
      } else {
        sessionStorage.removeItem(currKey);
      }
    }
    // Clean up trailing key
    sessionStorage.removeItem(`dessy-generated-page-${projectId}-${newPages.length}`);

    let newCurrentIndex = currentPageIndex;
    if (newCurrentIndex >= newPages.length) {
      newCurrentIndex = newPages.length - 1;
    }

    // Shift thumbnails to match removed page
    setThumbnails((prev) => {
      const shifted: Record<number, string> = {};
      for (const [k, v] of Object.entries(prev)) {
        const idx = Number(k);
        if (idx < delIndex) {
          shifted[idx] = v;
        } else if (idx > delIndex) {
          shifted[idx - 1] = v;
        }
      }
      return shifted;
    });

    setDeleteConfirmIndex(null);
    setCurrentProject({ ...currentProject, pages: newPages, currentPageIndex: newCurrentIndex });

    if (triggerSwitchPage) {
      triggerSwitchPage(newCurrentIndex);
    }
  }

  function handleAddPage() {
    if (!currentProject) return;
    captureCurrentThumbnail();

    const newPage: Page = {
      id: crypto.randomUUID(),
      elements: [],
      background: '#FFFFFF',
    };

    const newPages = [...pages, newPage];
    const newPageIndex = newPages.length - 1;

    setCurrentProject({ ...currentProject, pages: newPages, currentPageIndex: newPageIndex });

    if (triggerSwitchPage) {
      triggerSwitchPage(newPageIndex);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !currentProject) return;

    const fromIndex = pages.findIndex((p) => p.id === active.id);
    const toIndex = pages.findIndex((p) => p.id === over.id);
    if (fromIndex === -1 || toIndex === -1) return;

    // Read all page JSONs before reorder
    const pageJsons: (string | null)[] = pages.map((_, i) =>
      sessionStorage.getItem(`dessy-generated-page-${projectId}-${i}`)
    );

    const newPages = [...pages];
    const [moved] = newPages.splice(fromIndex, 1);
    newPages.splice(toIndex, 0, moved);

    // Reorder JSONs to match new page positions
    const newJsons = [...pageJsons];
    const [movedJson] = newJsons.splice(fromIndex, 1);
    newJsons.splice(toIndex, 0, movedJson);

    // Re-write all sessionStorage keys in new order
    for (let i = 0; i < newPages.length; i++) {
      const key = `dessy-generated-page-${projectId}-${i}`;
      if (newJsons[i] !== null) {
        sessionStorage.setItem(key, newJsons[i]!);
      } else {
        sessionStorage.removeItem(key);
      }
    }

    // Reorder thumbnails to match new page order
    setThumbnails((prev) => {
      const thumbArr = pages.map((_, i) => prev[i]);
      const newThumbArr = [...thumbArr];
      const [movedThumb] = newThumbArr.splice(fromIndex, 1);
      newThumbArr.splice(toIndex, 0, movedThumb);
      const next: Record<number, string> = {};
      newThumbArr.forEach((t, i) => {
        if (t !== undefined) next[i] = t;
      });
      return next;
    });

    // Adjust current page index after reorder
    let newCurrentIndex = currentPageIndex;
    if (currentPageIndex === fromIndex) {
      newCurrentIndex = toIndex;
    } else if (currentPageIndex > fromIndex && currentPageIndex <= toIndex) {
      newCurrentIndex = currentPageIndex - 1;
    } else if (currentPageIndex < fromIndex && currentPageIndex >= toIndex) {
      newCurrentIndex = currentPageIndex + 1;
    }

    setCurrentProject({ ...currentProject, pages: newPages, currentPageIndex: newCurrentIndex });
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Page list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={pages.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            {pages.map((page, index) => (
              <PageThumbnailRow
                key={page.id}
                page={page}
                pageIndex={index}
                isActive={index === currentPageIndex}
                thumbnail={thumbnails[index]}
                onSelect={handleSelectPage}
                onContextMenu={handleContextMenu}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Add Page button */}
      <div style={{ padding: '8px', flexShrink: 0 }}>
        <button
          onClick={handleAddPage}
          style={{
            width: '100%',
            height: '36px',
            background: '#1e1e1e',
            border: '1px dashed #2a2a2a',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '11px',
            fontFamily: 'Inter, sans-serif',
            color: '#888888',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#f5f5f5';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#888888';
          }}
        >
          <Plus size={14} />
          Add Page
        </button>
      </div>

      {/* Context menu */}
      {menuState.visible && (
        <div
          ref={menuRef}
          role="menu"
          style={{
            position: 'fixed',
            left: menuState.x,
            top: menuState.y,
            background: '#1e1e1e',
            borderRadius: '8px',
            border: '1px solid #2a2a2a',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            minWidth: '180px',
            zIndex: 100,
            padding: '4px 0',
          }}
        >
          <button
            role="menuitem"
            onClick={handleDuplicatePage}
            style={{
              width: '100%',
              height: '32px',
              padding: '0 16px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              color: '#f5f5f5',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            Duplicate Page
          </button>
          <button
            role="menuitem"
            onClick={handleDeletePageRequest}
            disabled={pages.length <= 1}
            style={{
              width: '100%',
              height: '32px',
              padding: '0 16px',
              background: 'transparent',
              border: 'none',
              cursor: pages.length <= 1 ? 'default' : 'pointer',
              textAlign: 'left',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              color: pages.length <= 1 ? '#555555' : '#ef4444',
              opacity: pages.length <= 1 ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (pages.length > 1) {
                (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            Delete Page
          </button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirmIndex !== null && (
        <DeleteConfirmDialog
          onConfirm={handleDeletePageConfirm}
          onCancel={() => setDeleteConfirmIndex(null)}
        />
      )}
    </div>
  );
}
