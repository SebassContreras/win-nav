# 008 — desktop-dialogs — Requirements

## What's being built

Specialized handling for native Windows common dialogs: `OpenFileDialog`, `SaveFileDialog`, `MessageBox`, and print dialogs. Automatically identifies dialog window class (`#32770`), sets file paths safely without SendKeys timing issues, and clicks default/cancel buttons.

## Who/what it serves

Enables reliable automation and QA on file upload/download desktop dialogs and confirmation popups.

## Hard constraints

- File paths must be fully qualified absolute paths.
- File existence must be verified before typing into file open dialogs.

## Acceptance criteria

1. Detects `#32770` dialog windows attached to target process.
2. Interacts with file name edit box and presses Open/Save button.

## Dependencies

Spec 004 (`windows-uia-backend`).

## Owner split

All tasks agent-runnable.
