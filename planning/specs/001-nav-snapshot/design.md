# 001 — nav-snapshot — Design

## Approach

Model snapshot contracts in `src/core/snapshot.ts` with strict TypeScript types. Implement an in-memory `RefStore` that maps `e1`, `e2` to underlying desktop element identifiers (`automationId`, `name`, `controlType`, `handle`). Expose `SnapshotManager` to write `.agent/snapshot.json` and validate snapshot freshness.

## Deliverables

- `src/core/snapshot.ts`: TypeScript contracts for `DesktopSnapshot`, `DesktopElement`, `SnapshotManager`.
- `src/core/ref-store.ts`: Thread-safe ref generator, validator, and invalidator.
- `src/core/errors.ts`: `WinNavError` hierarchy and numeric exit codes (0–14).
- Unit tests verifying snapshot persistence and stale ref rejection.

## Sequencing

Foundational domain model; all subsequent specs depend on these types.
