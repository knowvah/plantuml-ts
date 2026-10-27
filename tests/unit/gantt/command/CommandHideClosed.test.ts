import { describe, expect, it } from 'vitest';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';
import type { GanttDiagram } from '../../../../src/diagrams/gantt/GanttDiagram.js';
import type { DisplayConfigData } from '../../../../src/diagrams/gantt/data/DisplayConfigData.js';
import type { GanttModelData } from '../../../../src/diagrams/gantt/data/GanttModelData.js';
import type { TimeScaleConfigData } from '../../../../src/diagrams/gantt/data/TimeScaleConfigData.js';
import {
  applyCommandHideClosed,
  CommandHideClosed,
  COMMAND_HIDE_CLOSED_RE,
} from '../../../../src/diagrams/gantt/command/CommandHideClosed.js';

/** The protected state members, read for assertions only. */
interface Probe {
  modelData: GanttModelData;
  displayConfig: DisplayConfigData;
  scaleConfig: TimeScaleConfigData;
}
const probe = (d: GanttDiagram): Probe => d as unknown as Probe;

/** Corpus lines: dot-cache gantt in.puml inputs and the gantt fixtures (`hide ressources names/footbox`). */
const MATCHING = ['hide closed', 'HIDE  closed', 'hide\xa0closed'];
const NEAR_MISSES = ['hide closed ', 'hide', 'hidden closed', 'hide closed!', 'xhide closed'];

describe('CommandHideClosed', () => {
  it.each(MATCHING)(
    'regex matches %j (~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandHideClosed.java:55-61)',
    (line) => {
      expect(COMMAND_HIDE_CLOSED_RE.test(line)).toBe(true);
    },
  );

  it.each(NEAR_MISSES)('regex rejects %j', (line) => {
    expect(COMMAND_HIDE_CLOSED_RE.test(line)).toBe(false);
  });

  it('exports the class-name const as { regex, apply }', () => {
    expect(CommandHideClosed.regex).toBe(COMMAND_HIDE_CLOSED_RE);
    expect(CommandHideClosed.apply).toBe(applyCommandHideClosed);
  });

  it('apply sets the flag (~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandHideClosed.java:63-66)', () => {
    const diagram = newGantt();
    expect(probe(diagram).scaleConfig.isHideClosed()).toBe(false);
    const match = COMMAND_HIDE_CLOSED_RE.exec(MATCHING[0]!)!;
    const result = applyCommandHideClosed(diagram, match);
    expect(result.isOk()).toBe(true);
    expect(probe(diagram).scaleConfig.isHideClosed()).toBe(true);
  });
});
