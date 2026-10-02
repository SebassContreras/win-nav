# Styles & Preferences

## Code Conventions

- **Language & Runtime**: TypeScript strict mode, Node 22 ESM (`"type": "module"`). Native worker in .NET 8 (C# 12).
- **Architecture**: Clean Architecture under `src/` (Core, Screens, Native, Ops, CLI, MCP).
- **Error Handling**: Custom typed hierarchy extending `WinNavError` with standard numeric exit codes (0 to 14).
- **Async Pattern**: Native async/await with clean cancellation tokens and process disposal in `finally` blocks.
- **Testing**: Vitest for TypeScript unit/integration tests; xUnit for .NET native components.

## Documentation & Tone

- **Code Comments & Docs**: Strictly English.
- **User Communication**: Spanish (as configured in `.specloop/loop.config.json`).
- **CLI Output Format**: Human-readable colorized table output for interactive terminals; machine-readable JSON when `--json` flag is provided.
