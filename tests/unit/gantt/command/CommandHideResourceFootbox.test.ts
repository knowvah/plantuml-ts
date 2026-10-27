import { describe, expect, it } from 'vitest';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';
import type { GanttDiagram } from '../../../../src/diagrams/gantt/GanttDiagram.js';
import type { DisplayConfigData } from '../../../../src/diagrams/gantt/data/DisplayConfigData.js';
import type { GanttModelData } from '../../../../src/diagrams/gantt/data/GanttModelData.js';
import type { TimeScaleConfigData } from '../../../../src/diagrams/gantt/data/TimeScaleConfigData.js';
import {
  applyCommandHideResourceFootbox,
  CommandHideResourceFootbox,
  COMMAND_HIDE_RESOURCE_FOOTBOX_RE,
} from '../../../../src/diagrams/gantt/command/CommandHideResourceFootbox.js';

/** The protected state members, read for assertions only. */
interface Probe {
  modelData: GanttModelData;
  displayConfig: DisplayConfigData;
  scaleConfig: TimeScaleConfigData;
}
const probe = (d: GanttDiagram): Probe => d as unknown as Probe;

/** Corpus lines: dot-cache gantt in.puml inputs and the gantt fixtures (`hide ressources names/footbox`). */
const MATCHING = [
  'hide ressources footbox',
  'hide resources footbox',
  'hide resource footbox',
  'hide ressource footbox',
  'Hide  Resources  Footbox',
];
const NEAR_MISSES = [
  'hide footbox',
  'hide resourcess footbox',
  'hide resources footbox ',
  'hide resources',
  'show resources footbox',
];

describe('CommandHideResourceFootbox', () => {
  it.each(MATCHING)(
    'regex matches %j (~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandHideResourceFootbox.java:55-61)',
    (line) => {
      expect(COMMAND_HIDE_RESOURCE_FOOTBOX_RE.test(line)).toBe(true);
    },
  );

  it.each(NEAR_MISSES)('regex rejects %j', (line) => {
    expect(COMMAND_HIDE_RESOURCE_FOOTBOX_RE.test(line)).toBe(false);
  });

  it('exports the class-name const as { regex, apply }', () => {
    expect(CommandHideResourceFootbox.regex).toBe(COMMAND_HIDE_RESOURCE_FOOTBOX_RE);
    expect(CommandHideResourceFootbox.apply).toBe(applyCommandHideResourceFootbox);
  });

  it('apply sets the flag (~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandHideResourceFootbox.java:66-67)', () => {
    const diagram = newGantt();
    expect(probe(diagram).displayConfig.isHideResourceFootbox()).toBe(false);
    const match = COMMAND_HIDE_RESOURCE_FOOTBOX_RE.exec(MATCHING[0]!)!;
    const result = applyCommandHideResourceFootbox(diagram, match);
    expect(result.isOk()).toBe(true);
    expect(probe(diagram).displayConfig.isHideResourceFootbox()).toBe(true);
  });
});
