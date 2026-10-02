# MCP Server Configuration

`win-nav` runs as a standard Model Context Protocol (MCP) server over `stdio`.

## Integration with Claude Desktop / Cursor / Antigravity

Add `win-nav` to your `mcpServers` configuration:

```json
{
  "mcpServers": {
    "win-nav": {
      "command": "node",
      "args": ["C:/Users/scontreras/Documents/GitHub/win-nav/dist/mcp.js"]
    }
  }
}
```

## Available Tools

- `win_snapshot`: Captures interactive UI elements for a target window or process.
- `win_click`: Clicks an element by ephemeral ref (`e1`) or semantic `@id` (dry-run unless `armed: true`).
- `win_fill`: Fills text into an input or edit box (dry-run unless `armed: true`).
- `win_qa`: Evaluates assertions against active window state.
- `win_learn`: Generates or updates a Screen Map from the active window.
- Dynamic journey tools generated automatically from loaded screen maps.
