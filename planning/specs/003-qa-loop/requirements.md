# 003 — qa-loop — Requirements

## What's being built

Declarative QA assertion engine (`win-nav qa`) for desktop applications. Evaluates assertions against active windows and controls (e.g. `assert:visible`, `assert:text`, `assert:enabled`, `assert:window-title`).

## Who/what it serves

Automated testing pipelines and agent verification loops asserting that desktop state reflects expected test outcomes.

## Hard constraints

- Assertions must not modify UI state.
- Exit code 0 on all assertions passing; exit code 1 on failure with clear structured diff.

## Acceptance criteria

1. Supports assertions: `assert:visible @target`, `assert:text @target "expected"`, `assert:enabled @target`.
2. Emits structured JSON reporting passed and failed checks.

## Dependencies

Spec 002 (`nav-actions`).

## Owner split

All tasks agent-runnable.
