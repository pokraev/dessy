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
    duplicateProject(project.id);
    onRefresh();
    onClose();
    // Show simple toast via console (real toast system is out of scope for this plan)
    console.info(t('dashboard.successDuplicate'));
  }

  function handleDeleteConfirm() {
    deleteProject(project.id);
    deleteThumbnail(project.id);
    onRefresh();
    onClose();
  }

  const menuItemBase: React.CSSProperties = {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '8px 12px',
    fontSize: '14px',
    fontWeight: 400,
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    background: 'transparent',
  };

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.1 }}
      style={{
        position: 'absolute',
        top: '32px',
        right: '0',
        background: '#1e1e1e',
        border: '1px solid #2a2a2a',
        borderRadius: '8px',
        padding: '4px',
        zIndex: 10,
        minWidth: '140px',
      }}
    >
      {showDeleteConfirm ? (
        /* Delete confirmation view */
        <div>
          <p
            style={{
              fontSize: '14px',
              color: '#f5f5f5',
              padding: '8px 12px',
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {t('dashboard.deleteConfirm', { name: project.name })}
          </p>
          <div
            style={{
              display: 'flex',
              gap: '6px',
              padding: '4px 8px 8px',
            }}
          >
            <button
              onClick={() => setShowDeleteConfirm(false)}
              style={{
                flex: 1,
                padding: '6px 8px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                background: 'transparent',
                border: '1px solid #2a2a2a',
                borderRadius: '6px',
                color: '#f5f5f5',
              }}
            >
              {t('dashboard.cancel')}
            </button>
            <button
              onClick={handleDeleteConfirm}
              style={{
                flex: 1,
                padding: '6px 8px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                background: '#ef4444',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
              }}
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
            style={{ ...menuItemBase, color: '#f5f5f5' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            {t('dashboard.rename')}
          </button>
          <button
            onClick={handleDuplicate}
            style={{ ...menuItemBase, color: '#f5f5f5' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            {t('dashboard.duplicate')}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{ ...menuItemBase, color: '#ef4444' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            {t('dashboard.delete')}
          </button>
        </>
      )}
    </motion.div>
  );
}
