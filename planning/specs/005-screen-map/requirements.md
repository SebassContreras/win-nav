# 005 — screen-map — Requirements

## What's being built

Desktop Screen Map subsystem. Loads, validates (via JSON Schema Draft 2020-12), and queries `screens/<app>.screens.json`. Matches active window by `titlePattern` or `formName`, renders ultra-compact text view for LLM context, and resolves semantic `@id` targets to underlying UIA locators. Includes screen learning and merging (`win-nav snapshot --learn`).

## Who/what it serves

Allows agents to drive known desktop screens using high-level semantic IDs (`@BtnAbrirTicket`) without expensive DOM/UIA snapshots on every step.

## Hard constraints

- Screen map JSON files must strictly validate against `schemas/screen-map.schema.json`.
- Compact screen view must fit in ~200 tokens (reporting fields, actions, and flows).

## Acceptance criteria

1. Validates screen map files and fails fast on schema violations.
2. `win-nav snapshot --screen` identifies matching screen from active window and outputs compact text view.
3. Maps semantic targets (e.g. `@BtnControlTower`) to exact control locators.

## Dependencies

Spec 004 (`windows-uia-backend`).

## Owner split

All tasks agent-runnable.
