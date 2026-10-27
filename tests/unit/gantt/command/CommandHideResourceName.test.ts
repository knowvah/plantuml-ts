import { describe, expect, it } from 'vitest';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';
import type { GanttDiagram } from '../../../../src/diagrams/gantt/GanttDiagram.js';
import type { DisplayConfigData } from '../../../../src/diagrams/gantt/data/DisplayConfigData.js';
import type { GanttModelData } from '../../../../src/diagrams/gantt/data/GanttModelData.js';
import type { TimeScaleConfigData } from '../../../../src/diagrams/gantt/data/TimeScaleConfigData.js';
import {
  applyCommandHideResourceName,
  CommandHideResourceName,
  COMMAND_HIDE_RESOURCE_NAME_RE,
} from '../../../../src/diagrams/gantt/command/CommandHideResourceName.js';

/** The protected state members, read for assertions only. */
interface Probe {
  modelData: GanttModelData;
  displayConfig: DisplayConfigData;
  scaleConfig: TimeScaleConfigData;
}
const probe = (d: GanttDiagram): Probe => d as unknown as Probe;

/** Corpus lines: dot-cache gantt in.puml inputs and the gantt fixtures (`hide ressources names/footbox`). */
const MATCHING = [
  'hide ressources names',
  'hide resources names',
  'hide resource name',
  'hide ressource name',
  'HIDE RESOURCES NAMES',
];
const NEAR_MISSES = [
  'hide resources nam',
  'hide resources namess',
  'hide names',
  'hide resources names ',
  'show resources names',
];

describe('CommandHideResourceName', () => {
  it.each(MATCHING)(
    'regex matches %j (~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandHideResourceName.java:55-61)',
    (line) => {
      expect(COMMAND_HIDE_RESOURCE_NAME_RE.test(line)).toBe(true);
    },
  );

  it.each(NEAR_MISSES)('regex rejects %j', (line) => {
    expect(COMMAND_HIDE_RESOURCE_NAME_RE.test(line)).toBe(false);
  });

  it('exports the class-name const as { regex, apply }', () => {
    expect(CommandHideResourceName.regex).toBe(COMMAND_HIDE_RESOURCE_NAME_RE);
    expect(CommandHideResourceName.apply).toBe(applyCommandHideResourceName);
  });

  it('apply sets the flag (~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandHideResourceName.java:66-67)', () => {
    const diagram = newGantt();
    expect(probe(diagram).displayConfig.isHideResourceName()).toBe(false);
    const match = COMMAND_HIDE_RESOURCE_NAME_RE.exec(MATCHING[0]!)!;
    const result = applyCommandHideResourceName(diagram, match);
    expect(result.isOk()).toBe(true);
    expect(probe(diagram).displayConfig.isHideResourceName()).toBe(true);
  });
});
