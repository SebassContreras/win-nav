using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using FlaUI.Core;
using FlaUI.Core.AutomationElements;
using FlaUI.Core.Definitions;
using FlaUI.UIA3;

namespace WinNav.Worker;

public class JsonRpcRequest
{
    [JsonPropertyName("id")]
    public object? Id { get; set; }

    [JsonPropertyName("method")]
    public string Method { get; set; } = string.Empty;

    [JsonPropertyName("params")]
    public JsonElement? Params { get; set; }
}

public class JsonRpcResponse
{
    [JsonPropertyName("jsonrpc")]
    public string JsonRpc { get; set; } = "2.0";

    [JsonPropertyName("id")]
    public object? Id { get; set; }

    [JsonPropertyName("result")]
    public object? Result { get; set; }

    [JsonPropertyName("error")]
    public JsonRpcError? Error { get; set; }
}

public class JsonRpcError
{
    [JsonPropertyName("code")]
    public int Code { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("data")]
    public object? Data { get; set; }
}

public class ProcessInfo
{
    [JsonPropertyName("pid")]
    public int Pid { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("mainWindowTitle")]
    public string MainWindowTitle { get; set; } = string.Empty;

    [JsonPropertyName("mainWindowHandle")]
    public long MainWindowHandle { get; set; }
}

public class WindowInfo
{
    [JsonPropertyName("handle")]
    public long Handle { get; set; }

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("automationId")]
    public string AutomationId { get; set; } = string.Empty;

    [JsonPropertyName("className")]
    public string ClassName { get; set; } = string.Empty;

    [JsonPropertyName("pid")]
    public int Pid { get; set; }
}

public class ElementDto
{
    [JsonPropertyName("ref")]
    public string Ref { get; set; } = string.Empty;

    [JsonPropertyName("role")]
    public string Role { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("automationId")]
    public string AutomationId { get; set; } = string.Empty;

    [JsonPropertyName("className")]
    public string? ClassName { get; set; }

    [JsonPropertyName("value")]
    public string? Value { get; set; }

    [JsonPropertyName("isEnabled")]
    public bool IsEnabled { get; set; }

    [JsonPropertyName("isOffscreen")]
    public bool? IsOffscreen { get; set; }

    [JsonPropertyName("isPassword")]
    public bool? IsPassword { get; set; }

    [JsonPropertyName("boundingRect")]
    public RectDto? BoundingRect { get; set; }

    [JsonPropertyName("handle")]
    public long? Handle { get; set; }

    [JsonPropertyName("frameworkId")]
    public string? FrameworkId { get; set; }
}

public class RectDto
{
    [JsonPropertyName("x")]
    public double X { get; set; }

    [JsonPropertyName("y")]
    public double Y { get; set; }

    [JsonPropertyName("width")]
    public double Width { get; set; }

    [JsonPropertyName("height")]
    public double Height { get; set; }
}

