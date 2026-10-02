# Windows UI Automation & Velopack Guide

## Overview

`win-nav` automates native Windows desktop software without injecting synthetic drivers, virtual display drivers, or hardcoding pixel coordinates. It leverages the standard **Microsoft UI Automation (UIA3)** accessibility framework via **FlaUI**.

## Supported Frameworks

- **Windows Forms (.NET 8 / .NET Framework)**: Direct introspection of native `Control` hierarchies, standard buttons, textboxes, and custom third-party controls (ComponentOne, DevExpress, Infragistics) exposing accessible names and automation IDs.
- **WPF & WinUI 3**: Full XAML visual tree accessibility support.
- **Embedded Chromium / WebView2**: Windows UI Automation effortlessly traverses the HWND boundary of `msedgewebview2.exe` / `Chrome_WidgetWin_1`, exposing web DOM elements as standard UIA controls.

## Velopack App Discovery

Applications packaged with [Velopack](https://velopack.io/) deploy to the user profile under:
```
%LocalAppData%\<AppName>\current\<AppName>.exe
```

`win-nav` automatically detects and resolves Velopack applications by process name or app slug, identifying the main UI thread window and ignoring secondary updater or background worker processes.

## Cross-Desktop Architecture

When running automated agents or background test runners, Windows processes may execute in secondary or isolated desktop stations. `win-nav` automatically attaches worker threads to the user's interactive desktop:
```csharp
IntPtr hDesk = OpenDesktop("Default", 0, false, DESKTOP_ALL);
SetThreadDesktop(hDesk);
```
This guarantees 100% visibility into visible desktop windows without requiring elevation or session changes.
