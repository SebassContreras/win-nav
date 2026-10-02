# Product

## What this is

`win-nav` is a stable CLI + MCP bridge for fluid QA testing and lawful, assisted desktop automation on native Windows applications (Windows Forms, WPF, WinUI 3, and hybrid apps with WebView2, packaged via Velopack, MSIX, or standard installers).

Instead of brittle pixel-based coordinates, OCR, or synthetic OS mouse jiggling, `win-nav` attaches directly to the user's running desktop application using Microsoft UI Automation (UIA3 / FlaUI engine). A declarative Screen Map schema allows AI agents to understand every window and control semantically, executing safe, verifiable user journeys across windows and dialogs.

Sister project to [`pwa-nav`](https://github.com/SebassContreras/pwa-nav) (for Firefox PWAs), sharing identical design patterns, snapshot contracts, semantic `@id` targets, and MCP tool protocols.

## Who uses it

Solo developers, dev teams, and autonomous AI coding agents (Claude, Antigravity, Cursor) testing or driving Windows desktop software.

## Out of scope

- Bypassing Windows UAC prompts or security dialogs automatically.
- Automating credential entry into fields marked `sensitive: true` (passwords, PINs, tokens).
- Cross-platform desktop (macOS / Linux); native Windows UI Automation is specifically tailored to Windows OS.
- Obfuscated games or DirectX/Vulkan-only framebuffers with zero accessibility metadata.