public class Program
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public static void Main(string[] args)
    {
        // 1. Switch to user's interactive desktop if running in isolated runner
        DesktopHelper.SwitchToDefaultDesktop();

        // 2. Initialize FlaUI UIA3 Automation
        using var automation = new UIA3Automation();

        string? line;
        while ((line = Console.ReadLine()) != null)
        {
            if (string.IsNullOrWhiteSpace(line)) continue;

            JsonRpcRequest? req = null;
            try
            {
                req = JsonSerializer.Deserialize<JsonRpcRequest>(line, JsonOptions);
                if (req == null) continue;

                var result = DispatchMethod(req.Method, req.Params, automation);
                var resp = new JsonRpcResponse
                {
                    Id = req.Id,
                    Result = result
                };
                Console.WriteLine(JsonSerializer.Serialize(resp, JsonOptions));
            }
            catch (Exception ex)
            {
                var resp = new JsonRpcResponse
                {
                    Id = req?.Id,
                    Error = new JsonRpcError
                    {
                        Code = 10,
                        Message = ex.Message,
                        Data = ex.StackTrace
                    }
                };
                Console.WriteLine(JsonSerializer.Serialize(resp, JsonOptions));
            }
        }
    }

    private static object DispatchMethod(string method, JsonElement? prms, UIA3Automation automation)
    {
        switch (method.ToLowerInvariant())
        {
            case "ping":
                return new { pong = true };

            case "findprocesses":
            {
                string? query = null;
                if (prms.HasValue && prms.Value.TryGetProperty("query", out var qEl))
                {
                    query = qEl.GetString();
                }

                var list = new List<ProcessInfo>();
                foreach (var p in Process.GetProcesses())
                {
                    try
                    {
                        if (string.IsNullOrEmpty(query) ||
                            p.ProcessName.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                            p.Id.ToString() == query)
                        {
                            list.Add(new ProcessInfo
                            {
                                Pid = p.Id,
                                Name = p.ProcessName,
                                MainWindowTitle = p.MainWindowTitle,
                                MainWindowHandle = p.MainWindowHandle.ToInt64()
                            });
                        }
                    }
                    catch
                    {
                        // Access denied on system processes, skip
                    }
                }
                return list;
            }

            case "getwindows":
            {
                int pid = 0;
                if (prms.HasValue && prms.Value.TryGetProperty("pid", out var pidEl))
                {
                    pid = pidEl.GetInt32();
                }

                return DesktopHelper.GetTopLevelWindows(pid);
            }

            case "getchildwindows":
            {
                long handle = 0;
                if (prms.HasValue && prms.Value.TryGetProperty("handle", out var hEl))
                {
                    handle = hEl.GetInt64();
                }

                return DesktopHelper.GetChildWindows(handle);
            }

            case "dumphwnd":
            {
                long handle = 0;
                if (prms.HasValue && prms.Value.TryGetProperty("handle", out var hEl))
                {
                    handle = hEl.GetInt64();
                }

                var el = automation.FromHandle(new IntPtr(handle));
                if (el == null) return new { error = "not found" };

                var walker = automation.TreeWalkerFactory.GetRawViewWalker();
                var list = new List<object>();
                var curr = walker.GetFirstChild(el);
                while (curr != null)
                {
                    string currName = "";
                    string currAutoId = "";
                    string currClass = "";
                    string currRole = "";
                    try { currName = curr.Properties.Name.ValueOrDefault ?? ""; } catch { }
                    try { currAutoId = curr.Properties.AutomationId.ValueOrDefault ?? ""; } catch { }
                    try { currClass = curr.Properties.ClassName.ValueOrDefault ?? ""; } catch { }
                    try { currRole = curr.ControlType.ToString(); } catch { }

                    list.Add(new
                    {
                        name = currName,
                        autoId = currAutoId,
                        role = currRole,
                        className = currClass,
                        rect = new
                        {
                            x = curr.BoundingRectangle.X,
                            y = curr.BoundingRectangle.Y,
                            width = curr.BoundingRectangle.Width,
                            height = curr.BoundingRectangle.Height
                        }
                    });
                    curr = walker.GetNextSibling(curr);
                }
                return list;
            }

            case "dumpfulltree":
            {
                long handle = 0;
                if (prms.HasValue && prms.Value.TryGetProperty("handle", out var hEl)) handle = hEl.GetInt64();
                var el = automation.FromHandle(new IntPtr(handle));
                if (el == null) return new { error = "not found" };

                var walker = automation.TreeWalkerFactory.GetRawViewWalker();
                var list = new List<object>();

                void Walk(AutomationElement node, int depth)
                {
                    if (depth > 6) return;
                    var child = walker.GetFirstChild(node);
                    while (child != null)
                    {
                        string cName = "";
                        string cAutoId = "";
                        string cClass = "";
                        string cRole = "";
                        try { cName = child.Properties.Name.ValueOrDefault ?? ""; } catch { }
                        try { cAutoId = child.Properties.AutomationId.ValueOrDefault ?? ""; } catch { }
                        try { cClass = child.Properties.ClassName.ValueOrDefault ?? ""; } catch { }
                        try { cRole = child.ControlType.ToString(); } catch { }

                        list.Add(new
                        {
                            name = cName,
                            autoId = cAutoId,
                            role = cRole,
                            className = cClass,
                            depth = depth,
                            rect = new
                            {
                                x = child.BoundingRectangle.X,
                                y = child.BoundingRectangle.Y,
                                width = child.BoundingRectangle.Width,
                                height = child.BoundingRectangle.Height
                            }
                        });
                        Walk(child, depth + 1);
                        child = walker.GetNextSibling(child);
                    }
                }

                Walk(el, 1);
                return list;
            }

            case "gettree":
            {
                long handle = 0;
                int pid = 0;
                if (prms.HasValue)
                {
                    if (prms.Value.TryGetProperty("handle", out var hEl)) handle = hEl.GetInt64();
                    if (prms.Value.TryGetProperty("pid", out var pEl)) pid = pEl.GetInt32();
                }

                AutomationElement? root = null;
                if (handle != 0)
                {
                    root = automation.FromHandle(new IntPtr(handle));
                }
                else if (pid != 0)
                {
                    var proc = Process.GetProcessById(pid);
                    if (proc.MainWindowHandle != IntPtr.Zero)
                    {
                        root = automation.FromHandle(proc.MainWindowHandle);
                    }
                }

                if (root == null)
                {
                    root = automation.GetDesktop();
                }

                var elements = new List<ElementDto>();
                TraverseInteractiveElements(root, elements);

                // Assign e1, e2, ...
                for (int i = 0; i < elements.Count; i++)
                {
                    elements[i].Ref = $"e{i + 1}";
                }

                return new
                {
                    processId = root.Properties.ProcessId.ValueOrDefault,
                    windowTitle = root.Name ?? "",
                    windowHandle = root.Properties.NativeWindowHandle.ValueOrDefault.ToInt64(),
                    elements
                };
            }

            case "invokeaction":
            {
                long handle = 0;
                string? automationId = null;
                string? name = null;
                string? role = null;
                string action = "click";
                string? value = null;

                if (prms.HasValue)
                {
                    if (prms.Value.TryGetProperty("handle", out var hEl)) handle = hEl.GetInt64();
                    if (prms.Value.TryGetProperty("automationId", out var aEl)) automationId = aEl.GetString();
                    if (prms.Value.TryGetProperty("name", out var nEl)) name = nEl.GetString();
                    if (prms.Value.TryGetProperty("role", out var rEl)) role = rEl.GetString();
                    if (prms.Value.TryGetProperty("action", out var actEl)) action = actEl.GetString() ?? "click";
                    if (prms.Value.TryGetProperty("value", out var vEl)) value = vEl.GetString();
                }

                double bx = 0, by = 0, bw = 0, bh = 0;
                bool hasRect = false;
                if (prms.HasValue && prms.Value.TryGetProperty("boundingRect", out var rectEl))
                {
                    if (rectEl.TryGetProperty("x", out var xEl)) bx = xEl.GetDouble();
                    if (rectEl.TryGetProperty("y", out var yEl)) by = yEl.GetDouble();
                    if (rectEl.TryGetProperty("width", out var wEl)) bw = wEl.GetDouble();
                    if (rectEl.TryGetProperty("height", out var hEl)) bh = hEl.GetDouble();
                    hasRect = bw > 0 && bh > 0;
                }

                AutomationElement? root = handle != 0 ? automation.FromHandle(new IntPtr(handle)) : automation.GetDesktop();
                if (root == null) throw new InvalidOperationException("Could not find window root.");

                AutomationElement? target = null;
                if (!string.IsNullOrEmpty(automationId))
                {
                    target = root.FindFirstDescendant(cf => cf.ByAutomationId(automationId));
                }
                if (target == null && !string.IsNullOrEmpty(name))
                {
                    target = root.FindFirstDescendant(cf => cf.ByName(name));
                }
                // Try finding by point if element has bounding rect
                if (target == null && hasRect)
                {
                    try
                    {
                        int cx = (int)(bx + bw / 2);
                        int cy = (int)(by + bh / 2);
                        target = automation.FromPoint(new Point(cx, cy));
                    }
                    catch
                    {
                        // Fallback
                    }
                }
                // Try fuzzy name match
                if (target == null && !string.IsNullOrEmpty(name))
                {
                    var cleanSearch = new string(name.Where(char.IsLetterOrDigit).ToArray()).ToLowerInvariant();
                    if (!string.IsNullOrEmpty(cleanSearch))
                    {
                        foreach (var el in root.FindAllDescendants())
                        {
                            try
                            {
                                var cleanEl = new string((el.Name ?? "").Where(char.IsLetterOrDigit).ToArray()).ToLowerInvariant();
                                if (cleanEl.Contains(cleanSearch) || cleanSearch.Contains(cleanEl))
                                {
                                    target = el;
                                    break;
                                }
                            }
                            catch { }
                        }
                    }
                }
                if (target == null && handle != 0 && string.IsNullOrEmpty(automationId) && string.IsNullOrEmpty(name))
                {
                    target = root;
                }

                if (target == null)
                {
                    throw new InvalidOperationException($"Target control not found (automationId: '{automationId}', name: '{name}').");
                }

                ExecuteActionOnElement(target, action, value);
                return new { success = true };
            }

            default:
                throw new NotSupportedException($"Unknown method: {method}");
        }
    }

    private static void TraverseInteractiveElements(AutomationElement root, List<ElementDto> elements)
    {
        var rawChildren = root.FindAllDescendants();
        foreach (var el in rawChildren)
        {
            try
            {
                var ct = el.ControlType;
                string name = el.Name ?? "";
                string autoId = el.AutomationId ?? "";
                string className = el.ClassName ?? "";

                bool isInteractive =
                    ct == ControlType.Button ||
                    ct == ControlType.Edit ||
                    ct == ControlType.ComboBox ||
                    ct == ControlType.CheckBox ||
                    ct == ControlType.RadioButton ||
                    ct == ControlType.TabItem ||
                    ct == ControlType.Tab ||
                    ct == ControlType.MenuItem ||
                    ct == ControlType.Menu ||
                    ct == ControlType.MenuBar ||
                    ct == ControlType.ToolBar ||
                    ct == ControlType.SplitButton ||
                    ct == ControlType.ListItem ||
                    ct == ControlType.Hyperlink ||
                    ct == ControlType.Document ||
                    ct == ControlType.TreeItem ||
                    (ct == ControlType.Text && !string.IsNullOrWhiteSpace(name)) ||
                    (ct == ControlType.Custom && (!string.IsNullOrWhiteSpace(name) || !string.IsNullOrWhiteSpace(autoId))) ||
                    (ct == ControlType.Group && (!string.IsNullOrWhiteSpace(name) || !string.IsNullOrWhiteSpace(autoId))) ||
                    (ct == ControlType.Pane && (!string.IsNullOrWhiteSpace(name) || !string.IsNullOrWhiteSpace(autoId) || className.Contains("Ribbon", StringComparison.OrdinalIgnoreCase))) ||
                    className.Contains("Ribbon", StringComparison.OrdinalIgnoreCase) ||
                    name.Contains("Ribbon", StringComparison.OrdinalIgnoreCase) ||
                    name.Contains("Trafico", StringComparison.OrdinalIgnoreCase) ||
                    name.Contains("Tráfico", StringComparison.OrdinalIgnoreCase);

                if (isInteractive)
                {
                    bool isOffscreen = el.IsOffscreen;
                    bool isEnabled = el.IsEnabled;
                    bool isPassword = el.Properties.IsPassword.ValueOrDefault;

                    string? val = null;
                    try
                    {
                        var valPat = el.Patterns.Value.PatternOrDefault;
                        if (valPat != null)
                        {
                            val = isPassword ? "***" : valPat.Value.ValueOrDefault;
                        }
                    }
                    catch
                    {
                        // Ignore pattern read failures
                    }

                    RectDto? rectDto = null;
                    try
                    {
                        var rect = el.BoundingRectangle;
                        if (!rect.IsEmpty)
                        {
                            rectDto = new RectDto
                            {
                                X = rect.X,
                                Y = rect.Y,
                                Width = rect.Width,
                                Height = rect.Height
                            };
                        }
                    }
                    catch
                    {
                        // Ignore rect retrieval errors
                    }

                    elements.Add(new ElementDto
                    {
                        Role = ct.ToString(),
                        Name = name,
                        AutomationId = autoId,
                        ClassName = className,
                        IsEnabled = isEnabled,
                        IsOffscreen = isOffscreen,
                        IsPassword = isPassword,
                        Value = val,
                        BoundingRect = rectDto,
                        Handle = el.Properties.NativeWindowHandle.ValueOrDefault.ToInt64(),
                        FrameworkId = el.Properties.FrameworkId.ValueOrDefault
                    });
                }
            }
            catch
            {
                // Element may be gone or transient
            }
        }
    }

    private static void ExecuteActionOnElement(AutomationElement element, string action, string? value)
    {
        switch (action.ToLowerInvariant())
        {
            case "click":
            case "invoke":
                var invPat = element.Patterns.Invoke.PatternOrDefault;
                if (invPat != null)
                {
                    invPat.Invoke();
                }
                else
                {
                    var togPat = element.Patterns.Toggle.PatternOrDefault;
                    if (togPat != null)
                    {
                        togPat.Toggle();
                    }
                    else
                    {
                        element.Click();
                    }
                }
                break;

            case "fill":
            case "settext":
                var valPat = element.Patterns.Value.PatternOrDefault;
                if (valPat != null && !valPat.IsReadOnly.ValueOrDefault)
                {
                    valPat.SetValue(value ?? "");
                }
                else
                {
                    element.Focus();
                    element.AsTextBox()?.Enter(value ?? "");
                }
                break;

            case "select":
                var selItem = element.Patterns.SelectionItem.PatternOrDefault;
                if (selItem != null)
                {
                    selItem.Select();
                }
                else
                {
                    element.Click();
                }
                break;

            case "toggle":
                var togglePat = element.Patterns.Toggle.PatternOrDefault;
                if (togglePat != null)
                {
                    togglePat.Toggle();
                }
                else
                {
                    element.Click();
                }
                break;

            default:
                throw new NotSupportedException($"Unsupported action '{action}'.");
        }
    }
}
