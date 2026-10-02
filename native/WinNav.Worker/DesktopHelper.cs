using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

namespace WinNav.Worker;

public static class DesktopHelper
{
    private const uint DESKTOP_ALL = 0x01FF;

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    private static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool CloseDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    private delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    private static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    private static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool IsWindowVisible(IntPtr hWnd);

    /// <summary>
    /// Switches the current worker thread to the user's interactive desktop (WinSta0\Default).
    /// </summary>
    public static bool SwitchToDefaultDesktop()
    {
        try
        {
            IntPtr hDesk = OpenDesktop("Default", 0, false, DESKTOP_ALL);
            if (hDesk != IntPtr.Zero)
            {
                bool success = SetThreadDesktop(hDesk);
                return success;
            }
        }
        catch
        {
            // Fall through if already running on interactive desktop
        }
        return false;
    }

    /// <summary>
    /// Enumerates top-level desktop windows.
    /// </summary>
    public static List<WindowInfo> GetTopLevelWindows(int targetPid = 0)
    {
        var windows = new List<WindowInfo>();
        var titleSb = new StringBuilder(512);
        var classSb = new StringBuilder(256);

        EnumWindows((hWnd, lParam) =>
        {
            try
            {
                GetWindowThreadProcessId(hWnd, out uint pid);
                if (targetPid != 0 && pid != targetPid)
                {
                    return true;
                }

                bool isVisible = IsWindowVisible(hWnd);
                titleSb.Clear();
                GetWindowText(hWnd, titleSb, titleSb.Capacity);
                string title = titleSb.ToString();

                classSb.Clear();
                GetClassName(hWnd, classSb, classSb.Capacity);
                string className = classSb.ToString();

                // Keep windows that are visible or have non-empty titles
                if (isVisible || !string.IsNullOrWhiteSpace(title))
                {
                    windows.Add(new WindowInfo
                    {
                        Handle = hWnd.ToInt64(),
                        Title = title,
                        ClassName = className,
                        Pid = (int)pid
                    });
                }
            }
            catch
            {
                // Continue enumeration
            }
            return true;
        }, IntPtr.Zero);

        return windows;
    }

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool EnumChildWindows(IntPtr hWndParent, EnumWindowsProc lpEnumFunc, IntPtr lParam);

    public static List<WindowInfo> GetChildWindows(long parentHwnd)
    {
        var windows = new List<WindowInfo>();
        var titleSb = new StringBuilder(512);
        var classSb = new StringBuilder(256);

        EnumChildWindows(new IntPtr(parentHwnd), (hWnd, lParam) =>
        {
            try
            {
                GetWindowThreadProcessId(hWnd, out uint pid);
                titleSb.Clear();
                GetWindowText(hWnd, titleSb, titleSb.Capacity);
                string title = titleSb.ToString();

                classSb.Clear();
                GetClassName(hWnd, classSb, classSb.Capacity);
                string className = classSb.ToString();

                windows.Add(new WindowInfo
                {
                    Handle = hWnd.ToInt64(),
                    Title = title,
                    ClassName = className,
                    Pid = (int)pid
                });
            }
            catch { }
            return true;
        }, IntPtr.Zero);

        return windows;
    }
}
