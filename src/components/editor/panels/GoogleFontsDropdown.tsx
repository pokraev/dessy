'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { useGoogleFonts, loadGoogleFont } from '@/hooks/useGoogleFonts';
import { POPULAR_FONTS } from '@/constants/popular-fonts';

interface GoogleFontsDropdownProps {
  value: string;
  onChange: (family: string) => void;
}

const PREVIEW_BATCH = 5;

export function GoogleFontsDropdown({ value, onChange }: GoogleFontsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 280,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const previewQueueRef = useRef<string[]>([]);
  const previewLoadingRef = useRef(false);

  const { fonts, loading, loadMore, search, setSearch } = useGoogleFonts();

  // Separate popular from "all other" fonts based on search
  const popularFiltered = search
    ? POPULAR_FONTS.filter((f) => f.toLowerCase().startsWith(search.toLowerCase()))
    : POPULAR_FONTS;

  const popularSet = new Set(POPULAR_FONTS);
  const otherFonts = fonts.filter((f) => !popularSet.has(f));

  // Open dropdown and position it
  const openDropdown = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 320;
    const openUpward = rect.bottom + dropdownHeight > window.innerHeight;
    const top = openUpward ? rect.top - dropdownHeight - 4 : rect.bottom + 4;
    const left = rect.left;
    setDropdownPos({ top, left, width: Math.max(280, rect.width) });
    setOpen(true);
  }, []);

  // Close on click outside or Escape
  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  // IntersectionObserver for infinite scroll sentinel
  useEffect(() => {
    if (!open || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [open, loadMore, fonts]);

  // IntersectionObserver for per-row font preview loading
  const observePreviewFont = useCallback((el: HTMLElement | null) => {
    if (!el || !open) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const fontName = (entry.target as HTMLElement).dataset.fontFamily;
            if (fontName) {
              enqueuePreview(fontName);
            }
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    // cleanup is handled by element unmount — not returning here since this is called per-row
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function enqueuePreview(family: string) {
    if (previewQueueRef.current.includes(family)) return;
    previewQueueRef.current.push(family);
    if (!previewLoadingRef.current) {
      flushPreviewQueue();
    }
  }

  async function flushPreviewQueue() {
    previewLoadingRef.current = true;
    while (previewQueueRef.current.length > 0) {
      const batch = previewQueueRef.current.splice(0, PREVIEW_BATCH);
      await Promise.allSettled(
        batch.map((family) => {
          const slug = family.toLowerCase().replace(/\s+/g, '-');
          const id = `gf-preview-${slug}`;
          if (document.getElementById(id)) return Promise.resolve();
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.id = id;
          link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&display=swap`;
          document.head.appendChild(link);
          return Promise.resolve();
        })
      );
    }
    previewLoadingRef.current = false;
  }

  const handleSelectFont = useCallback(
    async (fontName: string) => {
      await loadGoogleFont(fontName);
      onChange(fontName);
      setOpen(false);
    },
    [onChange]
  );

  const fontRowStyle = (fontName: string): React.CSSProperties => ({
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    fontFamily: `'${fontName}', sans-serif`,
    fontSize: '13px',
    color: '#f5f5f5',
    cursor: 'pointer',
    background: fontName === value ? 'rgba(99,102,241,0.15)' : 'transparent',
    flexShrink: 0,
  });

  const sectionHeaderStyle: React.CSSProperties = {
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    fontSize: '11px',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    flexShrink: 0,
    userSelect: 'none',
  };

  const dropdownContent = (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: `${dropdownPos.width}px`,
        maxWidth: '280px',
        zIndex: 200,
        background: '#1e1e1e',
        border: '1px solid #2a2a2a',
        borderRadius: '4px',
        maxHeight: '320px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Search input — sticky */}
      <div style={{ flexShrink: 0, padding: '6px 8px', borderBottom: '1px solid #2a2a2a' }}>
        <input
          type="text"
          placeholder="Search fonts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          style={{
            width: '100%',
            height: '28px',
            background: '#141414',
            border: '1px solid #2a2a2a',
            borderRadius: '4px',
            outline: 'none',
            padding: '0 8px',
            fontSize: '13px',
            color: '#f5f5f5',
            fontFamily: 'Inter, sans-serif',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Scrollable font list */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {/* Popular section */}
        {popularFiltered.length > 0 && (
          <>
            <div style={sectionHeaderStyle}>Popular</div>
            {popularFiltered.map((fontName) => (
              <div
                key={`popular-${fontName}`}
                data-font-family={fontName}
                ref={(el) => observePreviewFont(el)}
                style={fontRowStyle(fontName)}
                onClick={() => handleSelectFont(fontName)}
                onMouseEnter={(e) => {
                  if (fontName !== value) {
                    (e.currentTarget as HTMLDivElement).style.background = '#2a2a2a';
                  }
                }}
                onMouseLeave={(e) => {
                  if (fontName !== value) {
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                  }
                }}
              >
                {fontName}
              </div>
            ))}
          </>
        )}

        {/* Divider */}
        {otherFonts.length > 0 && (
          <>
            <div style={{ height: '1px', background: '#2a2a2a', margin: '4px 0' }} />
            <div style={sectionHeaderStyle}>All fonts</div>
            {otherFonts.map((fontName) => (
              <div
                key={`all-${fontName}`}
                data-font-family={fontName}
                ref={(el) => observePreviewFont(el)}
                style={fontRowStyle(fontName)}
                onClick={() => handleSelectFont(fontName)}
                onMouseEnter={(e) => {
                  if (fontName !== value) {
                    (e.currentTarget as HTMLDivElement).style.background = '#2a2a2a';
                  }
                }}
                onMouseLeave={(e) => {
                  if (fontName !== value) {
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                  }
                }}
              >
                {fontName}
              </div>
            ))}
          </>
        )}

        {/* Loading indicator */}
        {loading && (
          <div
            style={{
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              fontSize: '11px',
              color: '#888888',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Loading fonts...
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} style={{ height: '1px' }} />
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => (open ? setOpen(false) : openDropdown())}
        style={{
          width: '100%',
          height: '32px',
          background: '#1e1e1e',
          border: '1px solid #2a2a2a',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          color: '#f5f5f5',
        }}
      >
        <span
          style={{
            fontFamily: `'${value}', sans-serif`,
            fontSize: '13px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </span>
        <ChevronDown
          size={14}
          style={{
            color: '#888888',
            flexShrink: 0,
            marginLeft: '4px',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 150ms ease-in-out',
          }}
        />
      </button>

      {typeof document !== 'undefined' &&
        open &&
        createPortal(dropdownContent, document.body)}
    </>
  );
}
