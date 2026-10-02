import { spawn, type ChildProcess } from "node:child_process";
import readline from "node:readline";
import path from "node:path";
import fs from "node:fs";
import { ExitCodes, WinNavError } from "../core/errors.js";
import type { DesktopElement, DesktopSnapshot } from "../core/snapshot.js";
import type { ActionDriver, ActionType } from "../core/actions.js";
import type { JsonRpcRequest, JsonRpcResponse, ProcessInfo, WindowInfo } from "./types.js";

export interface UiaBridgeOptions {
  workerDllPath?: string;
  projectPath?: string;
  baseDir?: string;
}

export class UiaBridge implements ActionDriver {
  private workerProcess: ChildProcess | null = null;
  private rl: readline.Interface | null = null;
  private nextId = 1;
  private pendingRequests = new Map<
    number,
    { resolve: (value: any) => void; reject: (err: any) => void; timer: NodeJS.Timeout }
  >();
  private readonly options: UiaBridgeOptions;

  constructor(options: UiaBridgeOptions = {}) {
    this.options = options;
  }

  private resolveWorkerCommand(): { command: string; args: string[] } {
    const baseDir = this.options.baseDir || process.cwd();

    // 1. Check for built dll
    const candidateDll =
      this.options.workerDllPath ||
      path.join(
        baseDir,
        "native",
        "WinNav.Worker",
        "bin",
        "Debug",
        "net8.0-windows",
        "WinNav.Worker.dll"
      );

    if (fs.existsSync(candidateDll)) {
      return { command: "dotnet", args: [candidateDll] };
    }

    // 2. Check for built exe
    const candidateExe = path.join(
      baseDir,
      "native",
      "WinNav.Worker",
      "bin",
      "Debug",
      "net8.0-windows",
      "WinNav.Worker.exe"
    );
    if (fs.existsSync(candidateExe)) {
      return { command: candidateExe, args: [] };
    }

    // 3. Fallback to dotnet run
    const projectDir =
      this.options.projectPath || path.join(baseDir, "native", "WinNav.Worker");
    return { command: "dotnet", args: ["run", "--project", projectDir] };
  }

  async start(): Promise<void> {
    if (this.workerProcess) return;

    const { command, args } = this.resolveWorkerCommand();

    this.workerProcess = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });

    if (!this.workerProcess.stdout || !this.workerProcess.stdin) {
      throw new WinNavError(
        ExitCodes.PROTOCOL,
        "Failed to establish stdio communication with native worker."
      );
    }

    this.rl = readline.createInterface({
      input: this.workerProcess.stdout,
      terminal: false,
    });

    this.rl.on("line", (line) => {
      if (!line.trim()) return;
      try {
        const response: JsonRpcResponse = JSON.parse(line);
        const req = this.pendingRequests.get(response.id);
        if (req) {
          clearTimeout(req.timer);
          this.pendingRequests.delete(response.id);
          if (response.error) {
            req.reject(
              new WinNavError(
                ExitCodes.PROTOCOL,
                response.error.message || "Native worker error",
                { code: response.error.code, data: response.error.data }
              )
            );
          } else {
            req.resolve(response.result);
          }
        }
      } catch (err) {
        // Ignore unparseable non-JSON output (e.g. startup banners)
      }
    });

    this.workerProcess.on("exit", (code, signal) => {
      this.cleanup();
      for (const [id, req] of this.pendingRequests) {
        clearTimeout(req.timer);
        req.reject(
          new WinNavError(
            ExitCodes.PROTOCOL,
            `Native worker exited unexpectedly with code ${code ?? signal}`
          )
        );
      }
      this.pendingRequests.clear();
    });

    // Verify worker responds
    await this.ping();
  }

  private cleanup(): void {
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
    this.workerProcess = null;
  }

  async stop(): Promise<void> {
    if (this.workerProcess) {
      this.workerProcess.kill();
      this.cleanup();
    }
  }

  async send<T = unknown>(
    method: string,
    params?: unknown,
    timeoutMs = 15000
  ): Promise<T> {
    if (!this.workerProcess || !this.workerProcess.stdin) {
      await this.start();
    }

    const id = this.nextId++;
    const payload: JsonRpcRequest = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(
          new WinNavError(
            ExitCodes.TIMEOUT,
            `Request timed out after ${timeoutMs}ms for method '${method}'`
          )
        );
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timer });

      try {
        this.workerProcess!.stdin!.write(JSON.stringify(payload) + "\n");
      } catch (err) {
        clearTimeout(timer);
        this.pendingRequests.delete(id);
        reject(err);
      }
    });
  }

  async ping(): Promise<boolean> {
    const res = await this.send<{ pong: boolean }>("ping");
    return Boolean(res?.pong);
  }

  async findProcesses(query?: string): Promise<ProcessInfo[]> {
    return this.send<ProcessInfo[]>("findProcesses", { query });
  }

  async getWindows(pid?: number): Promise<WindowInfo[]> {
    return this.send<WindowInfo[]>("getWindows", { pid });
  }

  async getTree(options: {
    handle?: number | string;
    pid?: number;
  }): Promise<DesktopSnapshot> {
    const raw = await this.send<{
      processId: number;
      windowTitle: string;
      windowHandle: number;
      elements: DesktopElement[];
    }>("getTree", options);

    return {
      snapshotId: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      processId: raw.processId,
      windowTitle: raw.windowTitle,
      windowHandle: raw.windowHandle,
      elements: raw.elements || [],
    };
  }

  /**
   * ActionDriver implementation for ActionExecutor.
   */
  async executeAction(
    action: ActionType,
    element: DesktopElement,
    value?: string
  ): Promise<void> {
    await this.send("invokeAction", {
      handle: element.handle,
      automationId: element.automationId,
      name: element.name,
      role: element.role,
      boundingRect: element.boundingRect,
      action,
      value,
    });
  }
}
