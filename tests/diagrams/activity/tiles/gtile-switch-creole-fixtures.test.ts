/**
 * Authored-fixture tests for `add4` T3b: a switch case label is built with
 * `display.create0(..., CreoleMode.SIMPLE_LINE, ...)` (`Branch.java:255-256`),
 * so `**bold**` measures as its resolved text while `__under__` stays literal
 * (`CommandCreoleBuilder.java:85-86` registers it only under FULL).
 *
 * Each `<case>/in.svg` is the jar's own render (`scripts/oracle-render.sh`).
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderActivityFixture, svgAttr, textPosition } from '../../../helpers/activity-text-position.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../../fixtures/activity/add4-T3b');

function expectCasesAndWidth(name: string): void {
  const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, name);
  for (const a of ['a', 'b', 'c']) expect(textPosition(ours, a).x, `${name} ${a}.x`).toBe(textPosition(golden, a).x);
  expect(svgAttr(ours, 'width'), `${name} width`).toBe(svgAttr(golden, 'width'));
}

describe('switch case label width = jar (SIMPLE_LINE creole)', () => {
  it('switch-case-creole-width: case bodies and canvas width', () => {
    expectCasesAndWidth('switch-case-creole-width');
  });

  // add4-T3b SNAKE-LABEL-CREOLE: the connector's Snake label is boxed at its
  // SIMPLE_LINE width by `layout/tile-layout-inlabel.ts#inLabelReservation`
  // and `layout/compress/shapes-of.ts#edgeLabelShape`, so X compression
  // (`SlotFinder#drawText`) closes the 10 px the jar closes.
  it('switch-case-simple-line: an overhanging bold label lets X compression close the gap', () => {
    expectCasesAndWidth('switch-case-simple-line');
  });
});
