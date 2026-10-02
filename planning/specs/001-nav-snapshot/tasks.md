# 001 — nav-snapshot — Tasks

Status legend: `todo` · `in_progress` · `blocked` · `interrupted` · `done`
Owner: `agent` (loop-runnable) · `human` (skipped by the loop)

- [ ] T001 [agent] [status:todo] Create `src/core/errors.ts` defining `WinNavError` with standard exit codes (0 to 14).
- [ ] T002 [agent] [status:todo] Create `src/core/snapshot.ts` defining `DesktopSnapshot` and `DesktopElement` interfaces.
- [ ] T003 [agent] [status:todo] Implement `src/core/ref-store.ts` for managing ephemeral `eN` references and snapshot invalidation.
- [ ] T004 [agent] [status:todo] Add unit tests in `src/core/snapshot.test.ts` verifying ref generation, serialization to `.agent/snapshot.json`, and stale ref detection.
