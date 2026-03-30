'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { deleteProject, duplicateProject } from '@/lib/storage/projectStorage';
import { deleteThumbnail } from '@/lib/storage/thumbnailDb';
import type { ProjectMeta } from '@/types/project';

interface Props {
  project: ProjectMeta;
  onClose: () => void;
  onRefresh: () => void;
  onStartRename: () => void;
}

export function ProjectCardMenu({ project, onClose, onRefresh, onStartRename }: Props) {
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function handleRename() {
    onStartRename();
    onClose();
  }

  function handleDuplicate() {
    const result = duplicateProject(project.id, t('dashboard.copyOf'));
    if (result === null) return;
    onRefresh();
    onClose();
    // Show simple toast via console (real toast system is out of scope for this plan)
    console.info(t('dashboard.successDuplicate'));
  }

  function handleDeleteConfirm() {
    deleteProject(project.id);
    deleteThumbnail(project.id).catch(() => {});
    onRefresh();
    onClose();
  }

  const menuItemClassName = 'block w-full text-left px-3 py-2 text-sm rounded cursor-pointer bg-transparent border-none hover:bg-border';

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.1 }}
      className="absolute top-8 right-0 bg-surface-raised border border-border rounded-lg p-1 z-10 min-w-[140px]"
    >
      {showDeleteConfirm ? (
        /* Delete confirmation view */
        <div>
          <p className="text-sm text-text-primary px-3 py-2 m-0 leading-snug">
            {t('dashboard.deleteConfirm', { name: project.name })}
          </p>
          <div className="flex gap-1.5 px-2 pb-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 py-1.5 px-2 text-xs font-medium cursor-pointer bg-transparent border border-border rounded-md text-text-primary hover:bg-border"
            >
              {t('dashboard.cancel')}
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="flex-1 py-1.5 px-2 text-xs font-medium cursor-pointer bg-danger border-none rounded-md text-white hover:opacity-90"
            >
              {t('dashboard.deleteConfirmButton')}
            </button>
          </div>
        </div>
      ) : (
        /* Normal menu items */
        <>
          <button
            onClick={handleRename}
            className={`${menuItemClassName} text-text-primary`}
          >
            {t('dashboard.rename')}
          </button>
          <button
            onClick={handleDuplicate}
            className={`${menuItemClassName} text-text-primary`}
          >
            {t('dashboard.duplicate')}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className={`${menuItemClassName} text-danger hover:bg-danger/10`}
          >
            {t('dashboard.delete')}
          </button>
        </>
      )}
    </motion.div>
  );
}
