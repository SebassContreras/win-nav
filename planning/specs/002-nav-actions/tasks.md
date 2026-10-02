# 002 — nav-actions — Tasks

Status legend: `todo` · `in_progress` · `blocked` · `interrupted` · `done`
Owner: `agent` (loop-runnable) · `human` (skipped by the loop)

- [x] T001 [agent] [status:done] Implement `src/core/security-gate.ts` checking kill-switch, allow-list, and sensitive fields.
      └─ Implemented SecurityGate with kill-switch, allow-list, sensitive field assertions, and exit codes.
- [x] T002 [agent] [status:done] Implement `src/core/actions.ts` with dry-run evaluation and armed dispatch.
      └─ Implemented ActionExecutor supporting click, fill, select, toggle, invoke, dry-run previews, and armed ref invalidation.
- [x] T003 [agent] [status:done] Add unit tests in `src/core/security-gate.test.ts` for armed vs dry-run, kill switch, and sensitive blocking.
      └─ Added 9 tests in `src/core/security-gate.test.ts` covering kill switch, allow-list, password barrier, dry-run vs armed, and disabled checks; all passed.
