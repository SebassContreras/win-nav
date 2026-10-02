# 010 — velopack-process-lifecycle — Requirements

## What's being built

Automatic discovery, launching, and lifecycle management for Velopack-packaged desktop applications. Resolves installed applications under `%LocalAppData%/<AppName>/current/`, handles Velopack stub launchers, tracks spawned child processes (including renderer and WebView2 child PIDs), and attaches to the primary user interface window.

## Who/what it serves

Developers and agents working with Velopack-deployed .NET apps, eliminating the need to manually lookup PIDs or exact installation directories.

## Hard constraints

- Must detect and distinguish parent launcher stubs from the actual application process.
- Must support launching applications with custom arguments or attaching to existing running instances.

## Acceptance criteria

1. `win-nav attach <AppName>` discovers executable in `%LocalAppData%/<AppName>/current/<AppName>.exe` if not already running.
2. Resolves correct main UI window even when the application runs background worker processes or embedded WebView2 instances.

## Dependencies

Spec 004 (`windows-uia-backend`).

## Owner split

All tasks agent-runnable.
