import crypto from 'node:crypto';
import { DesktopSnapshot, DesktopElement } from '../core/snapshot.js';
import {
  ScreenDefinition,
  ScreenField,
  ScreenAction,
  DesktopScreenMap,
  ScreenLocator,
} from './screen-map.js';

export function toSlug(text: string): string {
  const slug = text
    // Normalize unicode accents (e.g. á -> a, é -> e)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Split camelCase or PascalCase into words
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'item';
}

function calculateFingerprint(elements: DesktopElement[]): string {
  const lines = elements
    .map(
      (e) =>
        `${e.role}\t${e.automationId ?? ''}\t${e.name ?? ''}\t${e.className ?? ''}`
    )
    .sort();

  return crypto.createHash('sha256').update(lines.join('\n')).digest('hex');
}

export function learnScreenFromSnapshot(
  snapshot: DesktopSnapshot,
  options?: {
    screenId?: string;
    formName?: string;
    titlePattern?: string;
  }
): ScreenDefinition {
  const usedSlugs = new Set<string>();

  function getUniqueSlug(candidate: string): string {
    let slug = toSlug(candidate);
    let count = 1;
    let unique = slug;
    while (usedSlugs.has(unique)) {
      count++;
      unique = `${slug}-${count}`;
    }
    usedSlugs.add(unique);
    return unique;
  }

  const fields: ScreenField[] = [];
  const actions: ScreenAction[] = [];

  const fieldTypes = new Set(['Edit', 'ComboBox', 'Spinner', 'Document']);
  const actionTypes = new Set([
    'Button',
    'MenuItem',
    'TabItem',
    'CheckBox',
    'RadioButton',
    'Hyperlink',
    'SplitButton',
  ]);

  for (const el of snapshot.elements) {
    if (el.isOffscreen) {
      continue;
    }

    const role = el.role;
    const candidateName = el.automationId || el.name || role;
    const slug = getUniqueSlug(candidateName);

    const locator: ScreenLocator = {
      controlType: role,
      ...(el.automationId ? { automationId: el.automationId } : {}),
      ...(el.name ? { name: el.name } : {}),
      ...(el.className ? { className: el.className } : {}),
    };

    if (fieldTypes.has(role)) {
      const isSensitive = el.isPassword === true;
      fields.push({
        id: slug,
        controlType: role,
        name: el.name || el.automationId || slug,
        ...(el.automationId ? { automationId: el.automationId } : {}),
        sensitive: isSensitive,
        agentFillable: !isSensitive,
        locator,
      });
    } else if (actionTypes.has(role)) {
      let kind: ScreenAction['kind'] = 'button';
      if (role === 'TabItem') kind = 'tab';
      else if (role === 'MenuItem') kind = 'menuitem';
      else if (role === 'CheckBox' || role === 'RadioButton') kind = 'toggle';

      const lowerName = (el.name || el.automationId || '').toLowerCase();
      let effect: ScreenAction['effect'] = 'ui-state';
      if (/save|guardar|enviar|submit|aceptar|confirmar|delete|eliminar/.test(lowerName)) {
        effect = 'submit';
      }

      actions.push({
        id: slug,
        controlType: role,
        name: el.name || el.automationId || slug,
        ...(el.automationId ? { automationId: el.automationId } : {}),
        kind,
        effect,
        locator,
      });
    }
  }

  const screenId = options?.screenId || toSlug(snapshot.windowTitle || 'main-window');
  const titlePattern =
    options?.titlePattern ||
    (snapshot.windowTitle
      ? `^${snapshot.windowTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*`
      : '.*');

  return {
    id: screenId,
    titlePattern,
    ...(options?.formName ? { formName: options.formName } : {}),
    fingerprint: calculateFingerprint(snapshot.elements),
    observedAt: snapshot.timestamp,
    fields,
    actions,
    flows: [],
  };
}

export function mergeScreenIntoMap(
  screenMap: DesktopScreenMap,
  newScreen: ScreenDefinition
): DesktopScreenMap {
  const existingIndex = screenMap.screens.findIndex((s) => s.id === newScreen.id);

  let updatedScreens: ScreenDefinition[];
  if (existingIndex >= 0) {
    updatedScreens = [...screenMap.screens];
    updatedScreens[existingIndex] = newScreen;
  } else {
    updatedScreens = [...screenMap.screens, newScreen];
  }

  return {
    ...screenMap,
    screens: updatedScreens,
    app: {
      ...screenMap.app,
      learnedAt: new Date().toISOString(),
    },
  };
}
