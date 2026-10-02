# 006 — mcp-adapter — Requirements

## What's being built

Model Context Protocol (MCP) stdio server adapter (`win-nav-mcp`). Exposes tools: `win_snapshot`, `win_click`, `win_fill`, `win_qa`, `win_learn`, and dynamic tools for screen flows and user journeys. Exposes resources: `win://screens`, `win://snapshot`.

## Who/what it serves

Connects Claude Desktop, Antigravity CLI/IDE, Cursor, and any MCP-compatible AI agent directly to live Windows desktop applications.

## Hard constraints

- Stdio protocol must remain completely clean; all internal diagnostics go to stderr.
- Mutating tools require explicit `armed: true` argument.
- Sensitive fields and kill-switch restrictions apply identically to MCP tool calls.

## Acceptance criteria

1. MCP server starts on stdio, completes handshake, and lists available tools.
2. `win_snapshot` returns interactive controls and updates snapshot resource.
3. `win_click` and `win_fill` enforce dry-run unless `armed: true`.

## Dependencies

Specs 004 (`windows-uia-backend`) and 005 (`screen-map`).

## Owner split

All tasks agent-runnable.
