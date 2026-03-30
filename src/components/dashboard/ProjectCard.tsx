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
    }).catch(() => { /* thumbnail load failure shows placeholder */ });
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
      className="group relative bg-surface border border-border rounded-xl overflow-hidden cursor-pointer transition-colors hover:border-accent"
    >
      {/* Thumbnail area */}
      <div
        className={`h-40 overflow-hidden p-3 box-border flex items-center justify-center${thumbUrl ? '' : ' bg-accent'}`}
      >
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={project.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-sm font-semibold text-text-primary opacity-70">
            {formatLabel}
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="p-3">
        {/* Project name / rename input */}
        {isRenaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameCommit}
            onKeyDown={handleRenameKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-raised border border-accent rounded px-2 py-1 text-base font-semibold text-text-primary outline-none w-full"
          />
        ) : (
          <div className="text-base font-semibold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis max-w-[calc(100%-28px)]">
            {project.name}
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-1">
          {/* Format badge */}
          <span className="bg-surface-raised rounded px-2 py-1 text-xs text-text-secondary shrink-0">
            {formatLabel}
          </span>

          {/* Relative date */}
          <span className="text-xs text-text-secondary shrink-0">
            {relativeTime(project.updatedAt)}
          </span>

          {/* Page count */}
          <span className="text-xs text-text-secondary shrink-0">
            {t('dashboard.pageCount', { count: pageCount })}
          </span>
        </div>
      </div>

      {/* 3-dot menu button */}
      <button
        aria-label="Project options"
        aria-haspopup="true"
        onClick={handleMenuToggle}
        className="absolute top-2 right-2 bg-bg/70 rounded-md p-1 border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-text-primary"
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
