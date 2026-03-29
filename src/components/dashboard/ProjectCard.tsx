'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreVertical } from 'lucide-react';
import { getThumbnail } from '@/lib/storage/thumbnailDb';
import { updateProjectName } from '@/lib/storage/projectStorage';
import { relativeTime } from '@/lib/utils/relativeTime';
import { FORMATS } from '@/constants/formats';
import { useAppStore } from '@/stores/appStore';
import type { ProjectMeta } from '@/types/project';
import { ProjectCardMenu } from './ProjectCardMenu';

interface Props {
  project: ProjectMeta;
  onRefresh: () => void;
}

export function ProjectCard({ project, onRefresh }: Props) {
  const { t } = useTranslation();
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(project.name);

  // Load thumbnail with cleanup to prevent memory leaks
  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    getThumbnail(project.id).then((url) => {
      if (cancelled) {
        if (url) URL.revokeObjectURL(url);
        return;
      }
      objectUrl = url;
      setThumbUrl(url);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [project.id]);

  function handleCardClick() {
    if (isRenaming || showMenu) return;
    useAppStore.getState().openProject(project.id);
  }

  function handleMenuToggle(e: React.MouseEvent) {
    e.stopPropagation();
    setShowMenu((prev) => !prev);
  }

  function handleRenameCommit() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== project.name) {
      updateProjectName(project.id, trimmed);
      onRefresh();
    }
    setIsRenaming(false);
  }

  function handleRenameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleRenameCommit();
    } else if (e.key === 'Escape') {
      setRenameValue(project.name);
      setIsRenaming(false);
    }
  }

  const format = FORMATS[project.format];
  const formatLabel = format?.label ?? project.format;
  const pageCount = format?.pages ?? 1;

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: '#141414',
        border: `1px solid ${hovered ? '#6366f1' : '#2a2a2a'}`,
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
    >
      {/* Thumbnail area */}
      <div
        style={{
          height: '160px',
          overflow: 'hidden',
          background: thumbUrl ? undefined : '#6366f1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={project.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#f5f5f5',
              opacity: 0.7,
            }}
          >
            {formatLabel}
          </span>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '12px' }}>
        {/* Project name / rename input */}
        {isRenaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameCommit}
            onKeyDown={handleRenameKeyDown}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1e1e1e',
              border: '1px solid #6366f1',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '16px',
              fontWeight: 600,
              color: '#f5f5f5',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
        ) : (
          <div
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#f5f5f5',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 'calc(100% - 28px)',
            }}
          >
            {project.name}
          </div>
        )}

        {/* Meta row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '4px',
          }}
        >
          {/* Format badge */}
          <span
            style={{
              background: '#2a2a2a',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 400,
              color: '#888',
              flexShrink: 0,
            }}
          >
            {formatLabel}
          </span>

          {/* Relative date */}
          <span style={{ fontSize: '12px', color: '#888', flexShrink: 0 }}>
            {relativeTime(project.updatedAt)}
          </span>

          {/* Page count */}
          <span style={{ fontSize: '12px', color: '#888', flexShrink: 0 }}>
            {t('dashboard.pageCount', { count: pageCount })}
          </span>
        </div>
      </div>

      {/* 3-dot menu button */}
      <button
        aria-label="Project options"
        aria-haspopup="true"
        onClick={handleMenuToggle}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'rgba(10,10,10,0.7)',
          borderRadius: '6px',
          padding: '4px',
          border: 'none',
          cursor: 'pointer',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.15s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#f5f5f5',
        }}
      >
        <MoreVertical size={16} />
      </button>

      {/* Dropdown menu */}
      {showMenu && (
        <ProjectCardMenu
          project={project}
          onClose={() => setShowMenu(false)}
          onRefresh={() => {
            setShowMenu(false);
            onRefresh();
          }}
          onStartRename={() => {
            setRenameValue(project.name);
            setIsRenaming(true);
          }}
        />
      )}
    </div>
  );
}
