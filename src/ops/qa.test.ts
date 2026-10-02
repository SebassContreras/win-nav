import { describe, it, expect } from "vitest";
import { ExitCodes, WinNavError } from "../core/errors.js";
import type { DesktopSnapshot } from "../core/snapshot.js";
import {
  evaluateAssertion,
  evaluateAssertions,
  assertQALoop,
} from "./qa.js";

describe("QA Assertion Engine (qa-loop)", () => {
  const sampleSnapshot: DesktopSnapshot = {
    snapshotId: "snap-qa-1",
    timestamp: new Date().toISOString(),
    processId: 4321,
    windowTitle: "Sigestran v2.4 - Dashboard",
    elements: [
      {
        ref: "e1",
        role: "Button",
        name: "Abrir Ticket",
        automationId: "btnOpenTicket",
        isEnabled: true,
        isOffscreen: false,
      },
      {
        ref: "e2",
        role: "Edit",
        name: "Search Query",
        automationId: "txtSearch",
        value: "admin@enterprise.org",
        isEnabled: true,
        isOffscreen: false,
      },
      {
        ref: "e3",
        role: "Button",
        name: "Delete Everything",
        automationId: "btnDeleteAll",
        isEnabled: false,
        isOffscreen: false,
      },
      {
        ref: "e4",
        role: "Text",
        name: "Hidden Notice",
        automationId: "lblHidden",
        isEnabled: true,
        isOffscreen: true,
      },
    ],
  };

  describe("Window Title Assertions", () => {
    it("should pass when substring is present in windowTitle", () => {
      const res = evaluateAssertion(sampleSnapshot, {
        kind: "assert:window-title",
        expected: "Dashboard",
      });
      expect(res.passed).toBe(true);
    });

    it("should match windowTitle with regex", () => {
      const res = evaluateAssertion(sampleSnapshot, {
        kind: "assert:window-title",
        expected: "Sigestran v\\d+\\.\\d+",
        regex: true,
      });
      expect(res.passed).toBe(true);
    });

    it("should fail when title does not match", () => {
      const res = evaluateAssertion(sampleSnapshot, {
        kind: "assert:window-title",
        expected: "Settings",
      });
      expect(res.passed).toBe(false);
      expect(res.error).toBeDefined();
    });
  });

  describe("Visibility Assertions", () => {
    it("should pass assert:visible for on-screen element", () => {
      const res = evaluateAssertion(sampleSnapshot, {
        kind: "assert:visible",
        target: "e1",
      });
      expect(res.passed).toBe(true);
    });

    it("should fail assert:visible for off-screen element", () => {
      const res = evaluateAssertion(sampleSnapshot, {
        kind: "assert:visible",
        target: "lblHidden",
      });
      expect(res.passed).toBe(false);
    });

    it("should pass assert:not-visible for off-screen element", () => {
      const res = evaluateAssertion(sampleSnapshot, {
        kind: "assert:not-visible",
        target: "lblHidden",
      });
      expect(res.passed).toBe(true);
    });
  });

  describe("Enabled / Disabled Assertions", () => {
    it("should verify element is enabled", () => {
      const res = evaluateAssertion(sampleSnapshot, {
        kind: "assert:enabled",
        target: "btnOpenTicket",
      });
      expect(res.passed).toBe(true);
    });

    it("should verify element is disabled", () => {
      const res = evaluateAssertion(sampleSnapshot, {
        kind: "assert:disabled",
        target: "btnDeleteAll",
      });
      expect(res.passed).toBe(true);
    });

    it("should fail assert:enabled for disabled element", () => {
      const res = evaluateAssertion(sampleSnapshot, {
        kind: "assert:enabled",
        target: "btnDeleteAll",
      });
      expect(res.passed).toBe(false);
    });
  });

  describe("Text Content Assertions", () => {
    it("should match text in edit field", () => {
      const res = evaluateAssertion(sampleSnapshot, {
        kind: "assert:text",
        target: "txtSearch",
        expected: "admin@enterprise.org",
      });
      expect(res.passed).toBe(true);
    });

    it("should match text with regex pattern", () => {
      const res = evaluateAssertion(sampleSnapshot, {
        kind: "assert:text",
        target: "txtSearch",
        expected: "^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$",
        regex: true,
      });
      expect(res.passed).toBe(true);
    });
  });

  describe("assertQALoop Execution and Error Reporting", () => {
    it("should return report when all assertions pass", () => {
      const report = assertQALoop(sampleSnapshot, [
        { kind: "assert:window-title", expected: "Dashboard" },
        { kind: "assert:visible", target: "btnOpenTicket" },
        { kind: "assert:text", target: "txtSearch", expected: "admin@" },
      ]);
      expect(report.passed).toBe(true);
      expect(report.total).toBe(3);
      expect(report.passedCount).toBe(3);
      expect(report.failedCount).toBe(0);
    });

    it("should throw WinNavError with exit code 1 when an assertion fails", () => {
      expect(() =>
        assertQALoop(sampleSnapshot, [
          { kind: "assert:window-title", expected: "Dashboard" },
          { kind: "assert:visible", target: "nonExistentRef" },
        ])
      ).toThrowError(WinNavError);

      try {
        assertQALoop(sampleSnapshot, [
          { kind: "assert:visible", target: "nonExistentRef" },
        ]);
      } catch (err: any) {
        expect(err.exitCode).toBe(ExitCodes.FAILURE);
        expect(err.code).toBe("failure");
      }
    });
  });
});
