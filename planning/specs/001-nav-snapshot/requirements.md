# 001 — nav-snapshot — Requirements

## What's being built

Desktop snapshot contract, interactive element collector, ephemeral `eN` reference generator, and storage in `.agent/snapshot.json`. Given a running target Windows process or window title, captures all actionable controls (buttons, edits, combos, checkboxes, tabs, menuitems), assign unique ephemeral refs (`e1`, `e2`, ...), and emit structured JSON to stdout and disk.

## Who/what it serves

AI agents and QA engineers inspecting unmapped desktop screens without cluttering LLM context with full window hierarchies. Consumed by `002-nav-actions` and CLI commands.

## Hard constraints

- Ephemeral refs are valid only for the captured snapshot; any subsequent mutation invalidates the snapshot.
- Sensitive controls (`IsPassword == true`) must obscure values (`***`).
- Offscreen or hidden controls must be flagged or filtered to avoid false positives.

## Acceptance criteria

1. Calling `win-nav snapshot -p <ProcessName>` generates `.agent/snapshot.json` containing `snapshotId`, `processId`, `windowTitle`, and `elements` array.
2. Each element has `ref` (e.g. `e1`), `role` (e.g. `Button`), `name`, `automationId`, and `isEnabled`.
3. Stale snapshot ref usage fails fast with exit code 3 (`stale_ref`).

## Out of scope

- Direct control mutation (owned by `002-nav-actions`).
- Native FlaUI subprocess driver (owned by `004-windows-uia-backend`).

## Dependencies

None.

## Owner split

All tasks agent-runnable.
