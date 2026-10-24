/**
 * sdd3 T1f: a `\r` / `\l` escape in a message label sets the whole
 * `Display`'s natural alignment, which overrides the component's own.
 *
 *   - `Display.java:290-298`  `getWithNewlines` records the LAST escape:
 *     `\r` -> `naturalHorizontalAlignment = RIGHT`, `\l` -> LEFT.
 *   - `Display.java:648-649`  `create0`:
 *     `if (getNaturalHorizontalAlignment() != null) horizontalAlignment =
 *     getNaturalHorizontalAlignment()`.
 *
 * Expected x offsets are the jar's own output for
 * `tests/corpus/sequence/jigigi-69-bege021.puml`
 * (`test-results/dot-cache/sequence/jigigi-69-bege021/in.svg`), second
 * message `123\n456789\rright\nfin`: the lines start at x = 60.131, 38.438,
 * 56.556, 68.094, i.e. offsets from the widest line (456789, x = 38.438) of
 * 21.693, 0, 18.118, 29.656.
 */
import { describe, it, expect } from 'vitest';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { HorizontalAlignment } from '../../../src/core/klimt/geom/HorizontalAlignment.js';
import { displayLinesAligned, messageLabelLayout } from '../../../src/diagrams/sequence/text-block-geo.js';
import { defaultMessageFont } from '../../../src/diagrams/sequence/sequence-arrow-paint.js';

const JAR_RIGHT_OFFSETS = [21.693, 0, 18.118, 29.656];
const OFFSET_PRECISION = 2;

function offsets(label: string, align?: HorizontalAlignment): number[] {
  const block = messageLabelLayout(
    label,
    undefined,
    defaultMessageFont(),
    { measurer: new DeterministicMeasurer(), theme: {} },
    { align },
  );
  const widest = block.primitives.find((p) => p.text === '456789')!;
  return block.primitives.map((p) => p.x - widest.x);
}

describe('displayLinesAligned (Display.java:290-298)', () => {
  it('reports RIGHT for a backslash-r', () => {
    expect(displayLinesAligned('a\\nbb\\rc')).toEqual({
      lines: ['a', 'bb', 'c'],
      align: HorizontalAlignment.RIGHT,
    });
  });

  it('reports LEFT for a backslash-l', () => {
    expect(displayLinesAligned('a\\lb').align).toBe(HorizontalAlignment.LEFT);
  });

  it('keeps the LAST escape across the whole display', () => {
    expect(displayLinesAligned('a\\rb\\lc').align).toBe(HorizontalAlignment.LEFT);
    expect(displayLinesAligned('a\\lb\\rc').align).toBe(HorizontalAlignment.RIGHT);
  });

  it('reports no alignment when no escape sets one (Display.java:640-649)', () => {
    expect(displayLinesAligned('a\\nbb')).toEqual({ lines: ['a', 'bb'], align: undefined });
  });
});

describe('messageLabelLayout natural alignment (Display.java:648-649)', () => {
  it('right-aligns the whole block whatever the component alignment', () => {
    const got = offsets('123\\n456789\\rright\\nfin', HorizontalAlignment.LEFT);
    JAR_RIGHT_OFFSETS.forEach((want, i) => expect(got[i]).toBeCloseTo(want, OFFSET_PRECISION));
  });

  it('overrides a RIGHT component with a backslash-l', () => {
    expect(offsets('123\\n456789\\lleft\\nfin', HorizontalAlignment.RIGHT)).toEqual([0, 0, 0, 0]);
  });

  it('leaves the component alignment alone with no escape', () => {
    expect(offsets('123\\n456789\\nright\\nfin')).toEqual([0, 0, 0, 0]);
    const right = offsets('123\\n456789\\nright\\nfin', HorizontalAlignment.RIGHT);
    JAR_RIGHT_OFFSETS.forEach((want, i) => expect(right[i]).toBeCloseTo(want, OFFSET_PRECISION));
  });
});
