/**
 * Authored-fixture tests for `add4` T1a (decision D3): the switch case row
 * sat 11 px too high on every switch row because the case tiles were the
 * bare branch bodies, not `FtileFactoryDelegatorSwitch#createWithLinks`'s
 * `FtileDecorateOutLabel(FtileDecorateInLabel(body, dimLabelIn),
 * dimLabelOut)` (`FtileFactoryDelegatorSwitch.java:109-113`).
 * `FtileDecorateInLabel#drawU` draws the body `dy(yl)` lower, `yl` = the
 * case label's own height -- the missing 11 px is that label (one 11 pt
 * line), on top of `getYdelta1a`'s `max(10, 11) + 10 = 21`.
 *
 * Each `<case>/in.svg` is the jar's own render (`scripts/oracle-render.sh`).
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderActivityFixture, svgAttr, textPosition } from '../../../helpers/activity-text-position.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../../fixtures/activity/add4-T1a');

function render(name: string): { ours: string; golden: string } {
  return renderActivityFixture(FIXTURE_ROOT, name);
}

/** Case-row y (each case's own action text) and canvas height = jar. */
function expectRowAndHeight(name: string, actions: readonly string[]): void {
  const { ours, golden } = render(name);
  for (const a of actions) expect(textPosition(ours, a).y, `${name} ${a}.y`).toBe(textPosition(golden, a).y);
  expect(svgAttr(ours, 'height'), `${name} height`).toBe(svgAttr(golden, 'height'));
}

describe('switch case row = jar (single-line labels)', () => {
  it('SMALL_DIAMOND, 3 cases (Ydelta1a 21 + label 11)', () => {
    expectRowAndHeight('small-1line', ['A', 'B', 'C', 'D', 'one', 'two', 'three']);
  });

  it('BIG_DIAMOND, 2 cases (Ydelta1a 11 + 24/2 + 10 = 33, + label 11)', () => {
    expectRowAndHeight('big-1line', ['A', 'B', 'D']);
  });

  it('FtileSwitchWithOneLink (flat Ydelta1a 20, + label 11) -- x too', () => {
    expectRowAndHeight('one-link-1line', ['A', 'D', 'only']);
    const { ours, golden } = render('one-link-1line');
    expect(textPosition(ours, 'A').x).toBe(textPosition(golden, 'A').x);
  });

  it('wide labels (FtileDecorateInLabel incRight)', () => {
    expectRowAndHeight('small-wide-label', ['A', 'B', 'C', 'D']);
  });

  it('trailing `-> label;` (FtileDecorateOutLabel addBottom)', () => {
    expectRowAndHeight('small-out-label', ['A', 'B', 'C', 'D']);
  });
});

// KNOWN GAP, outside this task's write-set: `case (a\nb)` keeps the
// literal backslash-n -- `switch-dispatch.ts#classifySwitchClauseLine`
// never applies `unescapeLabelNewlines`, where upstream's `CommandCase`
// calls `Display.getWithNewlines` (`CommandCase.java:87`). The labels
// then measure as ONE line. `it.fails` turns red once that lands, forcing
// these to become plain assertions.
describe('switch case row = jar (multi-line labels) -- parser gap', () => {
  it.fails('mixed 1-/2-line labels: each case sits its own label height lower', () => {
    expectRowAndHeight('small-mixed', ['A', 'B', 'C', 'D']);
  });

  it.fails('2-line labels', () => {
    expectRowAndHeight('small-2line', ['A', 'B', 'C', 'D']);
  });

  it.fails('3-line labels', () => {
    expectRowAndHeight('small-3line', ['A', 'B', 'C', 'D']);
  });

  it.fails('BIG_DIAMOND with a 3-line label', () => {
    expectRowAndHeight('big-mixed', ['A', 'B', 'D']);
  });

  it.fails('OneLink with a 2-line label', () => {
    expectRowAndHeight('one-link', ['A', 'D']);
  });
});
