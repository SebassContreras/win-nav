# 004 — windows-uia-backend — Tasks

Status legend: `todo` · `in_progress` · `blocked` · `interrupted` · `done`
Owner: `agent` (loop-runnable) · `human` (skipped by the loop)

- [x] T001 [agent] [status:done] Scaffold `native/WinNav.Worker` with .NET 8, `FlaUI.Core`, and `FlaUI.UIA3`.
      └─ Created native/WinNav.Worker targeting net8.0-windows with FlaUI.UIA3 5.0.0; builds with 0 errors.
- [x] T002 [agent] [status:done] Implement cross-desktop attachment to `WinSta0\Default` in worker.
      └─ Implemented DesktopHelper.SwitchToDefaultDesktop via Win32 user32 OpenDesktop/SetThreadDesktop.
- [x] T003 [agent] [status:done] Implement JSON-RPC command handlers in worker for process discovery, control tree dump, and pattern invocation.
      └─ Implemented ping, findProcesses, getWindows, getTree, and invokeAction handlers in WinNav.Worker.
- [x] T004 [agent] [status:done] Implement `src/native/uia-bridge.ts` in Node.js to manage the worker lifecycle and communicate over stdio.
      └─ Implemented UiaBridge managing .NET worker process, JSON-RPC protocol over stdio, and ActionDriver conformance.
- [x] T005 [agent] [status:done] Add integration test in `src/native/uia-bridge.test.ts` connecting to native window.
      └─ Added integration tests in src/native/uia-bridge.test.ts testing ping, process discovery, window enumeration, and desktop tree snapshots; all 4 passed.
