
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ToolBar } from './ToolBar';
import { LayersPanel } from './LayersPanel';
import { PagesPanel } from './PagesPanel';

type TabId = 'tools' | 'layers' | 'pages';

const TABS: { id: TabId; i18nKey: string }[] = [
  { id: 'tools', i18nKey: 'tabs.tools' },
  { id: 'layers', i18nKey: 'tabs.layers' },
  { id: 'pages', i18nKey: 'tabs.pages' },
];

export function LeftPanel() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>('tools');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '280px',
        background: '#141414',
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          height: '36px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'stretch',
          background: '#141414',
          borderBottom: '1px solid #2a2a2a',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                height: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #6366f1' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '11px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#f5f5f5' : '#888888',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: 0,
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.color = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.color = '#888888';
                }
              }}
            >
              {t(tab.i18nKey)}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {activeTab === 'tools' && <ToolBar />}
        {activeTab === 'layers' && <LayersPanel />}
        {activeTab === 'pages' && <PagesPanel />}
      </div>
    </div>
  );
}
