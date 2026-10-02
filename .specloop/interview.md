# Interview Ledger — win-nav

| dimension | status | answer summary or skip reason |
|---|---|---|
| idea-detail | covered | Stable CLI + MCP bridge for QA testing and lawful assisted desktop automation on native Windows apps (WinForms, WPF, WinUI 3, packaged via Velopack), attaching directly over Microsoft UI Automation (UIA3 / FlaUI). |
| project-type | covered | software — Windows desktop automation CLI + MCP server (Node.js 22 LTS / TypeScript strict + .NET 8 FlaUI / UIA3 automation engine) |
| goal | covered | Provide an autonomous agent and QA bridge for Windows desktop applications (Windows Forms, WPF, Velopack-packaged apps) with semantic Screen Maps, interactive snapshots, multi-screen journeys, and dry-run safety gates, mirroring pwa-nav's architecture. |
| audience | covered | Solo developers, dev teams, and autonomous AI coding agents (Claude, Cursor, Antigravity) pair-programming on Windows desktop apps. |
| mvp | covered | CLI and MCP stdio tools for process discovery/attachment, interactive desktop snapshot (UIAutomation elements tree with stable eN refs), semantic click/fill actions, dry-run safety gate, screen map validation and execution. |
| done-when | covered | Agent can attach to a Velopack-packaged WinForms app (like Sigestran), extract interactive UI controls, navigate multi-window journeys, execute semantic actions (@id), and verify QA assertions via CLI and MCP. |
| constraints-hard | covered | Windows OS required for native UIA execution; lawful automation on user's own session; sensitive fields blocked; dry-run by default unless --armed; emergency kill-switch; no mouse coordinate hardcoding. |
| stakeholders | covered | Developer (Sebastian Contreras) & AI assistant agents. |
| automatability | covered | Fully automatable via CLI commands and MCP stdio tools. |
