# Desktop Navigation Guide: WinForms, ComponentOne & Real-World Apps

This guide consolidates the exact architecture, patterns, lessons learned, and operational playbooks discovered during live navigation sessions on native Windows desktop applications (specifically WinForms enterprise applications like **Sigestran**).

---

## 1. Application Topology: WinForms + ComponentOne

In legacy and modern enterprise .NET WinForms applications (e.g. Sigestran), the main window (`Menu Principal`) does not expose all actions in standard Win32 menus. Instead, it utilizes custom third-party UI suites such as **ComponentOne (C1) Studio for WinForms**.

### Layout Breakdown in `Menu Principal`

```
┌────────────────────────────────────────────────────────────────────────┐
│ Menu Principal (HWND: Main Window)                                     │
├────────────────────────────────────────────────────────────────────────┤
│ Panel Top: PnlRibon (Quick toolbar, y: 0 to 34)                        │
│   [BtnAbrirTicket] [BtnControlTower] [BtnTests] [BtnUsuario]           │
├────────────────────────────────────────────────────────────────────────┤
│ ComponentOne Ribbon: Menu (HWND: 15075886, y: 34 to 62)                │
│   Tabs: [RTParametrización] [RTMaestros] [RTTrafico] [RTFlota] ...     │
├────────────────────────────────────────────────────────────────────────┤
│ Contextual Ribbon Lower Bar (Appears when active tab is selected)       │
│   When RTTrafico is selected:                                          │
│   [RBtnPizarra] [RBtnInformes] [RBtnDietas] [RBtnDecaTrafico]           │
├────────────────────────────────────────────────────────────────────────┤
│ Main Workspace / MDI Client Area                                       │
│   - Embedded WebView2 (User manual / documentation viewer)             │
│   - Opened MDI Child Windows (e.g. HWND 134070: "Pizarra")             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Key Pitfalls & Solutions

### A. The WebView2 "False Positive" Trap
- **The Issue**: Many enterprise apps embed Microsoft Edge WebView2 controls for rendering documentation, web portals, or dashboards. If an agent performs a naive search or text grep for keywords (e.g. "Tráfico" or "Pizarra"), it will often find HTML elements inside the WebView2 DOM (such as user manual index links).
- **The Rule**: Always verify whether a control is inside a native container (`PnlRibon`, `Menu`, `Ribbon Tabs`) versus a WebView2 container (`WebView2`, `Chrome_WidgetWin_0`). Never try to click native application actions inside the web manual.

### B. Dynamic Contextual Ribbon Tabs
- **The Issue**: Buttons like `RBtnPizarra` do **not** exist in the active accessibility tree until their parent tab (`RTTrafico`) is activated/clicked!
- **The Solution (Two-Step Ribbon Navigation)**:
  1. Click the Ribbon Tab Item: `RTTrafico` (`automationId: "RTTrafico"`, `role: "TabItem"`).
  2. Settle (100–300 ms).
  3. Click the revealed contextual Ribbon Button: `RBtnPizarra` (`automationId: "RBtnPizarra"`, `role: "Button"`).
  This sequence is encapsulated in `screens/sigestran.screens.json` under `flow:abrir-pizarra-flow` and journey `abrir-pizarra`.

### C. MDI Child Windows vs Top-Level Windows
- **The Issue**: Clicking a ribbon button often does **not** create a new top-level window returned by `EnumWindows`. Instead, WinForms creates an **MDI child window** inside the main form.
- **The Solution**:
  - Enumerate child windows using `getchildwindows` on the main window handle.
  - The MDI window will appear with its own title (e.g., `title: "Pizarra"`, HWND `134070`).
  - Child elements (filters `Edit`, buttons `➕`, grids) reside within that child window handle.

### D. UIA3 / MSAA Property Access (`COMException`)
- **The Issue**: Directly invoking `.AutomationId` on raw unmanaged WinForms/MSAA controls can throw:
  ```
  FlaUI.Core.Exceptions.PropertyNotSupportedException: AutomationId [#30011] is not supported
  ```
- **The Solution**: In C# / FlaUI bridge code, always read properties safely:
  ```csharp
  string autoId = curr.Properties.AutomationId.ValueOrDefault ?? "";
  string name = curr.Properties.Name.ValueOrDefault ?? "";
  ```

### E. Diacritics and Character Normalization
- **The Issue**: Spanish enterprise applications use accented characters (`Tráfico`, `Facturación`, `Administración`). Direct string matches or slug conversions without unicode normalization create fragmented identifiers (e.g. `pizarra-de-tr-fico`).
- **The Solution**: Always normalize with NFD unicode decomposition:
  ```typescript
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  ```
  This cleanly maps `RTTrafico` and `Pizarra de Tráfico` to `tab-trafico` and `pizarra-de-trafico`.

### F. PowerShell Splatting
- In Windows PowerShell, unquoted `@name` is parsed as an empty splatting variable.
- Always quote semantic targets:
  ```powershell
  win-nav click '@tab-trafico'
  win-nav click '@btn-pizarra'
  ```

---

## 3. Screen Map Architecture Reference

All learned structures for Sigestran are stored in [`screens/sigestran.screens.json`](../screens/sigestran.screens.json) conforming to [`schemas/screen-map.schema.json`](../schemas/screen-map.schema.json).

### Navigating via Screen Map (Recommended)

1. **Inspect Screen**:
   ```bash
   win-nav snapshot --screen
   ```
   Renders ultra-compact view:
   ```text
   Screen: menu-principal [MainForm] (Pattern: "^Menu Principal.*")
   Actions:
     @tab-trafico [TabItem] "Tráfico" [tab] -> ui-state
     @btn-pizarra [Button] "Pizarra" [button] -> ui-state (requires: @tab-trafico)
     @btn-abrir-ticket [Button] "BtnAbrirTicket" [button] -> ui-state
     @btn-control-tower [Button] "BtnControlTower" [button] -> ui-state
   Flows:
     flow:abrir-pizarra-flow: Navega en el Ribbon seleccionando la pestaña Tráfico y haciendo clic en Pizarra
   Journeys:
     journey:abrir-pizarra: Navega desde el Menú Principal a través del Ribbon Tráfico hasta la Pizarra de Tráfico
   ```

2. **Execute Declarative Flow / Journey**:
   ```bash
   # Dry-run preview
   win-nav journey abrir-pizarra
   # Armed execution
   win-nav journey abrir-pizarra --armed
   ```

---

## 4. Re-usable FlaUI Interaction Patterns

| Target Control | UIA Role | WinForms / C1 Identifier | Optimal Interaction Pattern |
|---|---|---|---|
| Top Quick Button | `Button` | `BtnAbrirTicket`, `BtnControlTower` | Direct invoke or bounding point click |
| Ribbon Tab | `TabItem` | `RTTrafico`, `RTFlota`, `RTMaestros` | `SelectionItemPattern.Select()` or bounding point click |
| Context Ribbon Button | `Button` | `RBtnPizarra`, `RBtnInformes` | Must click Ribbon Tab first, then invoke button |
| MDI Child View | `Window` | Child window title `Pizarra` | Inspect via `getchildwindows` on main HWND |
| MDI Action Button | `Button` | `➕`, `BtnActualizar` | Fuzzy name match or bounding point click |
