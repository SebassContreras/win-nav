import { ExitCodes, WinNavError } from "../core/errors.js";
import type { DesktopElement, DesktopSnapshot } from "../core/snapshot.js";

export type QAAssertionKind =
  | "assert:visible"
  | "assert:not-visible"
  | "assert:text"
  | "assert:enabled"
  | "assert:disabled"
  | "assert:window-title";

export interface QAAssertion {
  kind: QAAssertionKind;
  target?: string;
  expected?: string | boolean;
  regex?: boolean;
  message?: string;
}

export interface AssertionResult {
  assertion: QAAssertion;
  passed: boolean;
  actual?: unknown;
  error?: string;
}

export interface QAReport {
  passed: boolean;
  total: number;
  passedCount: number;
  failedCount: number;
  results: AssertionResult[];
}

/**
 * Finds an element in the snapshot by ref (e1), automationId, or name.
 */
export function findElementInSnapshot(
  snapshot: DesktopSnapshot,
  target: string
): DesktopElement | undefined {
  const normTarget = target.trim();
  // Strip leading '@' if passed as semantic ref
  const cleanTarget = normTarget.startsWith("@") ? normTarget.slice(1) : normTarget;

  // 1. Exact ref match
  let found = snapshot.elements.find((el) => el.ref === normTarget);
  if (found) return found;

  // 2. AutomationId match
  found = snapshot.elements.find(
    (el) =>
      el.automationId === normTarget ||
      el.automationId === cleanTarget ||
      el.automationId.toLowerCase() === cleanTarget.toLowerCase()
  );
  if (found) return found;

  // 3. Name match
  found = snapshot.elements.find(
    (el) =>
      el.name === normTarget ||
      el.name === cleanTarget ||
      el.name.toLowerCase() === cleanTarget.toLowerCase()
  );
  return found;
}

/**
 * Evaluates a single assertion against a snapshot.
 */
export function evaluateAssertion(
  snapshot: DesktopSnapshot,
  assertion: QAAssertion
): AssertionResult {
  const { kind, target, expected, regex, message } = assertion;

  switch (kind) {
    case "assert:window-title": {
      const actualTitle = snapshot.windowTitle;
      const expectedStr = String(expected ?? "");
      let passed = false;
      if (regex) {
        try {
          passed = new RegExp(expectedStr, "i").test(actualTitle);
        } catch (e) {
          return {
            assertion,
            passed: false,
            actual: actualTitle,
            error: `Invalid regex pattern: ${expectedStr}`,
          };
        }
      } else {
        passed = actualTitle.toLowerCase().includes(expectedStr.toLowerCase());
      }

      return {
        assertion,
        passed,
        actual: actualTitle,
        error: passed
          ? undefined
          : message ?? `Expected window title to match "${expectedStr}", but was "${actualTitle}".`,
      };
    }

    case "assert:visible": {
      if (!target) {
        return {
          assertion,
          passed: false,
          error: "assert:visible requires a target.",
        };
      }
      const el = findElementInSnapshot(snapshot, target);
      const isVisible = el !== undefined && !el.isOffscreen;
      return {
        assertion,
        passed: isVisible,
        actual: el ? (el.isOffscreen ? "offscreen" : "visible") : "not_found",
        error: isVisible
          ? undefined
          : message ?? `Expected element "${target}" to be visible, but it was ${el ? "offscreen" : "not found"}.`,
      };
    }

    case "assert:not-visible": {
      if (!target) {
        return {
          assertion,
          passed: false,
          error: "assert:not-visible requires a target.",
        };
      }
      const el = findElementInSnapshot(snapshot, target);
      const isNotVisible = el === undefined || Boolean(el.isOffscreen);
      return {
        assertion,
        passed: isNotVisible,
        actual: el ? (el.isOffscreen ? "offscreen" : "visible") : "not_found",
        error: isNotVisible
          ? undefined
          : message ?? `Expected element "${target}" to not be visible, but it was visible.`,
      };
    }

    case "assert:enabled": {
      if (!target) {
        return {
          assertion,
          passed: false,
          error: "assert:enabled requires a target.",
        };
      }
      const el = findElementInSnapshot(snapshot, target);
      if (!el) {
        return {
          assertion,
          passed: false,
          actual: "not_found",
          error: message ?? `Element "${target}" was not found in snapshot.`,
        };
      }
      const isEnabled = el.isEnabled === true;
      return {
        assertion,
        passed: isEnabled,
        actual: isEnabled,
        error: isEnabled
          ? undefined
          : message ?? `Expected element "${target}" to be enabled, but isEnabled was false.`,
      };
    }

    case "assert:disabled": {
      if (!target) {
        return {
          assertion,
          passed: false,
          error: "assert:disabled requires a target.",
        };
      }
      const el = findElementInSnapshot(snapshot, target);
      if (!el) {
        return {
          assertion,
          passed: false,
          actual: "not_found",
          error: message ?? `Element "${target}" was not found in snapshot.`,
        };
      }
      const isDisabled = el.isEnabled === false;
      return {
        assertion,
        passed: isDisabled,
        actual: el.isEnabled,
        error: isDisabled
          ? undefined
          : message ?? `Expected element "${target}" to be disabled, but isEnabled was true.`,
      };
    }

    case "assert:text": {
      if (!target) {
        return {
          assertion,
          passed: false,
          error: "assert:text requires a target.",
        };
      }
      const el = findElementInSnapshot(snapshot, target);
      if (!el) {
        return {
          assertion,
          passed: false,
          actual: "not_found",
          error: message ?? `Element "${target}" was not found in snapshot.`,
        };
      }
      const actualText = el.value ?? el.name ?? "";
      const expectedStr = String(expected ?? "");
      let passed = false;
      if (regex) {
        try {
          passed = new RegExp(expectedStr, "i").test(actualText);
        } catch {
          return {
            assertion,
            passed: false,
            actual: actualText,
            error: `Invalid regex pattern: ${expectedStr}`,
          };
        }
      } else {
        passed = actualText.includes(expectedStr);
      }

      return {
        assertion,
        passed,
        actual: actualText,
        error: passed
          ? undefined
          : message ?? `Expected element "${target}" text to match "${expectedStr}", but found "${actualText}".`,
      };
    }

    default:
      return {
        assertion,
        passed: false,
        error: `Unknown assertion kind: ${String(kind)}`,
      };
  }
}

/**
 * Runs a list of assertions against a snapshot and returns structured QAReport.
 */
export function evaluateAssertions(
  snapshot: DesktopSnapshot,
  assertions: QAAssertion[]
): QAReport {
  const results: AssertionResult[] = assertions.map((a) =>
    evaluateAssertion(snapshot, a)
  );
  const failedCount = results.filter((r) => !r.passed).length;
  const passedCount = results.length - failedCount;

  return {
    passed: failedCount === 0,
    total: results.length,
    passedCount,
    failedCount,
    results,
  };
}

/**
 * Evaluates assertions and throws WinNavError(ExitCodes.FAILURE) if any assertion fails.
 */
export function assertQALoop(
  snapshot: DesktopSnapshot,
  assertions: QAAssertion[]
): QAReport {
  const report = evaluateAssertions(snapshot, assertions);
  if (!report.passed) {
    const failureMessages = report.results
      .filter((r) => !r.passed)
      .map((r) => r.error)
      .join("; ");
    throw new WinNavError(
      ExitCodes.FAILURE,
      `QA assertions failed (${report.failedCount}/${report.total}): ${failureMessages}`,
      { report }
    );
  }
  return report;
}
