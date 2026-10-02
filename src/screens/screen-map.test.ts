import { describe, it, expect } from 'vitest';
import {
  validateScreenMap,
  resolveSemanticTarget,
  DesktopScreenMap,
  ScreenDefinition,
} from './screen-map.js';
import { matchScreen } from './matcher.js';
import { renderCompactView } from './compact-view.js';
import { learnScreenFromSnapshot, mergeScreenIntoMap } from './learn.js';
import { DesktopSnapshot } from '../core/snapshot.js';
import { ExitCodes, WinNavError } from '../core/errors.js';

describe('Screen Map Subsystem', () => {
  const validMap: DesktopScreenMap = {
    schemaVersion: '1.0.0',
    app: {
      id: 'sigestran',
      name: 'Sigestran',
      processName: 'Sigestran.exe',
      learnedAt: '2026-10-02T15:38:00Z',
    },
    screens: [
      {
        id: 'menu-principal',
        titlePattern: '^Menu Principal.*',
        formName: 'MainForm',
        observedAt: '2026-10-02T15:38:00Z',
        fields: [
          {
            id: 'buscar-usuario',
            controlType: 'Edit',
            name: 'Search',
            automationId: 'Search',
            sensitive: false,
            agentFillable: true,
            locator: { controlType: 'Edit', automationId: 'Search' },
          },
          {
            id: 'password-input',
            controlType: 'Edit',
            name: 'Password',
            sensitive: true,
            agentFillable: false,
            locator: { controlType: 'Edit', name: 'Password' },
          },
        ],
        actions: [
          {
            id: 'abrir-ticket',
            controlType: 'Button',
            name: 'BtnAbrirTicket',
            automationId: 'BtnAbrirTicket',
            kind: 'button',
            effect: 'ui-state',
            locator: { controlType: 'Button', automationId: 'BtnAbrirTicket' },
          },
        ],
        flows: [
          {
            id: 'buscar-flujo',
            description: 'Busca un usuario',
            humanOnly: false,
            inputSchema: { type: 'object' },
            steps: [{ op: 'fill', target: '@buscar-usuario', from: 'query' }],
          },
        ],
      },
    ],
    journeys: [
      {
        id: 'nuevo-ticket',
        description: 'Abre ventana nuevo ticket',
        steps: [
          {
            screenId: 'menu-principal',
            action: 'click:@abrir-ticket',
            expectScreen: 'ticket-dialog',
          },
        ],
      },
    ],
  };

  it('validates a correct screen map successfully', () => {
    const validated = validateScreenMap(validMap);
    expect(validated.app.id).toBe('sigestran');
    expect(validated.screens.length).toBe(1);
  });

  it('throws WinNavError when schema validation fails', () => {
    const invalidMap = { ...validMap, schemaVersion: 'invalid-semver' };
    expect(() => validateScreenMap(invalidMap)).toThrow(WinNavError);

    try {
      validateScreenMap(invalidMap);
    } catch (e: any) {
      expect(e.exitCode).toBe(ExitCodes.INVALID_ARGS);
    }
  });

  it('resolves semantic targets for fields and actions', () => {
    const screen = validMap.screens[0];

    const actionRes = resolveSemanticTarget(screen, '@abrir-ticket');
    expect(actionRes.type).toBe('action');
    expect(actionRes.item.name).toBe('BtnAbrirTicket');

    const fieldRes = resolveSemanticTarget(screen, '@buscar-usuario');
    expect(fieldRes.type).toBe('field');
    expect(fieldRes.item.name).toBe('Search');

    expect(() => resolveSemanticTarget(screen, '@inexistente')).toThrow(WinNavError);
    try {
      resolveSemanticTarget(screen, '@inexistente');
    } catch (e: any) {
      expect(e.exitCode).toBe(ExitCodes.UNKNOWN_TARGET);
    }
  });

  it('matches windows by title pattern and form name', () => {
    const screens = validMap.screens;

    const matched = matchScreen({ title: 'Menu Principal - Empresa S.A.' }, screens);
    expect(matched).not.toBeNull();
    expect(matched?.id).toBe('menu-principal');

    const notMatched = matchScreen({ title: 'Calculadora' }, screens);
    expect(notMatched).toBeNull();

    const formMismatch = matchScreen(
      { title: 'Menu Principal - Empresa S.A.', formName: 'OtherForm' },
      screens
    );
    expect(formMismatch).toBeNull();
  });

  it('renders a token-efficient compact view', () => {
    const screen = validMap.screens[0];
    const text = renderCompactView(screen, validMap.journeys);

    expect(text).toContain('Screen: menu-principal [MainForm]');
    expect(text).toContain('@buscar-usuario [Edit]');
    expect(text).toContain('[SENSITIVE:HUMAN_ONLY]');
    expect(text).toContain('@abrir-ticket [Button]');
    expect(text).toContain('journey:nuevo-ticket');
  });

  it('learns a screen definition from a snapshot and merges it', () => {
    const snapshot: DesktopSnapshot = {
      snapshotId: 'snap-1',
      processId: 1234,
      windowTitle: 'Pizarra de Tráfico',
      timestamp: '2026-10-02T16:00:00Z',
      elements: [
        {
          ref: 'e1',
          role: 'Edit',
          name: 'TxtFiltro',
          automationId: 'TxtFiltro',
          isEnabled: true,
          isOffscreen: false,
          isPassword: false,
        },
        {
          ref: 'e2',
          role: 'Button',
          name: 'BtnActualizar',
          automationId: 'BtnActualizar',
          isEnabled: true,
          isOffscreen: false,
          isPassword: false,
        },
      ],
    };

    const learned = learnScreenFromSnapshot(snapshot);
    expect(learned.id).toBe('pizarra-de-trafico');
    expect(learned.fields.length).toBe(1);
    expect(learned.fields[0].id).toBe('txt-filtro');
    expect(learned.actions.length).toBe(1);
    expect(learned.actions[0].id).toBe('btn-actualizar');
    expect(learned.fingerprint).toBeDefined();

    const merged = mergeScreenIntoMap(validMap, learned);
    expect(merged.screens.length).toBe(2);
    expect(merged.screens[1].id).toBe('pizarra-de-trafico');

    // Re-validate merged screen map against JSON Schema
    const revalidated = validateScreenMap(merged);
    expect(revalidated.screens.length).toBe(2);
  });
});
