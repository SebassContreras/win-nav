import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { UiaBridge } from "./uia-bridge.js";

describe("UiaBridge Integration", () => {
  let bridge: UiaBridge;

  beforeAll(async () => {
    bridge = new UiaBridge();
    await bridge.start();
  }, 30000);

  afterAll(async () => {
    if (bridge) {
      await bridge.stop();
    }
  });

  it("should ping worker successfully", async () => {
    const pong = await bridge.ping();
    expect(pong).toBe(true);
  }, 15000);

  it("should discover running processes", async () => {
    const currentPid = process.pid;
    const processes = await bridge.findProcesses(String(currentPid));
    expect(Array.isArray(processes)).toBe(true);
    expect(processes.length).toBeGreaterThan(0);
    const self = processes.find((p) => p.pid === currentPid);
    expect(self).toBeDefined();
  }, 15000);

  it("should list top-level windows", async () => {
    const windows = await bridge.getWindows();
    expect(Array.isArray(windows)).toBe(true);
    expect(windows.length).toBeGreaterThan(0);
  }, 15000);

  it("should inspect desktop tree and return snapshot contract", async () => {
    const snapshot = await bridge.getTree({});
    expect(snapshot).toBeDefined();
    expect(snapshot.snapshotId).toBeDefined();
    expect(snapshot.timestamp).toBeDefined();
    expect(Array.isArray(snapshot.elements)).toBe(true);

    if (snapshot.elements.length > 0) {
      const first = snapshot.elements[0];
      expect(first.ref).toMatch(/^e\d+$/);
      expect(first.role).toBeDefined();
      expect(typeof first.isEnabled).toBe("boolean");
    }
  }, 20000);
});
