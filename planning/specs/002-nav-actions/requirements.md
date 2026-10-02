# 002 — nav-actions — Requirements

## What's being built

Semantic action execution engine supporting `click`, `fill`, `select`, `toggle`, and `invoke`. Implements dry-run preview by default and armed mutations via `--armed`. Integrates security gate (`.agent/kill` switch, `.agent/allow.json` process validation, password field barrier).

## Who/what it serves

Enables agents and human users to safely mutate desktop controls without risk of accidental execution or sensitive data leaks.

## Hard constraints

- Actions are strictly dry-run by default; `--armed` must be explicitly passed.
- Attempting to interact with sensitive controls (e.g. `IsPassword == true`) throws code 11 (`sensitive_target`).
- Presence of `.agent/kill` aborts any mutation immediately with code 7 (`kill_switch`).

## Acceptance criteria

1. `win-nav click e1` prints action preview without mutating when `--armed` is omitted.
2. `win-nav click e1 --armed` executes click through backend and invalidates previous snapshot.
3. Password fields reject automated input with exit code 11.

## Dependencies

Spec 001 (`nav-snapshot`).

## Owner split

All tasks agent-runnable.
