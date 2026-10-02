# 009 — visual-qa-screenshots — Design

## Approach

Use Win32 `PrintWindow` / GDI / Desktop Duplication API inside the native FlaUI worker to capture HWND pixel buffers into PNG streams. Expose `captureWindow` and `captureElement` methods over the JSON-RPC bridge.

## Deliverables

- `native/WinNav.Worker/ScreenshotHelper.cs`: GDI+ / Win32 image capture logic.
- `src/ops/screenshot.ts`: High level screenshot saving and path management.
- Unit tests validating image format and dimension consistency.
