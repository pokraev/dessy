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

  const refreshList = useCallback(() => {
    setProjects(getSortedProjects());
  }, []);

  const handleNewLeaflet = useCallback(() => {
    setShowNewLeafletModal(true);
  }, []);

  return (
    <div className="bg-bg min-h-screen font-sans">
      {/* Header bar */}
      <header className="bg-surface-raised border-b border-border h-14 px-6 flex flex-row items-center justify-between">
        {/* Left: wordmark */}
        <span className="text-base font-semibold text-text-primary">
          Dessy
        </span>

        {/* Right: New Leaflet + Language toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewLeaflet}
            className="bg-accent hover:bg-accent-hover text-text-primary border-none rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer transition-colors duration-150"
          >
            {t('dashboard.newLeaflet')}
          </button>

          {/* Language toggle */}
          <button
            onClick={() => setLanguage(i18n.language === 'bg' ? 'en' : 'bg')}
            title={t('lang.' + (i18n.language === 'bg' ? 'en' : 'bg'))}
            className="h-9 px-2 rounded-lg text-xs font-medium bg-transparent border border-border cursor-pointer text-text-secondary flex items-center gap-1"
          >
            <Globe size={14} />
            {i18n.language.toUpperCase()}
          </button>
        </div>
      </header>

      {/* Content area */}
      <main className="py-8 px-6 max-w-[1200px] mx-auto">
        {projects.length === 0 ? (
          <EmptyState onNewLeaflet={handleNewLeaflet} />
        ) : (
          <>
            <h2 className="text-base font-semibold text-text-primary mb-4 mt-0">
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
