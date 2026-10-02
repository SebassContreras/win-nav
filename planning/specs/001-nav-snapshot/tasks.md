# 001 — nav-snapshot — Tasks

Status legend: `todo` · `in_progress` · `blocked` · `interrupted` · `done`
Owner: `agent` (loop-runnable) · `human` (skipped by the loop)

- [x] T001 [agent] [status:done] Create `src/core/errors.ts` defining `WinNavError` with standard exit codes (0 to 14).
      └─ Implemented WinNavError, ExitCodes (0-14), and ErrorCodeMap.
- [x] T002 [agent] [status:done] Create `src/core/snapshot.ts` defining `DesktopSnapshot` and `DesktopElement` interfaces.
      └─ Implemented DesktopSnapshot, DesktopElement, and SnapshotManager with password sanitization.
- [x] T003 [agent] [status:done] Implement `src/core/ref-store.ts` for managing ephemeral `eN` references and snapshot invalidation.
      └─ Implemented RefStore with assignRefs, setSnapshot, resolveRef with stale ref check, and invalidate.
- [x] T004 [agent] [status:done] Add unit tests in `src/core/snapshot.test.ts` verifying ref generation, serialization to `.agent/snapshot.json`, and stale ref detection.
      └─ Added 6 tests in `src/core/snapshot.test.ts` covering RefStore, SnapshotManager, errors, and stale ref rejection; all passed.
