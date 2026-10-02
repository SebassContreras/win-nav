import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { ExitCodes, WinNavError } from "./errors.js";
import type { DesktopElement } from "./snapshot.js";

export interface AllowListConfig {
  allowedProcesses?: string[];
}

export class SecurityGate {
  private readonly baseDir: string;

  constructor(baseDir: string = process.cwd()) {
    this.baseDir = baseDir;
  }

  getKillSwitchPath(): string {
    return path.join(this.baseDir, ".agent", "kill");
  }

  getAllowListPath(): string {
    return path.join(this.baseDir, ".agent", "allow.json");
  }

  /**
   * Checks if emergency kill-switch is triggered via .agent/kill or WIN_NAV_KILL_SWITCH.
   */
  isKillSwitchActive(): boolean {
    if (
      process.env.WIN_NAV_KILL_SWITCH === "1" ||
      process.env.WIN_NAV_KILL_SWITCH?.toLowerCase() === "true"
    ) {
      return true;
    }

    try {
      return fsSync.existsSync(this.getKillSwitchPath());
    } catch {
      return false;
    }
  }

  /**
   * Asserts kill switch is not active, throwing ExitCodes.KILL_SWITCH if it is.
   */
  assertNotKilled(): void {
    if (this.isKillSwitchActive()) {
      throw new WinNavError(
        ExitCodes.KILL_SWITCH,
        "Emergency kill-switch is active (.agent/kill or WIN_NAV_KILL_SWITCH set). Automation terminated."
      );
    }
  }

  /**
   * Loads the allow-list from .agent/allow.json if present.
   */
  async loadAllowList(): Promise<string[]> {
    const allowPath = this.getAllowListPath();
    try {
      const content = await fs.readFile(allowPath, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed.map((p) => String(p).toLowerCase());
      }
      if (Array.isArray(parsed.allowedProcesses)) {
        return parsed.allowedProcesses.map((p: unknown) => String(p).toLowerCase());
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Asserts target process is permitted.
   */
  async assertProcessAllowed(
    processName: string,
    explicitAllows: string[] = []
  ): Promise<void> {
    const normProc = processName.trim().toLowerCase();
    const explicitNorm = explicitAllows.map((p) => p.trim().toLowerCase());

    if (explicitNorm.includes(normProc) || explicitNorm.includes("*")) {
      return;
    }

    const fileAllowed = await this.loadAllowList();
    if (fileAllowed.length === 0) {
      // If no allow-list file exists, allow or require?
      // "Target process is blocked unless registered in .agent/allow.json or consented to with --allow-process (exit code 6 origin_blocked)"
      // So if allow.json doesn't exist and no explicit allow was given, it is blocked.
      throw new WinNavError(
        ExitCodes.ORIGIN_BLOCKED,
        `Target process '${processName}' is not in allow-list (.agent/allow.json or --allow-process).`,
        { processName }
      );
    }

    const isMatch = fileAllowed.some((entry) => {
      if (entry === "*") return true;
      if (entry === normProc) return true;
      if (normProc.endsWith(".exe") && entry === normProc.slice(0, -4)) return true;
      if (entry.endsWith(".exe") && entry.slice(0, -4) === normProc) return true;
      return false;
    });

    if (!isMatch) {
      throw new WinNavError(
        ExitCodes.ORIGIN_BLOCKED,
        `Target process '${processName}' is not permitted by .agent/allow.json.`,
        { processName, allowed: fileAllowed }
      );
    }
  }

  /**
   * Asserts an element is not sensitive (e.g. password field).
   */
  assertNotSensitive(element: DesktopElement): void {
    if (element.isPassword) {
      throw new WinNavError(
        ExitCodes.SENSITIVE_TARGET,
        `Target control '${element.ref}' (${element.name || element.automationId}) is marked as sensitive/password. Automated entry is blocked.`,
        { ref: element.ref, automationId: element.automationId }
      );
    }
  }

  /**
   * Full pre-action security validation.
   */
  async validateTarget(
    element: DesktopElement,
    processName?: string,
    explicitAllows: string[] = []
  ): Promise<void> {
    this.assertNotKilled();
    this.assertNotSensitive(element);
    if (processName) {
      await this.assertProcessAllowed(processName, explicitAllows);
    }
  }
}

export const defaultSecurityGate = new SecurityGate();
