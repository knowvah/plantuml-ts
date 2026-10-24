/**
 * AtomVerticalTextsOps.test.ts — every `AtomOps` table that dispatches on
 * `CreoleAtom#kind` answers the `'vertical'` atom (`AtomVerticalTexts`, an
 * `Atom` any stripe may hold) by delegating to `atom/AtomVerticalTexts.ts`:
 * `AtomVerticalTexts.java:54-64` (width = widest line, height = sum),
 * `:67-69` (first line's altitude), `:71-78` (row i drawn at dy = heights
 * above). The expected numbers are derived from the SAME measurer's
 * single-line boxes, never typed in.
 */
import { describe, expect, it } from 'vitest';
import { chromeAtomOps } from '../../../../../../src/core/annotations/blocks-creole.js';
import { descAtomOps } from '../../../../../../src/core/svek/image/EntityImageDescriptionDelegates.js';
import { verticalAtomBox, creoleAtomStartingAltitude } from '../../../../../../src/core/svek/image/creole-sea-line.js';
import { measureAtomsWidthHeight } from '../../../../../../src/core/svek/image/EntityImageDescriptionTextMeasure.js';
import { buildStripeAtoms } from '../../../../../../src/core/klimt/creole/legacy/StripeSimple.js';
import type { CreoleAtom } from '../../../../../../src/core/klimt/creole/atom/Atom.js';
import type { AtomOps } from '../../../../../../src/core/klimt/creole/Sea.js';
import { DeterministicMeasurer } from '../../../../../../src/core/measurer-deterministic.js';
import { MeasurerStringBounder } from '../../../../../../src/core/measurer-bounder.js';
import type { FontConfiguration } from '../../../../../../src/core/klimt/shape/UText.js';
import { UText } from '../../../../../../src/core/klimt/shape/UText.js';
import type { UChange } from '../../../../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../../../../src/core/klimt/UGraphic.js';
import type { UShape } from '../../../../../../src/core/klimt/UShape.js';
import { UTranslate } from '../../../../../../src/core/klimt/UTranslate.js';
import type { StringBounder } from '../../../../../../src/core/klimt/font/StringBounder.js';

const FONT: FontConfiguration = { family: 'sans-serif', size: 14, color: '#000000', styles: new Set() };
const SB = new MeasurerStringBounder(new DeterministicMeasurer());
const URL = 'http://www.address.com';

interface Drawn {
  readonly text: string;
  readonly at: UTranslate;
}

class RecordingUGraphic implements UGraphic {
  constructor(
    private readonly drawn: Drawn[],
    private readonly translate: UTranslate = UTranslate.none(),
  ) {}
  apply(change: UChange): UGraphic {
    return change instanceof UTranslate ? new RecordingUGraphic(this.drawn, this.translate.compose(change)) : this;
  }
  draw(shape: UShape): void {
    if (shape instanceof UText) this.drawn.push({ text: shape.getText(), at: this.translate });
  }
  getTranslate(): UTranslate {
    return this.translate;
  }
  getParam(): never {
    throw new Error('not needed');
  }
  getStringBounder(): StringBounder {
    return SB;
  }
}

function stackOf(label: string): Extract<CreoleAtom, { kind: 'vertical' }> {
  const atom = buildStripeAtoms(`[[${URL} ${label}]]`, FONT)[0];
  if (atom?.kind !== 'vertical') throw new Error('expected a vertical atom');
  return atom;
}

function oneLine(ops: AtomOps, text: string): { width: number; height: number } {
  const [atom] = buildStripeAtoms(`[[${URL} ${text}]]`, FONT);
  const dim = ops.calculateDimension(atom as CreoleAtom, SB);
  return { width: dim.getWidth(), height: dim.getHeight() };
}

describe.each([
  ['chromeAtomOps', (): AtomOps => chromeAtomOps(undefined, FONT)],
  ['descAtomOps', (): AtomOps => descAtomOps(undefined, undefined)],
])('%s answers a vertical atom (AtomVerticalTexts.java:54-78)', (_name, makeOps) => {
  const stack = stackOf('Line 3\\nLine 44');

  it('is the widest line wide and the sum of the line heights tall', () => {
    const ops = makeOps();
    const first = oneLine(ops, 'Line 3');
    const second = oneLine(ops, 'Line 44');
    const dim = ops.calculateDimension(stack, SB);
    expect([dim.getWidth(), dim.getHeight()]).toEqual([
      Math.max(first.width, second.width),
      first.height + second.height,
    ]);
  });

  it('starts at the first line altitude (0 for a NORMAL text run)', () => {
    expect(makeOps().getStartingAltitude(stack, SB)).toBe(0);
  });

  it('draws each row under its url text at dy = the heights above', () => {
    const ops = makeOps();
    const drawn: Drawn[] = [];
    ops.drawU(stack, new RecordingUGraphic(drawn));
    const firstHeight = oneLine(ops, 'Line 3').height;
    expect(drawn.map((d) => [d.text, d.at.getDx(), d.at.getDy() > firstHeight ? 'below' : 'top'])).toEqual([
      ['Line 3', 0, 'top'],
      ['Line 44', 0, 'below'],
    ]);
  });
});

describe('measuring seams with no AtomOps (AtomVerticalTexts.java:54-64)', () => {
  const stack = stackOf('a\\nbb');

  it('verticalAtomBox sums heights and takes the widest width of the per-atom boxes', () => {
    const box = verticalAtomBox(stack.lines, (atom) => ({
      width: (atom.kind === 'text' ? atom.text.length : 0) * 7,
      height: 16,
    }));
    expect(box).toEqual({ width: 14, height: 32 });
  });

  it('creoleAtomStartingAltitude is the first stacked atom altitude', () => {
    expect(creoleAtomStartingAltitude(stack)).toBe(0);
  });

  it('the legacy description measure stacks the same box', () => {
    const rows = stack.lines.map((row) => measureAtomsWidthHeight(SB, row, undefined));
    const whole = measureAtomsWidthHeight(SB, [stack], undefined);
    expect([whole.width, whole.height]).toEqual([
      Math.max(...rows.map((r) => r.width)),
      rows.reduce((sum, r) => sum + r.height, 0),
    ]);
  });
});
