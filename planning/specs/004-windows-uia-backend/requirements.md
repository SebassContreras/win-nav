# 004 — windows-uia-backend — Requirements

## What's being built

Native Windows UI Automation backend engine. Interfaces with Microsoft UI Automation (UIA3) using FlaUI / .NET 8 worker process. Supports process discovery (by PID or process name), window enumeration, cross-desktop attachment (`WinSta0\Default`), control hierarchy inspection, and native control patterns (InvokePattern, ValuePattern, SelectionItemPattern, TogglePattern).

## Who/what it serves

Provides the low-level communication bridge to native Windows Forms, WPF, WinUI, and embedded WebView2 controls for all high-level ops.

## Hard constraints

- Must handle isolated agent desktop environments by switching worker thread to `WinSta0\Default`.
- Must properly introspect nested child HWNDs (e.g. `Chrome_WidgetWin` for WebView2).
- Zero external drivers required (no WinAppDriver or Appium service required to be pre-installed).

## Acceptance criteria

1. Connects to running process (e.g. `Sigestran.exe`) and lists top-level windows.
2. Enumerates child controls with `AutomationId`, `Name`, `ControlType`, and bounding rects.
3. Invokes click and set text patterns on native buttons and text edits.

## Dependencies

Spec 002 (`nav-actions`).

## Owner split

All tasks agent-runnable.
