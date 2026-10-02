# 010 — velopack-process-lifecycle — Design

## Approach

Implement Velopack resolver in `src/native/velopack.ts`. Scans `%LocalAppData%` for matching directory structure (`<AppName>/current/<AppName>.exe` or `packages.json`). Tracks process tree using Win32 Job Objects or process hierarchy enumeration (`Win32_Process`) to attach to the main UI thread.

## Deliverables

- `src/native/velopack.ts`: Velopack application locator and process launcher.
- Integration tests verifying discovery and process tracking.
