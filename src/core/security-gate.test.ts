import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { ExitCodes, WinNavError } from "./errors.js";
import { SecurityGate } from "./security-gate.js";
import { RefStore } from "./ref-store.js";
import { ActionExecutor, type ActionDriver } from "./actions.js";
import type { DesktopElement, DesktopSnapshot } from "./snapshot.js";

describe("SecurityGate and ActionExecutor", () => {
  let tmpDir: string;
  let savedEnv: string | undefined;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "win-nav-sec-"));
    savedEnv = process.env.WIN_NAV_KILL_SWITCH;
    delete process.env.WIN_NAV_KILL_SWITCH;
  });

  afterEach(async () => {
    if (savedEnv !== undefined) {
      process.env.WIN_NAV_KILL_SWITCH = savedEnv;
    } else {
      delete process.env.WIN_NAV_KILL_SWITCH;
    }
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe("Kill Switch", () => {
    it("should abort when .agent/kill exists", async () => {
      const gate = new SecurityGate(tmpDir);
      const killFile = gate.getKillSwitchPath();
      await fs.mkdir(path.dirname(killFile), { recursive: true });
      await fs.writeFile(killFile, "kill", "utf-8");

      expect(() => gate.assertNotKilled()).toThrowError(WinNavError);
      try {
        gate.assertNotKilled();
      } catch (err: any) {
        expect(err.exitCode).toBe(ExitCodes.KILL_SWITCH);
      }
    });

    it("should abort when WIN_NAV_KILL_SWITCH env var is set", () => {
      process.env.WIN_NAV_KILL_SWITCH = "1";
      const gate = new SecurityGate(tmpDir);
      expect(() => gate.assertNotKilled()).toThrowError(WinNavError);
      try {
        gate.assertNotKilled();
      } catch (err: any) {
        expect(err.exitCode).toBe(ExitCodes.KILL_SWITCH);
      }
    });
  });

  describe("Allow List", () => {
    it("should block process when allow list does not include it", async () => {
      const gate = new SecurityGate(tmpDir);
      const allowFile = gate.getAllowListPath();
      await fs.mkdir(path.dirname(allowFile), { recursive: true });
      await fs.writeFile(
        allowFile,
        JSON.stringify({ allowedProcesses: ["AllowedApp.exe"] }),
        "utf-8"
      );

      await expect(gate.assertProcessAllowed("RogueApp.exe")).rejects.toThrow(
        WinNavError
      );
      try {
        await gate.assertProcessAllowed("RogueApp.exe");
      } catch (err: any) {
        expect(err.exitCode).toBe(ExitCodes.ORIGIN_BLOCKED);
      }
    });

    it("should permit process listed in allow list", async () => {
      const gate = new SecurityGate(tmpDir);
      const allowFile = gate.getAllowListPath();
      await fs.mkdir(path.dirname(allowFile), { recursive: true });
      await fs.writeFile(
        allowFile,
        JSON.stringify({ allowedProcesses: ["Sigestran.exe"] }),
        "utf-8"
      );

      await expect(gate.assertProcessAllowed("Sigestran.exe")).resolves.toBeUndefined();
      await expect(gate.assertProcessAllowed("sigestran")).resolves.toBeUndefined();
    });

    it("should permit process explicitly allowed via arguments", async () => {
      const gate = new SecurityGate(tmpDir);
      await expect(
        gate.assertProcessAllowed("MyApp.exe", ["MyApp.exe"])
      ).resolves.toBeUndefined();
    });
  });

  describe("Sensitive Fields Barrier", () => {
    it("should reject sensitive/password fields with SENSITIVE_TARGET (11)", () => {
      const gate = new SecurityGate(tmpDir);
      const passwordElement: DesktopElement = {
        ref: "e1",
        role: "Edit",
        name: "Password",
        automationId: "txtPwd",
        isEnabled: true,
        isPassword: true,
      };

      expect(() => gate.assertNotSensitive(passwordElement)).toThrowError(
        WinNavError
      );
      try {
        gate.assertNotSensitive(passwordElement);
      } catch (err: any) {
        expect(err.exitCode).toBe(ExitCodes.SENSITIVE_TARGET);
      }
    });
  });

  describe("ActionExecutor: Armed vs Dry-Run", () => {
    it("should dry-run click without driver execution or ref invalidation", async () => {
      const gate = new SecurityGate(tmpDir);
      const store = new RefStore();
      let driverCalled = false;
      const driver: ActionDriver = {
        async executeAction() {
          driverCalled = true;
        },
      };

      const snapshot: DesktopSnapshot = {
        snapshotId: "snap-test",
        timestamp: new Date().toISOString(),
        processId: 100,
        windowTitle: "Test",
        elements: [
          {
            ref: "e1",
            role: "Button",
            name: "Save",
            automationId: "btnSave",
            isEnabled: true,
          },
        ],
      };
      store.setSnapshot(snapshot);

      const executor = new ActionExecutor(gate, store, driver);
      const result = await executor.execute({
        action: "click",
        target: "e1",
        isArmed: false,
      });

      expect(result.isArmed).toBe(false);
      expect(result.preview).toContain("[DRY-RUN] Would click Button 'Save' (e1)");
      expect(driverCalled).toBe(false);
      // Ref store must still be valid
      expect(store.resolveRef("e1")).toBeDefined();
    });

    it("should execute armed action, invoke driver, and invalidate ref store", async () => {
      const gate = new SecurityGate(tmpDir);
      const store = new RefStore();
      let invokedAction: string | null = null;
      const driver: ActionDriver = {
        async executeAction(action) {
          invokedAction = action;
        },
      };

      const snapshot: DesktopSnapshot = {
        snapshotId: "snap-test-2",
        timestamp: new Date().toISOString(),
        processId: 100,
        windowTitle: "Test",
        elements: [
          {
            ref: "e1",
            role: "Button",
            name: "Save",
            automationId: "btnSave",
            isEnabled: true,
          },
        ],
      };
      store.setSnapshot(snapshot);

      const executor = new ActionExecutor(gate, store, driver);
      const result = await executor.execute({
        action: "click",
        target: "e1",
        isArmed: true,
        allowedProcesses: ["*"],
      });

      expect(result.isArmed).toBe(true);
      expect(result.preview).toContain("[ARMED] Clicked Button 'Save' (e1)");
      expect(invokedAction).toBe("click");
      // Ref store must be invalidated
      expect(() => store.resolveRef("e1")).toThrowError(WinNavError);
    });

    it("should throw NOT_ACTIONABLE when element is disabled", async () => {
      const gate = new SecurityGate(tmpDir);
      const store = new RefStore();
      const snapshot: DesktopSnapshot = {
        snapshotId: "snap-test-3",
        timestamp: new Date().toISOString(),
        processId: 100,
        windowTitle: "Test",
        elements: [
          {
            ref: "e1",
            role: "Button",
            name: "DisabledBtn",
            automationId: "btnDisabled",
            isEnabled: false,
          },
        ],
      };
      store.setSnapshot(snapshot);

      const executor = new ActionExecutor(gate, store);
      await expect(
        executor.execute({
          action: "click",
          target: "e1",
          isArmed: false,
        })
      ).rejects.toThrowError(WinNavError);
    });
  });
});
