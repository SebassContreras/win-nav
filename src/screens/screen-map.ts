import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { WinNavError, ExitCodes } from '../core/errors.js';

export interface ScreenLocator {
  controlType: string;
  automationId?: string;
  name?: string;
  className?: string;
  occurrence?: number;
}

export interface ScreenField {
  id: string;
  controlType: string;
  name: string;
  automationId?: string;
  container?: string;
  required?: boolean;
  sensitive: boolean;
  agentFillable: boolean;
  locator: ScreenLocator;
}

export interface ScreenAction {
  id: string;
  controlType: string;
  name: string;
  automationId?: string;
  kind: 'button' | 'menuitem' | 'toggle' | 'tab' | 'invoke';
  effect: 'none' | 'ui-state' | 'submit';
  requires?: string[];
  locator: ScreenLocator;
}

export interface ScreenStep {
  op: 'fill' | 'click' | 'select';
  target: string;
  from?: string;
}

export interface ScreenFlow {
  id: string;
  description: string;
  humanOnly: boolean;
  inputSchema: Record<string, unknown>;
  steps: ScreenStep[];
}

export interface ScreenDefinition {
  id: string;
  titlePattern: string;
  formName?: string;
  fingerprint?: string;
  observedAt: string;
  fields: ScreenField[];
  actions: ScreenAction[];
  flows: ScreenFlow[];
}

export interface ScreenJourneyStep {
  screenId: string;
  action: string;
  inputs?: Record<string, unknown>;
  expectScreen?: string;
}

export interface ScreenJourney {
  id: string;
  description: string;
  humanOnly?: boolean;
  inputSchema?: Record<string, unknown>;
  steps: ScreenJourneyStep[];
}

export interface ScreenUnmapped {
  windowTitle?: string;
  reason: 'modal-dialog' | 'not-visited' | 'admin-required';
  discoveredFrom?: string;
  note?: string;
}

export interface ScreenMapApp {
  id: string;
  name: string;
  processName: string;
  executablePath?: string;
  version?: string;
  locale?: string;
  learnedAt: string;
}

export interface DesktopScreenMap {
  $schema?: string;
  schemaVersion: string;
  app: ScreenMapApp;
  screens: ScreenDefinition[];
  journeys?: ScreenJourney[];
  unmapped?: ScreenUnmapped[];
}

// Locate schema relative to module or project root
function getSchemaPath(): string {
  const possiblePaths = [
    path.resolve(process.cwd(), 'schemas/screen-map.schema.json'),
    path.resolve(import.meta.dirname ?? '.', '../../schemas/screen-map.schema.json'),
    path.resolve(import.meta.dirname ?? '.', '../schemas/screen-map.schema.json'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

    throw new WinNavError(ExitCodes.FAILURE, 'Screen map schema file not found in known paths');
}

let validatorCache: any = null;

export function getScreenMapValidator(): any {
  if (validatorCache) {
    return validatorCache;
  }

  const schemaPath = getSchemaPath();
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const schema = JSON.parse(schemaContent);

  const AjvClass: any = (Ajv2020 as any).default ?? Ajv2020;
  const ajv = new AjvClass({ allErrors: true });
  const addFormatsFn: any = (addFormats as any).default ?? addFormats;
  addFormatsFn(ajv);

  validatorCache = ajv.compile(schema);
  return validatorCache;
}

export function validateScreenMap(data: unknown): DesktopScreenMap {
  const validator = getScreenMapValidator();
  const valid = validator(data);
  if (!valid) {
    const errorDetails = validator.errors
      ?.map((err: any) => `${err.instancePath || '/'} ${err.message}`)
      .join('; ');
    throw new WinNavError(
      ExitCodes.INVALID_ARGS,
      `Screen map validation failed: ${errorDetails}`
    );
  }
  return data as DesktopScreenMap;
}

export function loadScreenMap(filePath: string): DesktopScreenMap {
  if (!fs.existsSync(filePath)) {
    throw new WinNavError(ExitCodes.INVALID_ARGS, `Screen map file not found: ${filePath}`);
  }

  let parsed: unknown;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    parsed = JSON.parse(content);
  } catch (err: unknown) {
    throw new WinNavError(
      ExitCodes.INVALID_ARGS,
      `Failed to parse screen map JSON at ${filePath}: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return validateScreenMap(parsed);
}

export function saveScreenMap(filePath: string, map: DesktopScreenMap): void {
  validateScreenMap(map);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(map, null, 2), 'utf8');
}

export interface ResolvedSemanticTarget {
  type: 'field' | 'action';
  item: ScreenField | ScreenAction;
  locator: ScreenLocator;
}

export function resolveSemanticTarget(
  screen: ScreenDefinition,
  targetId: string
): ResolvedSemanticTarget {
  const cleanId = targetId.startsWith('@') ? targetId.slice(1) : targetId;

  // Search in actions first
  const action = screen.actions.find((a) => a.id === cleanId);
  if (action) {
    return {
      type: 'action',
      item: action,
      locator: action.locator,
    };
  }

  // Search in fields
  const field = screen.fields.find((f) => f.id === cleanId);
  if (field) {
    return {
      type: 'field',
      item: field,
      locator: field.locator,
    };
  }

  throw new WinNavError(
    ExitCodes.UNKNOWN_TARGET,
    `Target '@${cleanId}' not found on screen '${screen.id}'`
  );
}
