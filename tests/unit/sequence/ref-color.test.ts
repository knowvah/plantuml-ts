/**
 * sdd1 T3f: `ref#color over …` colours the reference HEADER
 * (`CommandReferenceOverSeveral.java:118-119`,
 * `CommandReferenceMultilinesOverSeveral.java:130-131`: the `REF` group is
 * the `backColorElement`, which `Reference.java:99-101` lays over the
 * header style's `BackGroundColor`). Expected fills are the jar's
 * (`scripts/oracle-render.sh`): `#FFC0CB` for pink, `#ADD8E6` for lightblue.
 */
import { tagsOf } from '../../helpers/svg-tags.js';
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { FrameEvent, FrameGeo, SequenceGeometry } from '../../../src/diagrams/sequence/ast.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { renderSequence } from '../../../src/diagrams/sequence/renderer.js';
import { sequenceSource } from '../../helpers/sequence-source.js';
import { layoutBody } from './frame-paint-fixtures.js';

const measurer = new DeterministicMeasurer();

const REFS = [
  'Alice -> Bob : hello',
  'ref#pink over Alice, Bob : one',
  'ref#lightblue over Alice',
  'two lines',
  'end ref',
];

function refs(geo: SequenceGeometry): FrameGeo[] {
  return geo.events.filter((e): e is FrameGeo => e.kind === 'frame' && e.frameType === 'ref');
}

describe('ref#color (CommandReferenceOverSeveral.java:118-119)', () => {
  it('keeps the colour on both ref forms as the element colour', () => {
    const ast = parseSequence(sequenceSource(REFS));
    if ('refused' in ast) throw new Error(ast.message);
    const frames = ast.events.filter((e): e is FrameEvent => e.kind === 'frame');
    expect(frames.map((f) => f.backColorElement)).toEqual(['#pink', '#lightblue']);
  });

  it('fills each header corner with its colour, the body untouched', () => {
    const geo = layoutBody(REFS.join('\n'), measurer);
    const [one, two] = refs(geo);
    expect(one!.headerPaint!.fill).toBe('#FFC0CB');
    expect(two!.headerPaint!.fill).toBe('#ADD8E6');
    const body = renderSequence(geo, defaultTheme, measurer).body;
    // Jar: `<path d="M12,74 L72,74 …" style="stroke:#000;stroke-width:2;" fill="#FFC0CB"/>`.
    const corners = tagsOf(body, 'path');
    for (const fill of ['#FFC0CB', '#ADD8E6']) {
      expect(
        corners.some(
          (c) => c.d?.startsWith('M') === true && c.fill === fill && c.stroke === '#000' && c['stroke-width'] === '2',
        ),
        fill,
      ).toBe(true);
    }
  });

  it('refuses an unknown colour at the command (CommandExecutionResult.badColor)', () => {
    expect(parseSequence(sequenceSource(['ref#nosuchcolour over A : x']))).toMatchObject({
      refused: true,
      kind: 'execution',
      line: 0,
      message: 'No such color',
    });
    expect(parseSequence(sequenceSource(['ref#nosuchcolour over A', 'x', 'end ref']))).toMatchObject({
      refused: true,
      line: 0,
      message: 'No such color',
    });
  });
});
