# Handoff

## Current State

- **Roadmap Completion**: Specs **001**, **002**, **003**, **004**, and **005** are 100% complete with 38 passing unit/integration tests (`pnpm test`) and zero compilation errors (`pnpm build`).
  - Spec 001: Core snapshot models, `RefStore` ephemeral refs (`eN`), stale ref invalidation.
  - Spec 002: `SecurityGate`, allow-list (`.agent/allow.json`), kill-switch (`.agent/kill`), sensitive password barrier, dry-run by default.
  - Spec 003: Declarative QA assertions (`assert:visible`, `assert:text`, `assert:enabled`, `assert:window-title`).
  - Spec 004: Native .NET 8 / FlaUI.UIA3 worker bridge with `WinSta0\Default` desktop attachment, bounding point clicks, JSON-RPC stdio.
  - Spec 005: Screen Map subsystem (`src/screens/`), Ajv Draft 2020-12 validator, window matcher, compact view (~150 tokens), snapshot learner, and diacritic normalizer.
- **Live Sigestran Navigation**:
  - Attached to PID `6064` (`Sigestran.exe`).
  - Successfully differentiated native WinForms / ComponentOne Ribbon controls from embedded WebView2 user manual.
  - Executed two-step Ribbon activation: `RTTrafico` (TabItem) -> revealed `RBtnPizarra` (Button) -> clicked and opened MDI child window `Pizarra` (HWND `134070`).
  - Generated and validated [`screens/sigestran.screens.json`](../screens/sigestran.screens.json).
  - Documented enterprise WinForms and ComponentOne navigation patterns in [`docs/navigation-guide.md`](../docs/navigation-guide.md).

## Next Priorities

1. Spec 006 (`mcp-adapter`): Stdio MCP server exposing snapshot, click, fill, journey tools.
2. Spec 007 (`multi-screen-flows`): Multi-window journey runner and state machine across transitions.
