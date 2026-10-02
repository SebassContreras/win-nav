import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { ExitCodes, WinNavError } from "./errors.js";
import {
  SnapshotManager,
  type DesktopSnapshot,
  type DesktopElement,
} from "./snapshot.js";
import { RefStore } from "./ref-store.js";

describe("Snapshot & RefStore Core", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "win-nav-test-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe("WinNavError", () => {
    it("should carry exitCode and corresponding code string", () => {
      const err = new WinNavError(ExitCodes.STALE_REF, "Expired ref");
      expect(err.exitCode).toBe(3);
      expect(err.code).toBe("stale_ref");
      expect(err.message).toBe("Expired ref");
    });
  });

  describe("RefStore.assignRefs", () => {
    it("should assign sequential eN references", () => {
      const raw = [
        { role: "Button", name: "Submit", automationId: "btnSubmit", isEnabled: true },
        { role: "Edit", name: "Username", automationId: "txtUser", isEnabled: true },
      ];
      const assigned = RefStore.assignRefs(raw);
      expect(assigned[0].ref).toBe("e1");
      expect(assigned[1].ref).toBe("e2");
    });
  });

  describe("SnapshotManager", () => {
    it("should mask password fields and persist snapshot", async () => {
      const manager = new SnapshotManager(tmpDir);
      const snapshot: DesktopSnapshot = {
        snapshotId: "snap-123",
        timestamp: new Date().toISOString(),
        processId: 1001,
        processName: "TestApp.exe",
        windowTitle: "Login Window",
        elements: [
          {
            ref: "e1",
            role: "Edit",
            name: "Password",
            automationId: "txtPwd",
            isEnabled: true,
            isPassword: true,
            value: "super_secret_value",
          },
          {
            ref: "e2",
            role: "Button",
            name: "Login",
            automationId: "btnLogin",
            isEnabled: true,
          },
        ],
      };

      const targetPath = path.join(tmpDir, ".agent", "snapshot.json");
      await manager.saveSnapshot(snapshot, targetPath);

      const loaded = await manager.loadSnapshot(targetPath);
      expect(loaded).not.toBeNull();
      expect(loaded?.snapshotId).toBe("snap-123");
      // Password field must be masked
      const pwdEl = loaded?.elements.find((e) => e.ref === "e1");
      expect(pwdEl?.value).toBe("***");

      expect(manager.isFresh(loaded!)).toBe(true);
    });
  });

  describe("RefStore invalidation and stale detection", () => {
    it("should resolve valid element in active snapshot", () => {
      const store = new RefStore();
      const snapshot: DesktopSnapshot = {
        snapshotId: "snap-abc",
        timestamp: new Date().toISOString(),
        processId: 2002,
        windowTitle: "Main Window",
        elements: [
          {
            ref: "e1",
            role: "Button",
            name: "OK",
            automationId: "btnOk",
            isEnabled: true,
          },
        ],
      };

      store.setSnapshot(snapshot);
      const el = store.resolveRef("e1", "snap-abc");
      expect(el.name).toBe("OK");
    });

    it("should throw STALE_REF if snapshot was invalidated", () => {
      const store = new RefStore();
      const snapshot: DesktopSnapshot = {
        snapshotId: "snap-abc",
        timestamp: new Date().toISOString(),
        processId: 2002,
        windowTitle: "Main Window",
        elements: [
          {
            ref: "e1",
            role: "Button",
            name: "OK",
            automationId: "btnOk",
            isEnabled: true,
          },
        ],
      };

      store.setSnapshot(snapshot);
      store.invalidate("Mutation occurred");

      expect(() => store.resolveRef("e1")).toThrowError(WinNavError);
      try {
        store.resolveRef("e1");
      } catch (err: any) {
        expect(err.exitCode).toBe(ExitCodes.STALE_REF);
      }
    });

    it("should throw STALE_REF if expectedSnapshotId mismatches", () => {
      const store = new RefStore();
      const snapshot: DesktopSnapshot = {
        snapshotId: "snap-new",
        timestamp: new Date().toISOString(),
        processId: 2002,
        windowTitle: "Main Window",
        elements: [
          {
            ref: "e1",
            role: "Button",
            name: "OK",
            automationId: "btnOk",
            isEnabled: true,
          },
        ],
      };

      store.setSnapshot(snapshot);
      expect(() => store.resolveRef("e1", "snap-old")).toThrowError(WinNavError);
    });
  });
});
