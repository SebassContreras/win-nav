import { ExitCodes, WinNavError } from "./errors.js";
import type { DesktopElement } from "./snapshot.js";
import { RefStore, defaultRefStore } from "./ref-store.js";
import { SecurityGate, defaultSecurityGate } from "./security-gate.js";

export type ActionType = "click" | "fill" | "select" | "toggle" | "invoke";

export interface ActionRequest {
  action: ActionType;
  target: string | DesktopElement;
  value?: string;
  isArmed?: boolean;
  snapshotId?: string;
  processName?: string;
  allowedProcesses?: string[];
}

export interface ActionResult {
  action: ActionType;
  element: DesktopElement;
  isArmed: boolean;
  success: boolean;
  preview: string;
  details?: Record<string, unknown>;
}

export interface ActionDriver {
  executeAction(
    action: ActionType,
    element: DesktopElement,
    value?: string
  ): Promise<void>;
}

export class ActionExecutor {
  constructor(
    private readonly securityGate: SecurityGate = defaultSecurityGate,
    private readonly refStore: RefStore = defaultRefStore,
    private driver?: ActionDriver
  ) {}

  setActionDriver(driver: ActionDriver): void {
    this.driver = driver;
  }

  getActionDriver(): ActionDriver | undefined {
    return this.driver;
  }

  async execute(request: ActionRequest): Promise<ActionResult> {
    const isArmed = Boolean(request.isArmed);
    const action = request.action;

    // 1. Resolve element
    let element: DesktopElement;
    if (typeof request.target === "string") {
      element = this.refStore.resolveRef(request.target, request.snapshotId);
    } else {
      element = request.target;
    }

    // 2. Validate actionable state
    if (!element.isEnabled) {
      throw new WinNavError(
        ExitCodes.NOT_ACTIONABLE,
        `Target element '${element.ref}' (${element.name || element.automationId}) is disabled and cannot be acted upon.`,
        { ref: element.ref, automationId: element.automationId }
      );
    }

    // 3. Security validation
    await this.securityGate.validateTarget(
      element,
      isArmed ? request.processName : undefined,
      request.allowedProcesses
    );

    const desc = element.name
      ? `'${element.name}' (${element.ref})`
      : `'${element.automationId}' (${element.ref})`;

    // 4. Dry-run handling
    if (!isArmed) {
      let previewText: string;
      switch (action) {
        case "click":
          previewText = `[DRY-RUN] Would click ${element.role} ${desc}`;
          break;
        case "fill":
          previewText = `[DRY-RUN] Would fill ${element.role} ${desc} with value "${request.value ?? ""}"`;
          break;
        case "select":
          previewText = `[DRY-RUN] Would select "${request.value ?? ""}" in ${element.role} ${desc}`;
          break;
        case "toggle":
          previewText = `[DRY-RUN] Would toggle ${element.role} ${desc}`;
          break;
        case "invoke":
          previewText = `[DRY-RUN] Would invoke default pattern on ${element.role} ${desc}`;
          break;
      }

      return {
        action,
        element,
        isArmed: false,
        success: true,
        preview: previewText,
      };
    }

    // 5. Armed execution
    if (this.driver) {
      try {
        await this.driver.executeAction(action, element, request.value);
      } catch (err: unknown) {
        if (err instanceof WinNavError) {
          throw err;
        }
        throw new WinNavError(
          ExitCodes.PROTOCOL,
          `Driver execution failed for ${action} on ${element.ref}: ${
            err instanceof Error ? err.message : String(err)
          }`,
          { originalError: err }
        );
      }
    }

    // 6. Invalidate ref store on armed mutation
    this.refStore.invalidate(`Armed action '${action}' executed on '${element.ref}'`);

    let armedText: string;
    switch (action) {
      case "click":
        armedText = `[ARMED] Clicked ${element.role} ${desc}`;
        break;
      case "fill":
        armedText = `[ARMED] Filled ${element.role} ${desc} with "${request.value ?? ""}"`;
        break;
      case "select":
        armedText = `[ARMED] Selected "${request.value ?? ""}" in ${element.role} ${desc}`;
        break;
      case "toggle":
        armedText = `[ARMED] Toggled ${element.role} ${desc}`;
        break;
      case "invoke":
        armedText = `[ARMED] Invoked default pattern on ${element.role} ${desc}`;
        break;
    }

    return {
      action,
      element,
      isArmed: true,
      success: true,
      preview: armedText,
    };
  }
}

export const defaultActionExecutor = new ActionExecutor();
