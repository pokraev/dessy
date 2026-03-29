
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { ColorPicker } from '../ColorPicker';
import { FORMATS } from '@/constants/formats';

export function PageSection() {
  const { t } = useTranslation();
  const canvasRef = useCanvasStore((s) => s.canvasRef);
  const currentProject = useProjectStore((s) => s.currentProject);
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);

  const currentPageIndex = currentProject?.currentPageIndex ?? 0;

  const handleBgChange = useCallback(
    (hex: string) => {
      if (!currentProject) return;
      const updatedPages = currentProject.pages.map((p, i) =>
        i === currentPageIndex ? { ...p, background: hex } : p
      );
      setCurrentProject({ ...currentProject, pages: updatedPages });

      // Update Fabric.js canvas background
      if (canvasRef) {
        canvasRef.backgroundColor = hex;
        canvasRef.renderAll();
      }
    },
    [currentProject, currentPageIndex, setCurrentProject, canvasRef]
  );

  if (!currentProject) return null;

  const { pages, meta } = currentProject;
  const page = pages[currentPageIndex];
  const bgColor = page?.background ?? '#ffffff';

  const format = FORMATS[meta.format];
  const formatLabel = format?.label ?? meta.format;
  const dimensionStr = format
    ? `${format.widthMm} \u00d7 ${format.heightMm} mm`
    : '';

  return (
    <div style={{ padding: '16px' }}>
      {/* Document heading */}
      <p
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: '#f5f5f5',
          fontFamily: 'Inter, sans-serif',
          margin: '0 0 4px',
        }}
      >
        {t('properties.document')}
      </p>
      <p
        style={{
          fontSize: '11px',
          color: '#888888',
          fontFamily: 'Inter, sans-serif',
          margin: '0 0 16px',
        }}
      >
        {t('properties.selectElement')}
      </p>

      {/* Format info */}
      <div style={{ marginBottom: '16px' }}>
        <span style={{ fontSize: '11px', color: '#888888', fontFamily: 'Inter, sans-serif' }}>
          {formatLabel}
        </span>
        {dimensionStr && (
          <span style={{ fontSize: '11px', color: '#888888', fontFamily: 'Inter, sans-serif', marginLeft: '8px' }}>
            {dimensionStr}
          </span>
        )}
      </div>

      {/* Background color */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: '#888888', fontFamily: 'Inter, sans-serif', width: '80px' }}>
          {t('properties.background')}
        </span>
        <ColorPicker value={bgColor} onChange={handleBgChange} />
        <span style={{ fontSize: '13px', color: '#f5f5f5', fontFamily: "'JetBrains Mono', monospace" }}>
          {bgColor.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
