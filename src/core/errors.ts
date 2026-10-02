/**
 * win-nav error taxonomy and exit codes.
 * Conforms to AGENTS.md error specifications.
 */

export const ExitCodes = {
  OK: 0,
  FAILURE: 1,
  INVALID_ARGS: 2,
  STALE_REF: 3,
  NO_WINDOW: 4,
  SESSION_BUSY: 5,
  ORIGIN_BLOCKED: 6,
  KILL_SWITCH: 7,
  NOT_ACTIONABLE: 8,
  TIMEOUT: 9,
  PROTOCOL: 10,
  SENSITIVE_TARGET: 11,
  UNKNOWN_TARGET: 12,
  UNMAPPED_SCREEN: 13,
  JOURNEY_STEP_FAILED: 14,
} as const;

export type ExitCode = (typeof ExitCodes)[keyof typeof ExitCodes];

export const ErrorCodeMap: Record<ExitCode, string> = {
  [ExitCodes.OK]: "ok",
  [ExitCodes.FAILURE]: "failure",
  [ExitCodes.INVALID_ARGS]: "invalid_args",
  [ExitCodes.STALE_REF]: "stale_ref",
  [ExitCodes.NO_WINDOW]: "no_browser", // or no_window
  [ExitCodes.SESSION_BUSY]: "session_busy",
  [ExitCodes.ORIGIN_BLOCKED]: "origin_blocked",
  [ExitCodes.KILL_SWITCH]: "kill_switch",
  [ExitCodes.NOT_ACTIONABLE]: "not_actionable",
  [ExitCodes.TIMEOUT]: "timeout",
  [ExitCodes.PROTOCOL]: "protocol",
  [ExitCodes.SENSITIVE_TARGET]: "sensitive_target",
  [ExitCodes.UNKNOWN_TARGET]: "unknown_target",
  [ExitCodes.UNMAPPED_SCREEN]: "unmapped_screen",
  [ExitCodes.JOURNEY_STEP_FAILED]: "journey_step_failed",
};

export type ErrorCode =
  | "ok"
  | "failure"
  | "invalid_args"
  | "stale_ref"
  | "no_browser"
  | "no_window"
  | "session_busy"
  | "origin_blocked"
  | "kill_switch"
  | "not_actionable"
  | "timeout"
  | "protocol"
  | "sensitive_target"
  | "unknown_target"
  | "unmapped_screen"
  | "journey_step_failed";

export class WinNavError extends Error {
  readonly exitCode: ExitCode;
  readonly code: ErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(
    exitCode: ExitCode,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "WinNavError";
    this.exitCode = exitCode;
    this.code = (ErrorCodeMap[exitCode] ?? "failure") as ErrorCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
