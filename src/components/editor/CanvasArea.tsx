
import { useEditorStore } from '@/stores/editorStore';
import RulerH from '@/components/editor/RulerH';
import RulerV from '@/components/editor/RulerV';

const RULER_SIZE = 20;

interface CanvasAreaProps {
  children: React.ReactNode;
}

/**
 * CanvasArea wraps the canvas with mm-based rulers along the top and left
 * edges plus a corner square at their intersection.
 *
 * Layout:
 *   ┌──────┬──────────────────┐
 *   │ 20px │  RulerH (top)    │
 *   ├──────┼──────────────────┤
 *   │      │                  │
 *   │RulerV│  Canvas area     │
 *   │ left │  (children)      │
 *   │      │                  │
 *   └──────┴──────────────────┘
 */
export function CanvasArea({ children }: CanvasAreaProps) {
  const showRulers = useEditorStore((s) => s.showRulers);

  if (!showRulers) {
    return (
      <div className="w-full h-full overflow-hidden">
        {children}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Top row: corner square + horizontal ruler */}
      <div className="flex flex-shrink-0" style={{ height: RULER_SIZE }}>
        {/* Corner square — covers ruler intersection */}
        <div
          style={{
            width: RULER_SIZE,
            height: RULER_SIZE,
            flexShrink: 0,
            backgroundColor: '#0a0a0a',
            borderRight: '1px solid #2a2a2a',
            borderBottom: '1px solid #2a2a2a',
          }}
        />
        {/* Horizontal ruler */}
        <div className="flex-1 overflow-hidden">
          <RulerH />
        </div>
      </div>

      {/* Bottom row: vertical ruler + canvas */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {/* Vertical ruler */}
        <div
          className="flex-shrink-0 overflow-hidden"
          style={{ width: RULER_SIZE, height: '100%', borderRight: '1px solid #2a2a2a' }}
        >
          <RulerV />
        </div>

        {/* Canvas content */}
        <div className="flex-1 overflow-hidden" style={{ minWidth: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
