# 009 — visual-qa-screenshots — Requirements

## What's being built

Window and control screenshot capture subsystem (`win-nav screenshot`). Captures target HWND or specific control bounding box into `.agent/evidence/<timestamp>-<name>.png`.

## Who/what it serves

Provides visual evidence for QA test runs, visual regression checks, and debugging information for AI agents.

## Hard constraints

- Does not capture sensitive password controls (blanked out with black rectangle).
- Output files stored exclusively under `.agent/evidence/`.

## Acceptance criteria

1. `win-nav screenshot` saves PNG of active window.
2. `win-nav screenshot @target` crops to specific control bounding box.

## Dependencies

Specs 003 (`qa-loop`) and 004 (`windows-uia-backend`).

## Owner split

All tasks agent-runnable.
