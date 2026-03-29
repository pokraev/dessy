import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { X, Image, FileCode, FileType, Terminal } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { FORMATS } from '@/constants/formats';
import { exportRasterPages } from '@/lib/export/raster-export';
import { exportInDesign } from '@/lib/export/indesign-export';
import { exportCorelDrawSVG, exportCorelDrawVBA } from '@/lib/export/coreldraw-export';

type ExportFormat = 'raster' | 'indesign' | 'coreldraw-svg' | 'coreldraw-vba' | null;
type DPI = 72 | 150 | 300;
type RasterFormat = 'png' | 'jpeg';
type Scope = 'current' | 'all';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
}

const FORMAT_CARDS: {
  id: ExportFormat & string;
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
}[] = [
  { id: 'raster', icon: <Image size={20} />, titleKey: 'export.raster', descKey: 'export.rasterDesc' },
  { id: 'indesign', icon: <FileCode size={20} />, titleKey: 'export.indesign', descKey: 'export.indesignDesc' },
  { id: 'coreldraw-svg', icon: <FileType size={20} />, titleKey: 'export.coreldrawSvg', descKey: 'export.coreldrawSvgDesc' },
  { id: 'coreldraw-vba', icon: <Terminal size={20} />, titleKey: 'export.coreldrawVba', descKey: 'export.coreldrawVbaDesc' },
];

export function ExportModal({ open, onClose }: ExportModalProps) {
  const { t } = useTranslation();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(null);
  const [dpi, setDpi] = useState<DPI>(300);
  const [rasterFormat, setRasterFormat] = useState<RasterFormat>('png');
  const [scope, setScope] = useState<Scope>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    const canvas = useCanvasStore.getState().canvasRef;
    const project = useProjectStore.getState().currentProject;
    if (!canvas || !project) return;

    const formatDef = FORMATS[project.meta.format];
    if (!formatDef) return;

    const projectName = project.meta.name || 'export';
    const pages = project.pages;
    const currentPageIndex = project.currentPageIndex;

    setIsExporting(true);
    setError(null);
    useCanvasStore.getState().setBusyMessage(t('export.exporting'));

    try {
      switch (selectedFormat) {
        case 'raster': {
          const exportPages = scope === 'current'
            ? [pages[currentPageIndex]]
            : pages;
          const exportPageIndex = scope === 'current' ? 0 : currentPageIndex;
          await exportRasterPages({
            canvas,
            projectId: project.meta.id,
            pages: exportPages,
            currentPageIndex: exportPageIndex,
            docWidth: canvas.getWidth(),
            docHeight: canvas.getHeight(),
            format: rasterFormat,
            dpi,
            projectName,
          });
          break;
        }
        case 'indesign':
          await exportInDesign(
            canvas,
            project.meta.id,
            pages,
            currentPageIndex,
            formatDef.widthMm,
            formatDef.heightMm,
            projectName,
          );
          break;
        case 'coreldraw-svg':
          await exportCorelDrawSVG(
            canvas,
            project.meta.id,
            pages,
            currentPageIndex,
            formatDef.widthMm,
            formatDef.heightMm,
            projectName,
          );
          break;
        case 'coreldraw-vba':
          await exportCorelDrawVBA(
            canvas,
            project.meta.id,
            pages,
            currentPageIndex,
            formatDef.widthMm,
            formatDef.heightMm,
            projectName,
          );
          break;
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
      useCanvasStore.getState().setBusyMessage(null);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="export-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={onClose}
        >
          <motion.div
            key="export-modal-panel"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#141414',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
              width: '520px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              borderBottom: '1px solid #2a2a2a',
            }}>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#f5f5f5' }}>
                {t('export.title')}
              </span>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#888888',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                  borderRadius: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '16px' }}>
              {/* Format grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: selectedFormat ? '16px' : 0,
              }}>
                {FORMAT_CARDS.map((card) => {
                  const isActive = selectedFormat === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => { setSelectedFormat(card.id as ExportFormat); setError(null); }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '6px',
                        padding: '14px',
                        background: isActive ? '#1a1a2e' : '#0a0a0a',
                        border: `1px solid ${isActive ? '#6366f1' : '#2a2a2a'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: isActive ? '#f5f5f5' : '#aaa',
                        textAlign: 'left',
                        transition: 'border-color 0.15s, background 0.15s',
                      }}
                    >
                      <div style={{ color: isActive ? '#6366f1' : '#666' }}>{card.icon}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{t(card.titleKey)}</div>
                      <div style={{ fontSize: '11px', color: '#888', lineHeight: 1.4 }}>{t(card.descKey)}</div>
                    </button>
                  );
                })}
              </div>

              {/* Options for selected format */}
              {selectedFormat === 'raster' && (
                <div style={{
                  padding: '14px',
                  background: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  {/* Format toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#888', minWidth: '50px' }}>{t('export.format')}</span>
                    {(['png', 'jpeg'] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setRasterFormat(f)}
                        style={{
                          padding: '5px 14px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: rasterFormat === f ? '#6366f1' : 'transparent',
                          color: rasterFormat === f ? '#fff' : '#888',
                          border: `1px solid ${rasterFormat === f ? '#6366f1' : '#333'}`,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  {/* DPI */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#888', minWidth: '50px' }}>{t('export.dpi')}</span>
                    {([72, 150, 300] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDpi(d)}
                        style={{
                          padding: '5px 14px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: dpi === d ? '#6366f1' : 'transparent',
                          color: dpi === d ? '#fff' : '#888',
                          border: `1px solid ${dpi === d ? '#6366f1' : '#333'}`,
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        {d} DPI
                      </button>
                    ))}
                  </div>

                  {/* Scope */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#888', minWidth: '50px' }}>{t('export.scope')}</span>
                    {(['current', 'all'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setScope(s)}
                        style={{
                          padding: '5px 14px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: scope === s ? '#6366f1' : 'transparent',
                          color: scope === s ? '#fff' : '#888',
                          border: `1px solid ${scope === s ? '#6366f1' : '#333'}`,
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        {t(s === 'current' ? 'export.currentPage' : 'export.allPages')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedFormat === 'coreldraw-svg' && (
                <div style={{
                  padding: '14px',
                  background: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span style={{ fontSize: '12px', color: '#888', minWidth: '50px' }}>{t('export.scope')}</span>
                  {(['current', 'all'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setScope(s)}
                      style={{
                        padding: '5px 14px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: scope === s ? '#6366f1' : 'transparent',
                        color: scope === s ? '#fff' : '#888',
                        border: `1px solid ${scope === s ? '#6366f1' : '#333'}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      {t(s === 'current' ? 'export.currentPage' : 'export.allPages')}
                    </button>
                  ))}
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{
                  marginTop: '12px',
                  padding: '10px 14px',
                  background: '#1a0a0a',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#ef4444',
                }}>
                  {error}
                </div>
              )}

              {/* Export button */}
              {selectedFormat && (
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isExporting}
                  style={{
                    marginTop: '16px',
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    background: isExporting ? '#333' : '#6366f1',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isExporting ? 'not-allowed' : 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  {isExporting ? t('export.exporting') : t('export.exportBtn')}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
