# 002 — nav-actions — Design

## Approach

Implement action pipeline in `src/core/actions.ts` and `src/core/security-gate.ts`. Each action receives target locator, validates against `SecurityGate`, checks dry-run flag, delegates execution to backend adapter, and invalidates snapshot refs upon successful armed execution.

## Deliverables

- `src/core/security-gate.ts`: Verification of kill-switch, allow-list, and sensitive fields.
- `src/core/actions.ts`: Action dispatchers for click, fill, select.
- `src/core/security-gate.test.ts`: Unit tests verifying dry-run safety and security aborts.
