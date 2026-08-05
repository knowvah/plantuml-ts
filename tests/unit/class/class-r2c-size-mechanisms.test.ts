/**
 * Mission A2s round 2, task R2c — jar-derived size mechanisms:
 *
 * 1. A generic type-parameter tag whose text carries `\n` line-break
 *    escapes (extracted from a QUOTED display like
 *    `class "MapOrderContent\n<two_dims_td,\nLessY<...>>>" as x`) is a
 *    MULTI-LINE block upstream — `EntityImageClassHeader.java:146`
 *    `Display.getWithNewlines(pragma, generic).create(...)` — so its
 *    measured width is the WIDEST line (not the raw unsplit string) and
 *    its height stacks one atom-line per split line.
 *    Jar probes (deterministic text, R2c scratchpad `ps/g4`, `ps/g1`):
 *    `"X\n<aaaa,\nbbbb,\ncccc,\ndddd>"` → node 75.3625x52
 *    (52 = 4 lines * 12 + 4 margins); `"X\n<aaaa>"` → 38 tall
 *    (generic 12+4=16 dominated by the 2-line name row).
 *
 * 2. Every creole text atom's line height floors at 10px —
 *    `AtomText.java:179-181` (`if (h < 10) h = 10;`) — visible whenever a
 *    class font is set below 10pt. Jar probes:
 *    - member rows (`classAttributeFontSize 6|8|10` all → node height 58 =
 *      badge 32 + fields (8 + 10) + methods 8; 12 → 60; 18 → 66),
 *    - header name lines (`hide circle` + `classFontSize 6` → 50 =
 *      (10+10) + (8+14) + 8, vs 12 → 52),
 *    - generic tag lines (`classStereotypeFontSize 6` on the 4-line
 *      generic above → 44 = 4*10 + 4).
 */
import { describe, it, expect } from 'vitest';
import {
  measureGenericTagDim,
  CLASS_STEREOTYPE_FONT_SIZE,
} from '../../../src/diagrams/class/class-stereotype.js';
import { measureClassifier } from '../../../src/diagrams/class/class-layout-helpers.js';
import type { Classifier } from '../../../src/diagrams/class/ast.js';
import { defaultTheme, deepMergeTheme } from '../../../src/core/theme.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';

const measurer = new WidthTableMeasurer();
const STEREO_FONT = { family: 'sans-serif', size: CLASS_STEREOTYPE_FONT_SIZE };

function makeClassifier(overrides?: Partial<Classifier>): Classifier {
  return {
    id: 'foo',
    display: 'foo',
    kind: 'class',
    typeParams: [],
    members: [],
    ...overrides,
  };
}

describe('measureGenericTagDim with \\n line breaks (R2c item 1)', () => {
  // julixi-10-jide878 / rulite-35-muno361: `contenty`'s generic clause
  // `two_dims_td,\nLessY<Element<two_dims_td>>` — 2 lines upstream.
  it('measures the WIDEST split line, not the raw unsplit string', () => {
    const raw = 'two_dims_td,\\nLessY<Element<two_dims_td>>';
    const dim = measureGenericTagDim(['x'], 'sans-serif', measurer, undefined, raw);
    const w1 = measurer.measure('two_dims_td,', STEREO_FONT).width;
    const w2 = measurer.measure('LessY<Element<two_dims_td>>', STEREO_FONT).width;
    // jar b-probe SVG: `textLength="172.95"` for the widest line (widths
    // are javaRound4-rounded per line, matching the jar's 4-decimal SVG).
    expect(dim?.rawTextWidth).toBeCloseTo(Math.max(w1, w2), 4);
    expect(dim?.rawTextWidth).toBe(172.95);
    expect(dim?.width).toBeCloseTo(Math.max(w1, w2) + 4, 4);
  });

  it('stacks one 12px line per split line + the 4px double margin ' +
    '(jar g4 probe: 4 lines -> 52)', () => {
    const raw = 'aaaa,\\nbbbb,\\ncccc,\\ndddd';
    const dim = measureGenericTagDim(['x'], 'sans-serif', measurer, undefined, raw);
    expect(dim?.height).toBe(4 * CLASS_STEREOTYPE_FONT_SIZE + 4);
  });

  it('keeps the single-line formula byte-identical (height = fontSize + 4)', () => {
    const dim = measureGenericTagDim(['Param'], 'sans-serif', measurer);
    expect(dim?.height).toBe(CLASS_STEREOTYPE_FONT_SIZE + 4);
  });

  it('floors each line at 10px below a 10pt font (AtomText.java:180-181; ' +
    'jar g4f probe: 4 lines at 6pt -> 44)', () => {
    const raw = 'aaaa,\\nbbbb,\\ncccc,\\ndddd';
    const dim = measureGenericTagDim(['x'], 'sans-serif', measurer, 6, raw);
    expect(dim?.height).toBe(4 * 10 + 4);
  });
});

describe('julixi-10/rulite-35 contenty node (capture-vs-golden pin)', () => {
  // Golden svek-1.dot sh0011: width=4.456424in (320.8625px), height=
  // 0.527778in (38px). `hide empty members` suppresses both compartments.
  it('sizes the quoted-name-with-generic-linebreaks header exactly', () => {
    const classifier = makeClassifier({
      id: 'contenty',
      display: 'MapOrderContent\\n',
      typeParams: ['two_dims_td', '\\nLessY<Element<two_dims_td>>'],
      typeParamsRawText: 'two_dims_td,\\nLessY<Element<two_dims_td>>',
    });
    const m = measureClassifier(classifier, defaultTheme, measurer, { fields: true, methods: true });
    expect(m.width).toBeCloseTo(320.8625, 4);
    expect(m.height).toBe(38);
  });
});

describe('member-row / header-line 10px atom floor (R2c item 4a)', () => {
  const member = { name: 'example1', visibility: undefined } as never;

  it('floors an 8pt member row at 10px (sovuxo-25 dummy: 58 tall)', () => {
    const theme = deepMergeTheme(defaultTheme, {
      colors: { graph: { classAttributeFontSize: 8 } },
    });
    const classifier = makeClassifier({ id: 'dummy', display: 'dummy', members: [member] });
    const m = measureClassifier(classifier, theme, measurer, { fields: false, methods: false });
    // badge 32 + fields (8 + max(8,10)) + methods 8 — jar s8 probe.
    expect(m.height).toBe(58);
  });

  it('does not change rows at >=10pt (jar s12 probe: 60 tall)', () => {
    const theme = deepMergeTheme(defaultTheme, {
      colors: { graph: { classAttributeFontSize: 12 } },
    });
    const classifier = makeClassifier({ id: 'dummy', display: 'dummy', members: [member] });
    const m = measureClassifier(classifier, theme, measurer, { fields: false, methods: false });
    expect(m.height).toBe(60);
  });

  it('floors a 6pt header name line at 10px (jar h6 probe: 50 tall)', () => {
    const theme = deepMergeTheme(defaultTheme, {
      colors: { graph: { classFontSize: 6 } },
    });
    const classifier = makeClassifier({
      id: 'foo', display: 'foo', hideCircle: true, members: [member],
    });
    const m = measureClassifier(classifier, theme, measurer, { fields: false, methods: false });
    // header (10 + 10) + fields (8 + 14) + methods 8.
    expect(m.height).toBe(50);
  });
});
