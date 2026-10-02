# Architecture

## Container

Local CLI + MCP stdio adapter driving native Windows applications over Microsoft UI Automation (UIA3 / FlaUI engine). No remote cloud dependency.

## Stack

| Decision | Choice | Why |
|---|---|---|
| Runtime | Node 22 LTS, ESM, TypeScript strict + .NET 8 (FlaUI.UIA3) | TypeScript for MCP/CLI ecosystem parity with `pwa-nav`; .NET 8 + FlaUI for native, high-performance Windows UI Automation |
| Package Manager | pnpm 11 | Fast, strict, ecosystem standard |
| Windows Automation Engine | Microsoft UI Automation (UIA3) via FlaUI | Deepest introspection into WinForms, WPF, WinUI, and embedded WebView2 without altering target application code |
| Velopack Integration | Automatic process resolution in `%LocalAppData%/<App>/current/` | Seamless discovery of Velopack-deployed desktop apps |
| Snapshot Contract | `{snapshotId, processId, windowTitle, windowHandle, elements[{ref, role, name, automationId, className, value, isEnabled}]}` | File + grep keeps context token footprint low; ephemeral `e1`, `e2` refs prevent stale interactions |
| Screen Map | `screens/<app>.screens.json`, validated by `schemas/screen-map.schema.json` (JSON Schema 2020-12); windows matched by title regex / Form AutomationId; semantic `@id` targets | Agents read screen capabilities in ~200 tokens without taking full snapshots |
| Interface | CLI (`win-nav attach`, `snapshot`, `click`, `fill`, `journey`) + MCP stdio adapter | Zero impedance between human command line and AI agents |
| Write Safety | Dry-run unless `--armed`; emergency kill-switch (`.agent/kill`); process allow-list (`.agent/allow.json`) | Protects against accidental destructive mutations and prompt injection |
| Cross-Desktop Bridge | Desktop thread attachment to `WinSta0\Default` | Ensures seamless automation even when agent executes in isolated runner desktops |
| Reference Base | [`pwa-nav`](https://github.com/SebassContreras/pwa-nav) | Identical operational model, error taxonomy, and QA loop |

## Conventions

TypeScript `strict: true`, `moduleResolution: nodenext`, `target: es2024`. All source code partitioned by Clean Architecture layers under `src/`:

| Layer | Directory | Responsibilities | Dependencies |
|---|---|---|---|
| Core Domain | `src/core/` | Snapshot data types, error taxonomy (`WinNavError`), security gates, ephemeral ref store | Zero I/O |
| Screens Subsystem | `src/screens/` | Screen map models, schema validation (Ajv), window matching, compact view renderer | `core` |
| Native Automation | `src/native/` | FlaUI / UIA3 bridge, process discovery, window enumeration, control inspection | `core` |
| Operations | `src/ops/` | High-level operations (`performSnapshot`, `performClick`, `performFill`, `performJourney`), QA engine | `core`, `screens`, `native` |
| CLI Adapter | `src/cli/` | Command line parser, output formatters, interactive commands | `core`, `screens`, `ops` |
| MCP Adapter | `src/mcp/` | Stdio MCP server, dynamic tool generation for desktop screens and journeys | `core`, `screens`, `ops` |
| Root Binaries | `src/` | CLI bin (`cli.ts`), MCP bin (`mcp.ts`), smoke tests (`smoke.ts`), library exports (`index.ts`) | Layers |

## Fixed rules

- Windows-native UI Automation only; zero pixel/coordinate hardcoding.
- Re-snapshot after every mutation; stale refs fail fast with exit code 3 (`stale_ref`).
- Dry-run by default: mutations require explicit `--armed`.
- Sensitive controls (`IsPassword == true`) are strictly blocked (exit code 11 `sensitive_target`).
- Docs and comments in English, user communication in Spanish.
