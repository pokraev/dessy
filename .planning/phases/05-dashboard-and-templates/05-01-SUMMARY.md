---
phase: 05-dashboard-and-templates
plan: 01
subsystem: ui
tags: [zustand, idb, indexeddb, i18n, localStorage, typescript]

requires:
  - phase: 02-editor-surface
    provides: projectStorage, imageDb pattern, editorStore pattern
  - phase: 04-ai-promptcrafter
    provides: appStore dependency chain context

provides:
  - appStore with currentView (dashboard|editor) and openProject/goToDashboard/createNewProject actions
  - thumbnailDb IndexedDB CRUD (saveThumbnail/getThumbnail/deleteThumbnail) keyed by projectId
  - projectStorage.duplicateProject and projectStorage.updateProjectName
  - relativeTime utility using Intl.RelativeTimeFormat
  - Complete dashboard i18n namespace in en.json and bg.json (28 keys each)
  - Wave 0 test stubs for projectStorage, templates-index, and thumbnailDb

affects: [05-02, 05-03, 05-04]

tech-stack:
  added: []
  patterns:
    - "IndexedDB stores follow imageDb.ts pattern: openDB with window guard, per-key CRUD"
    - "Zustand stores follow editorStore.ts pattern: create<State>(set => ({...}))"
    - "i18n namespaces added as siblings to existing top-level keys in en.json/bg.json"
    - "relativeTime uses Intl.RelativeTimeFormat with second/minute/hour/day thresholds"

key-files:
  created:
    - src/stores/appStore.ts
    - src/lib/storage/thumbnailDb.ts
    - src/lib/utils/relativeTime.ts
    - src/lib/storage/__tests__/thumbnailDb.test.ts
    - src/lib/templates/__tests__/templates-index.test.ts
  modified:
    - src/lib/storage/projectStorage.ts
    - src/i18n/en.json
    - src/i18n/bg.json
    - src/lib/storage/__tests__/projectStorage.test.ts

key-decisions:
  - "thumbnailDb stores blobs via fetch(dataUrl).then(r=>r.blob()) — avoids base64 in IndexedDB"
  - "relativeTime uses module-level Intl.RelativeTimeFormat instance for performance"
  - "duplicateProject uses crypto.randomUUID() for new ID, sets fresh ISO timestamps"
  - "appStore currentView starts as 'dashboard' — dashboard is the entry point"

patterns-established:
  - "Wave 0 stubs: it.todo() for unimplemented, it('stub passes') for immediate green"
  - "Wave 0 stubs appended to existing test files rather than replacing them"

requirements-completed: [DASH-01, DASH-02, DASH-03]

duration: 8min
completed: 2026-03-29
---

# Phase 5 Plan 01: Dashboard Foundation Summary

**Zustand appStore for view switching, IndexedDB thumbnailDb, projectStorage duplicate/rename, relativeTime utility, and complete dashboard i18n namespace (28 keys) in EN + BG**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-29T22:41:37Z
- **Completed:** 2026-03-29T22:49:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- appStore provides currentView ('dashboard'|'editor') + activeProjectId with openProject/goToDashboard/createNewProject actions
- thumbnailDb uses idb openDB pattern (matching imageDb.ts) to store/retrieve/delete PNG blobs keyed by projectId
- projectStorage extended with duplicateProject (returns new UUID or null) and updateProjectName (returns bool)
- relativeTime formats ISO dates as human-readable relative strings using Intl.RelativeTimeFormat
- Both i18n files have complete 28-key dashboard namespace covering all UI strings
- Wave 0 test stubs created for projectStorage (duplicateProject/updateProjectName todos), templates-index, and thumbnailDb

## Task Commits

1. **Task 0: Wave 0 test stubs** - `d93a1f1` (test)
2. **Task 1: appStore, thumbnailDb, relativeTime** - `efabecb` (feat)
3. **Task 2: projectStorage extensions + i18n** - `abda1d3` (feat)

## Files Created/Modified
- `src/stores/appStore.ts` - View-switching Zustand store (currentView, activeProjectId, actions)
- `src/lib/storage/thumbnailDb.ts` - IndexedDB thumbnail CRUD via idb, guards for SSR
- `src/lib/utils/relativeTime.ts` - Intl.RelativeTimeFormat-based relative date formatting
- `src/lib/storage/projectStorage.ts` - Added duplicateProject and updateProjectName
- `src/i18n/en.json` - Added 28-key dashboard namespace
- `src/i18n/bg.json` - Added 28-key dashboard namespace (Bulgarian)
- `src/lib/storage/__tests__/projectStorage.test.ts` - Added todo stubs for new functions
- `src/lib/storage/__tests__/thumbnailDb.test.ts` - Wave 0 stubs
- `src/lib/templates/__tests__/templates-index.test.ts` - Wave 0 stubs

## Decisions Made
- thumbnailDb stores blobs (not base64 strings) by converting dataUrl via `fetch(dataUrl).then(r=>r.blob())` — consistent with imageDb approach and avoids large IndexedDB values
- relativeTime creates Intl.RelativeTimeFormat at module level (not per-call) for performance
- duplicateProject uses `crypto.randomUUID()` for new ID — consistent with existing project creation patterns
- appStore initializes to 'dashboard' view — dashboard is the application entry point

## Deviations from Plan

**1. [Rule 2 - Missing] projectStorage.test.ts already existed with full tests**
- **Found during:** Task 0
- **Issue:** File had complete tests for saveProject/loadProject/listProjects/deleteProject; plan specified creating from scratch with stub content
- **Fix:** Appended duplicateProject and updateProjectName todo stubs to existing file rather than replacing it — preserves existing test coverage
- **Files modified:** src/lib/storage/__tests__/projectStorage.test.ts
- **Verification:** `npx jest --testPathPatterns="projectStorage"` passes with 14 tests (7 passing + 7 todo)

---

**Total deviations:** 1 auto-fixed (Rule 2 - preserve existing test coverage)
**Impact on plan:** No scope creep. Existing tests kept; new stubs added as required.

## Issues Encountered
- Pre-existing test failures in `src/lib/__tests__/element-factory.test.ts` and `src/hooks/__tests__/useHistory.test.ts` (module resolution issues) — confirmed pre-existing via git stash check, not caused by this plan.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All foundation modules ready for Plans 02 and 03 to execute in parallel
- appStore, thumbnailDb, projectStorage extensions, relativeTime, i18n all available
- Wave 0 stubs established; Plan 03 can flesh out real assertions

---
*Phase: 05-dashboard-and-templates*
*Completed: 2026-03-29*
