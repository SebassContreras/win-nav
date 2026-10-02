# 006 — mcp-adapter — Design

## Approach

Use `@modelcontextprotocol/sdk` to build standard MCP server in `src/mcp/server.ts`. Register core tools and dynamic screen flow tools derived from the loaded screen maps. Implement stdio transport handling with clean error encapsulation.

## Deliverables

- `src/mcp/server.ts`: MCP server setup and tool dispatch.
- `src/mcp/tools.ts`: Definitions for `win_snapshot`, `win_click`, `win_fill`, `win_qa`.
- `src/mcp/resources.ts`: Resource providers for screens and snapshots.
- `src/mcp/server.test.ts`: Integration test over stdio pipe.
