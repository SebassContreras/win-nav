# 004 — windows-uia-backend — Tasks

Status legend: `todo` · `in_progress` · `blocked` · `interrupted` · `done`
Owner: `agent` (loop-runnable) · `human` (skipped by the loop)

- [ ] T001 [agent] [status:todo] Scaffold `native/WinNav.Worker` with .NET 8, `FlaUI.Core`, and `FlaUI.UIA3`.
- [ ] T002 [agent] [status:todo] Implement cross-desktop attachment to `WinSta0\Default` in worker.
- [ ] T003 [agent] [status:todo] Implement JSON-RPC command handlers in worker for process discovery, control tree dump, and pattern invocation.
- [ ] T004 [agent] [status:todo] Implement `src/native/uia-bridge.ts` in Node.js to manage the worker lifecycle and communicate over stdio.
- [ ] T005 [agent] [status:todo] Add integration test in `src/native/uia-bridge.test.ts` connecting to native window.
