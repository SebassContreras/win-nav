# win-nav

> **Stable CLI + MCP bridge for fluid QA testing and lawful, assisted desktop automation on native Windows applications (Windows Forms .NET 8, WPF, WinUI 3, and hybrid apps with WebView2, packaged via Velopack) via Microsoft UI Automation.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node: 22 LTS](https://img.shields.io/badge/Node-22_LTS-green.svg)](https://nodejs.org/)
[![.NET: 8.0](https://img.shields.io/badge/.NET-8.0-purple.svg)](https://dotnet.microsoft.com/)
[![Windows UI Automation](https://img.shields.io/badge/Platform-Windows_UIA3-0078D6.svg)](https://learn.microsoft.com/en-us/windows/win32/winauto/entry-uiauto-win32)

---

## 🔗 Sister Project Reference

`win-nav` is the Windows Desktop counterpart to [**`pwa-nav`**](https://github.com/SebassContreras/pwa-nav) (designed for Firefox PWAs).

Both projects share the exact same clean design patterns, JSON Schema 2020-12 contracts, ephemeral `eN` snapshot references, semantic `@id` targets, dry-run safety gates, and MCP stdio tool interfaces. If you already know how to drive `pwa-nav` for web apps, you already know how to drive `win-nav` for native desktop software.

---

## 💡 Why win-nav?

Classic desktop automation tools rely on:
- **Fragile pixel coordinates**: Breaks immediately on display scaling (DPI 125%/150%), resolution changes, or OS theme shifts.
- **Slow, unreliable OCR**: High token overhead, prone to misreading text.
- **External heavyweight drivers**: WinAppDriver / Appium requiring complex setup, elevation, or developer mode.

**`win-nav` takes a better path**:
1. **Direct UI Automation (UIA3 / FlaUI)**: Attaches directly to the application's native accessibility tree. Reads real `AutomationId`, `Name`, `ControlType`, and patterns without modifying the target application.
2. **Velopack-Native**: Seamlessly detects and resolves apps installed under `%LocalAppData%\<App>\current\<App>.exe`.
3. **Traverses Embedded WebViews**: Interacts effortlessly with embedded Chromium / Microsoft Edge WebView2 controls inside desktop forms.
4. **Token-Efficient Screen Maps**: Pre-mapped windows expose clean semantic `@id` targets (`@BtnAbrirTicket`), allowing agents to operate in ~200 tokens per action without taking full DOM/UIA trees.
5. **Dry-Run by Default**: Safe pair-programming; all mutations require explicit `--armed` approval.

---

## 🔍 Live-Verified Example (Velopack & WinForms)

`win-nav` has been validated against real enterprise .NET 8 Windows Forms applications packaged with Velopack (such as `Sigestran.exe`). Here is a real sample of controls extracted in milliseconds via UI Automation:

```
Type            AutomationId         Name                 ClassName
----            ------------         ----                 ---------
Button          BtnAbrirTicket       BtnAbrirTicket       C1.Win.Input.C1Button
Button          BtnTicketsPendientes BtnTicketsPendientes C1.Win.Input.C1Button
Button          BtnControlTower      BtnControlTower      C1.Win.Input.C1Button
Button          BtnRefreshCashe      BtnRefreshCashe      C1.Win.Input.C1Button
Pane            CbSelectUser                              WindowsForms10.Window...
  └ Edit        Search                                    WindowsForms10.Edit
  └ Button      BtnDropDown                               WindowsForms10.Button
Pane            Manual Usuario       Manual Usuario       Chrome_WidgetWin_1 (WebView2)
  └ Hyperlink                        Logo Manual Usuario  BrowserRootView
```

---

## 🚀 Quick Start

### Prerequisites
- Windows 10/11
- Node.js 22 LTS
- .NET 8 SDK / Runtime

### Installation
```bash
git clone https://github.com/SebassContreras/win-nav.git
cd win-nav
pnpm install
pnpm build
```

---

## 🛠️ CLI Usage

### 1. Interactive Snapshot Loop (Exploration)
Capture active controls into `.agent/snapshot.json`:
```powershell
# Snapshot active process
win-nav snapshot -p Sigestran -i

# Inspect available controls (e1, e2, ...)
# Click an element (dry-run preview)
win-nav click e1

# Armed execution (actually executes click)
win-nav click e1 --armed
```

### 2. Screen Map Navigation (Semantic)
Drive known screens using declarative `@id` selectors:
```powershell
# Inspect current window capabilities (~200 tokens)
win-nav snapshot --screen

# Click semantic button
win-nav click '@BtnAbrirTicket' --armed

# Fill text into an edit field
win-nav fill '@Search' "administrador" --armed

# Run a declarative multi-window journey
win-nav journey nuevo-ticket usuario="Juan" --armed
```

> **PowerShell Tip**: Always wrap semantic targets in single quotes (`'@BtnAbrirTicket'`) to prevent PowerShell from interpreting `@` as a splatting variable.

---

## 🤖 Model Context Protocol (MCP) Server

Connect `win-nav` directly to Claude Desktop, Antigravity, Cursor, or any MCP client.

### Configuration (`mcpServers`)
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

### Exposed MCP Tools
- `win_snapshot`: Captures interactive UI elements for a target window.
- `win_click`: Clicks control by ref (`e1`) or semantic ID (`@id`), requiring `armed: true`.
- `win_fill`: Types text into an edit box or combo.
- `win_qa`: Evaluates assertions (`assert:visible`, `assert:text`).
- `win_learn`: Learns a new window and adds it to `screens/<app>.screens.json`.

---

## 🔒 Safety & Security

- **Strict Dry-Run Default**: Mutations require explicit `--armed` flag.
- **Sensitive Fields Barrier**: Password controls (`IsPassword == true`) throw exit code 11 (`sensitive_target`) and instruct the user to type them manually.
- **Emergency Kill-Switch**: The presence of file `.agent/kill` or env `WIN_NAV_KILL_SWITCH` immediately terminates execution (exit code 7).
- **Process Allow-List**: Navigation and attachment are gated by `.agent/allow.json` (exit code 6).

---

## 📋 Exit Codes

| Exit Code | Code Name | Description |
|:---:|---|---|
| `0` | `ok` | Command completed successfully. |
| `1` | `failure` | Operation or QA assertion failed. |
| `2` | `invalid_args` | Missing or malformed CLI arguments. |
| `3` | `stale_ref` | Snapshot expired. Re-run `win-nav snapshot -i`. |
| `4` | `no_window` | Target window or process not found. |
| `6` | `origin_blocked` | Process not allow-listed in `.agent/allow.json`. |
| `7` | `kill_switch` | Emergency kill switch active (`.agent/kill`). |
| `8` | `not_actionable` | Control disabled, hidden, or offscreen. |
| `9` | `timeout` | Action or window settle timed out. |
| `11` | `sensitive_target` | Sensitive password field requested. Fill manually. |
| `12` | `unknown_target` | Semantic `@id` not found in Screen Map. |
| `13` | `unmapped_screen` | Active window not mapped; run `snapshot --learn`. |
| `14` | `journey_step_failed` | Multi-window transition assertion failed. |

---

## 📄 License

MIT © [Sebastian Contreras](https://github.com/SebassContreras)
