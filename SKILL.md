---
name: win-nav
description: >
  Autonomous QA, exploration, and assisted desktop automation playbook for AI coding agents
  driving native Windows applications (Windows Forms, WPF, WinUI, Velopack) via the win-nav CLI and MCP tools.
when_to_use: >
  Use when automating Windows desktop applications, running desktop QA tests, inspecting windows,
  or driving desktop forms and dialogs without brittle coordinate-based clicking.
---

# SKILL.md — win-nav Agent Playbook

`win-nav` allows AI coding agents to inspect, explore, and drive native Windows desktop applications using Microsoft UI Automation (UIA3) and declarative Screen Maps.

Sister project: [`pwa-nav`](https://github.com/SebassContreras/pwa-nav).

---

## 1. Safety & Execution Rules

1. **Dry-Run by Default**: All write actions (`click`, `fill`, `journey`) run in dry-run preview mode. You **must** present the planned action to the user and obtain explicit consent before running with `--armed` (or `armed: true` in MCP).
2. **Never Touch Passwords**: Fields with `sensitive: true` or `IsPassword == true` will reject automated input (exit code 11 `sensitive_target`). Instruct the user to type sensitive values manually.
3. **Emergency Kill-Switch**: The presence of file `.agent/kill` halts any armed mutation immediately (exit code 7 `kill_switch`).
4. **PowerShell Quoting**: Always quote `@id` targets in PowerShell to avoid splatting: `'@BtnAbrirTicket'`.

---

## 2. Navigation Loops

### A. Screen Map Navigation (Preferred for mapped applications)
1. **Inspect Current Window**:
   ```bash
   win-nav snapshot --screen
   ```
   Returns compact capabilities view (~200 tokens) with fields, buttons, and flows.
2. **Execute Semantic Action**:
   ```bash
   # Preview (Dry-run)
   win-nav click '@BtnAbrirTicket'
   # Armed (after user confirmation)
   win-nav click '@BtnAbrirTicket' --armed
   ```
3. **Multi-Window User Journey**:
   ```bash
   win-nav journey nuevo-ticket usuario="Juan" --armed
   ```

### B. Raw Snapshot Loop (For exploration and unmapped windows)
1. **Take Snapshot**:
   ```bash
   win-nav snapshot -p Sigestran -i
   ```
   Outputs summary and writes `.agent/snapshot.json`.
2. **Locate Target Ref**: Grep `.agent/snapshot.json` for target element (e.g. `e1`, `e2`). **Never paste full snapshot trees into context.**
3. **Mutate**:
   ```bash
   win-nav click --snapshot <id> e1 --armed
   ```
4. **Invalidation**: Armed mutations invalidate the snapshot. Stale refs fail fast (exit 3) — re-snapshot immediately.
5. **Learn Screen**: When on a stable window:
   ```bash
   win-nav snapshot --learn
   ```

---

## 3. Exit Codes Quick Reference

- `0` (`ok`): Success.
- `2` (`invalid_args`): Syntax or flag error.
- `3` (`stale_ref`): Snapshot expired. Re-run `win-nav snapshot -i`.
- `4` (`no_browser` / `no_window`): Target application window not found.
- `6` (`origin_blocked`): Target process not in `.agent/allow.json`.
- `7` (`kill_switch`): Emergency kill-switch active.
- `11` (`sensitive_target`): Password field blocked; ask user to fill manually.
- `12` (`unknown_target`): Target `@id` not found in screen map.
- `14` (`journey_step_failed`): Window transition mismatch in user journey.
