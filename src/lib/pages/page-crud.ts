import type { Page, Project } from '@/types/project';
import { FORMATS } from '@/constants/formats';

// ── addPage ───────────────────────────────────────────────────────────────────

/**
 * Appends a blank page to the project.
 * Pure function — no React, no sessionStorage side effects needed for add.
 */
export function addPage(project: Project): { updatedProject: Project; newPageIndex: number } {
  const newPage: Page = {
    id: crypto.randomUUID(),
    elements: [],
    background: '#FFFFFF',
  };

  const updatedPages = [...project.pages, newPage];
  const newPageIndex = updatedPages.length - 1;

  return {
    updatedProject: { ...project, pages: updatedPages, currentPageIndex: newPageIndex },
    newPageIndex,
  };
}

// ── duplicatePage ─────────────────────────────────────────────────────────────

/**
 * Duplicates a page at sourceIndex, inserting the copy immediately after.
 * Copies sessionStorage content for the duplicated page.
 */
export function duplicatePage(
  project: Project,
  sourceIndex: number,
  projectId: string
): { updatedProject: Project; newPageIndex: number } {
  const sourcePage = project.pages[sourceIndex];
  if (!sourcePage) throw new Error(`No page at index ${sourceIndex}`);

  const sourceKey = `dessy-generated-page-${projectId}-${sourceIndex}`;
  const sourceJson = sessionStorage.getItem(sourceKey);

  const newPage: Page = {
    id: crypto.randomUUID(),
    elements: [...sourcePage.elements],
    background: sourcePage.background,
  };

  const insertIndex = sourceIndex + 1;
  const newPages = [...project.pages];
  newPages.splice(insertIndex, 0, newPage);

  // Shift sessionStorage keys forward from the end down to insertIndex
  for (let i = newPages.length - 1; i > insertIndex; i--) {
    const prevKey = `dessy-generated-page-${projectId}-${i - 1}`;
    const nextKey = `dessy-generated-page-${projectId}-${i}`;
    const data = sessionStorage.getItem(prevKey);
    if (data) {
      sessionStorage.setItem(nextKey, data);
    } else {
      sessionStorage.removeItem(nextKey);
    }
  }

  // Write duplicated page JSON at the insert position
  if (sourceJson) {
    sessionStorage.setItem(`dessy-generated-page-${projectId}-${insertIndex}`, sourceJson);
  } else {
    sessionStorage.removeItem(`dessy-generated-page-${projectId}-${insertIndex}`);
  }

  return {
    updatedProject: { ...project, pages: newPages, currentPageIndex: insertIndex },
    newPageIndex: insertIndex,
  };
}

// ── deletePage ────────────────────────────────────────────────────────────────

/**
 * Deletes the page at pageIndex with full sessionStorage key remapping.
 * Throws if it would remove the last page.
 */
export function deletePage(
  project: Project,
  pageIndex: number,
  projectId: string
): { updatedProject: Project; newCurrentIndex: number } {
  if (project.pages.length <= 1) {
    throw new Error('Cannot delete the last page');
  }

  const newPages = project.pages.filter((_, i) => i !== pageIndex);

  // Remove sessionStorage key for the deleted page
  sessionStorage.removeItem(`dessy-generated-page-${projectId}-${pageIndex}`);

  // Remap all sessionStorage keys after the deleted index (shift down by 1)
  for (let i = pageIndex; i < project.pages.length - 1; i++) {
    const next = sessionStorage.getItem(`dessy-generated-page-${projectId}-${i + 1}`);
    if (next) {
      sessionStorage.setItem(`dessy-generated-page-${projectId}-${i}`, next);
    } else {
      sessionStorage.removeItem(`dessy-generated-page-${projectId}-${i}`);
    }
  }
  // Clean up the trailing key (last old index)
  sessionStorage.removeItem(`dessy-generated-page-${projectId}-${project.pages.length - 1}`);

  const newCurrentIndex = Math.min(pageIndex, newPages.length - 1);

  return {
    updatedProject: { ...project, pages: newPages, currentPageIndex: newCurrentIndex },
    newCurrentIndex,
  };
}

// ── reorderPages ──────────────────────────────────────────────────────────────

/**
 * Moves a page from fromIndex to toIndex, fully rewriting sessionStorage keys.
 */
export function reorderPages(
  project: Project,
  fromIndex: number,
  toIndex: number,
  projectId: string
): Project {
  if (fromIndex === toIndex) return project;

  // Read ALL page JSONs before reorder
  const pageJsons: (string | null)[] = project.pages.map((_, i) =>
    sessionStorage.getItem(`dessy-generated-page-${projectId}-${i}`)
  );

  const newPages = [...project.pages];
  const [moved] = newPages.splice(fromIndex, 1);
  newPages.splice(toIndex, 0, moved);

  // Reorder JSONs the same way
  const newJsons = [...pageJsons];
  const [movedJson] = newJsons.splice(fromIndex, 1);
  newJsons.splice(toIndex, 0, movedJson);

  // Re-write all sessionStorage keys in new order
  newJsons.forEach((json, i) => {
    const key = `dessy-generated-page-${projectId}-${i}`;
    if (json) {
      sessionStorage.setItem(key, json);
    } else {
      sessionStorage.removeItem(key);
    }
  });

  // Update currentPageIndex if it was the moved page
  let newCurrentIndex = project.currentPageIndex;
  if (project.currentPageIndex === fromIndex) {
    newCurrentIndex = toIndex;
  } else if (project.currentPageIndex > fromIndex && project.currentPageIndex <= toIndex) {
    newCurrentIndex = project.currentPageIndex - 1;
  } else if (project.currentPageIndex < fromIndex && project.currentPageIndex >= toIndex) {
    newCurrentIndex = project.currentPageIndex + 1;
  }

  return { ...project, pages: newPages, currentPageIndex: newCurrentIndex };
}

// ── ensureFormatPageCount ─────────────────────────────────────────────────────

/**
 * Ensures the project has the required page count for its format.
 * Adds blank pages if needed. Never removes pages.
 */
export function ensureFormatPageCount(project: Project): Project {
  const format = FORMATS[project.meta.format];
  if (!format) return project; // custom or unknown format — leave unchanged

  const required = format.pages;
  if (project.pages.length >= required) return project;

  const additionalPages: Page[] = Array.from(
    { length: required - project.pages.length },
    () => ({
      id: crypto.randomUUID(),
      elements: [],
      background: '#FFFFFF',
    })
  );

  return {
    ...project,
    pages: [...project.pages, ...additionalPages],
  };
}
