# 007 — multi-screen-flows — Requirements

## What's being built

Multi-window User Journey engine (`win-nav journey <name>`). Executes declarative multi-step workflows across desktop dialogs, popups, and windows. Waits for UI settle after mutations, asserts that the resulting active window matches `expectScreen`, and fails fast with code 14 (`journey_step_failed`) if window transitions drift.

## Who/what it serves

Enables end-to-end automation of complex desktop workflows (e.g. opening a ticket modal, filling customer information, clicking save, and asserting return to main dashboard).

## Hard constraints

- Each step must settle and verify window transition before executing subsequent step.
- Journeys containing `humanOnly: true` or sensitive steps refuse armed execution.

## Acceptance criteria

1. Executes sequential journey steps across separate HWNDs / modal dialogs.
2. Asserts `expectScreen` matches current window title/form after each step.
3. Aborts with exit code 14 on transition mismatch.

## Dependencies

Specs 004 (`windows-uia-backend`) and 005 (`screen-map`).

## Owner split

All tasks agent-runnable.
