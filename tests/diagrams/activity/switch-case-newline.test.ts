/**
 * add4-T1f (SWITCH-NL): `CommandCase#executeArg` passes the case label
 * through `Display.getWithNewlines` (`CommandCase.java:87`), so `\n` is a
 * line break. The label is a LEFT-aligned Sheet (`Branch.java:247-257`)
 * whose stripes stack by the bounder's height (`SheetBlock1.java:146-148`),
 * which is the font size under the deterministic bounder
 * (`StringBounderFromWidthTable.java:69-71`). Every line is drawn.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { activityPlugin } from '../../../src/diagrams/activity/index.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { parseAst } from '../../helpers/parse-ast.js';
import { renderActivityFixture, textOccurrences } from '../../helpers/activity-text-position.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const T1A_ROOT = join(HERE, '../../fixtures/activity/add4-T1a');

/** `[x, y]` of every `<text>` whose content is exactly `label`. */
function positions(svg: string, label: string): [number, number][] {
  const re = new RegExp(`<text\\b[^>]*?\\sx="([^"]*)" y="([^"]*)"[^>]*>${label}</text>`, 'g');
  return [...svg.matchAll(re)].map((m) => [Number(m[1]), Number(m[2])]);
}

describe('switch case label newlines', () => {
  it('parse: `\\n` in a case label becomes a real newline', () => {
    const block: UmlSource = { lines: ['switch (x)', 'case (one\\nline)', ':A;', 'endswitch'], type: 'activity' };
    const sw = parseAst(activityPlugin, block).nodes[0];
    expect(sw?.kind === 'switch' ? sw.cases[0]?.label : undefined).toBe('one\nline');
  });

  it('small-3line: every label line is drawn, as often as the jar draws it', () => {
    const { ours, golden } = renderActivityFixture(T1A_ROOT, 'small-3line');
    for (const t of ['one', 'two', 'three', 'line', 'more'])
      expect(textOccurrences(ours, t), t).toBe(textOccurrences(golden, t));
  });

  it('small-3line: the lines of one label share x and stack 11 px apart, as in the jar', () => {
    const { ours, golden } = renderActivityFixture(T1A_ROOT, 'small-3line');
    const stack = (svg: string): number[][] => {
      const [first] = positions(svg, 'one');
      const rest = ['line', 'more'].map((l) => positions(svg, l).find(([x]) => x === first![0])!);
      return [first!, ...rest].map(([x, y], i, all) => [x - all[0]![0], y - all[0]![1], i]);
    };
    expect(stack(ours)).toEqual(stack(golden));
    expect(stack(golden).map((p) => p[1])).toEqual([0, 11, 22]);
  });
});
