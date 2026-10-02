# 007 — multi-screen-flows — Design

## Approach

Implement journey executor in `src/ops/journey.ts`. For each step: resolve active screen, execute step action, wait for UI quiet/settle period (detecting new dialogs or window focus changes), and assert target window matches `expectScreen`.

## Deliverables

- `src/ops/journey.ts`: Multi-window journey execution logic.
- `src/screens/journey.ts`: Journey model definitions and validation.
- Unit and integration tests covering multi-window transitions.
