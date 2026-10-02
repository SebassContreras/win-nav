# 004 — windows-uia-backend — Design

## Approach

Implement native worker in .NET 8 (`native/WinNav.Worker`) using `FlaUI.UIA3`. The worker exposes a lightweight JSON-RPC interface over stdio to the Node.js TypeScript layer (`src/native/uia-bridge.ts`). Node.js spawns or attaches to the worker, sending commands: `findProcess`, `getTree`, `invokeAction`, `setText`.

## Deliverables

- `native/WinNav.Worker/`: .NET 8 C# project referencing `FlaUI.UIA3` with JSON-RPC stdio protocol.
- `src/native/uia-bridge.ts`: Node.js client managing the worker process and streaming UI Automation requests.
- `src/native/types.ts`: Protocol message contracts.
- Integration tests attaching to live Windows desktop window.
