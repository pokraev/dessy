'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { setLanguage } from '@/i18n';
import { listProjects } from '@/lib/storage/projectStorage';
import type { ProjectMeta } from '@/types/project';
import { ProjectGrid } from './ProjectGrid';
import { EmptyState } from './EmptyState';
import { NewLeafletModal } from './NewLeafletModal';

function getSortedProjects(): ProjectMeta[] {
  return listProjects().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function Dashboard() {
  const { t, i18n } = useTranslation();
  const [projects, setProjects] = useState<ProjectMeta[]>(getSortedProjects);
  const [showNewLeafletModal, setShowNewLeafletModal] = useState(false);
  const [newLeafletBtnHovered, setNewLeafletBtnHovered] = useState(false);

  const refreshList = useCallback(() => {
    setProjects(getSortedProjects());
  }, []);

  const handleNewLeaflet = useCallback(() => {
    setShowNewLeafletModal(true);
  }, []);

  return (
    <div
      style={{
        background: '#0a0a0a',
        minHeight: '100vh',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Header bar */}
      <header
        style={{
          background: '#1e1e1e',
          borderBottom: '1px solid #2a2a2a',
          height: '56px',
          padding: '0 24px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left: wordmark */}
        <span
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#f5f5f5',
          }}
        >
          Dessy
        </span>

        {/* Right: New Leaflet + Language toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleNewLeaflet}
            onMouseEnter={() => setNewLeafletBtnHovered(true)}
            onMouseLeave={() => setNewLeafletBtnHovered(false)}
            style={{
              background: newLeafletBtnHovered ? '#818cf8' : '#6366f1',
              color: '#f5f5f5',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {t('dashboard.newLeaflet')}
          </button>

          {/* Language toggle */}
          <button
            onClick={() => setLanguage(i18n.language === 'bg' ? 'en' : 'bg')}
            title={t('lang.' + (i18n.language === 'bg' ? 'en' : 'bg'))}
            style={{
              height: '36px',
              paddingLeft: '8px',
              paddingRight: '8px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 500,
              background: 'transparent',
              border: '1px solid #2a2a2a',
              cursor: 'pointer',
              color: '#888',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Globe size={14} />
            {i18n.language.toUpperCase()}
          </button>
        </div>
      </header>

      {/* Content area */}
      <main
        style={{
          padding: '32px 24px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {projects.length === 0 ? (
          <EmptyState onNewLeaflet={handleNewLeaflet} />
        ) : (
          <>
            <h2
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#f5f5f5',
                marginBottom: '16px',
                marginTop: 0,
              }}
            >
              {t('dashboard.recentProjects')}
            </h2>
            <ProjectGrid projects={projects} onRefresh={refreshList} />
          </>
        )}
      </main>

      {showNewLeafletModal && (
        <NewLeafletModal onClose={() => setShowNewLeafletModal(false)} />
      )}
    </div>
  );
}
