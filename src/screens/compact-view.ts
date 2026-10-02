import { ScreenDefinition, ScreenJourney } from './screen-map.js';

export function renderCompactView(
  screen: ScreenDefinition,
  journeys: ScreenJourney[] = []
): string {
  const lines: string[] = [];

  const formSuffix = screen.formName ? ` [${screen.formName}]` : '';
  lines.push(`Screen: ${screen.id}${formSuffix} (Pattern: "${screen.titlePattern}")`);

  lines.push('Fields:');
  if (screen.fields.length === 0) {
    lines.push('  (none)');
  } else {
    for (const f of screen.fields) {
      const sensitiveTag = f.sensitive ? ' [SENSITIVE:HUMAN_ONLY]' : '';
      const fillableTag = f.agentFillable ? '' : ' [HUMAN_FILLABLE_ONLY]';
      const reqTag = f.required ? ' *required' : '';
      lines.push(`  @${f.id} [${f.controlType}] "${f.name}"${reqTag}${sensitiveTag}${fillableTag}`);
    }
  }

  lines.push('Actions:');
  if (screen.actions.length === 0) {
    lines.push('  (none)');
  } else {
    for (const a of screen.actions) {
      const requiresTag = a.requires && a.requires.length > 0 ? ` (requires: ${a.requires.map(r => '@' + r).join(', ')})` : '';
      lines.push(`  @${a.id} [${a.controlType}] "${a.name}" [${a.kind}] -> ${a.effect}${requiresTag}`);
    }
  }

  lines.push('Flows:');
  if (screen.flows.length === 0) {
    lines.push('  (none)');
  } else {
    for (const flow of screen.flows) {
      const humanTag = flow.humanOnly ? ' [HUMAN_ONLY]' : '';
      lines.push(`  flow:${flow.id}${humanTag}: ${flow.description}`);
    }
  }

  const applicableJourneys = journeys.filter((j) =>
    j.steps.some((s) => s.screenId === screen.id)
  );

  if (applicableJourneys.length > 0) {
    lines.push('Journeys:');
    for (const j of applicableJourneys) {
      lines.push(`  journey:${j.id}: ${j.description}`);
    }
  }

  return lines.join('\n');
}
