/**
 * A2s round 2, R2h — `<> name` association diamond sizing (cukaze-78-zija070).
 *
 * Upstream sizes an ASSOCIATION leaf through `EntityImageAssociation`, whose
 * `calculateDimensionSlow` returns a flat `(SIZE*2, SIZE*2)` with `SIZE = 12`
 * and never measures (or draws) the declared name — the diamond is the whole
 * image. Jar golden: cukaze-78's `<> diamond` node is 0.333333x0.333333in
 * (24x24px) while the pre-fix generic name-box measured the word "diamond".
 * @see ~/git/plantuml/.../svek/image/EntityImageAssociation.java:54,60-62
 */
import { describe, it, expect } from 'vitest';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { Classifier } from '../../../src/diagrams/class/ast.js';
import { measureClassifier } from '../../../src/diagrams/class/class-layout-helpers.js';

const measurer = new WidthTableMeasurer();
const SUPPRESS = { fields: false, methods: false };

function association(display: string): Classifier {
  return { id: display, display, kind: 'association', typeParams: [], members: [] };
}

describe('R2h — association diamond fixed 24x24 (EntityImageAssociation)', () => {
  it('measures a fixed 2*SIZE x 2*SIZE box (cukaze-78: 0.333333x0.333333in)', () => {
    const m = measureClassifier(association('diamond'), defaultTheme, measurer, SUPPRESS);
    expect(m.width).toBe(24);
    expect(m.height).toBe(24);
  });

  it('never measures the name — a long display yields the same 24x24', () => {
    const m = measureClassifier(
      association('a much longer association node name'), defaultTheme, measurer, SUPPRESS,
    );
    expect(m.width).toBe(24);
    expect(m.height).toBe(24);
  });

  it('emits no text rows (the jar never renders the association label)', () => {
    const m = measureClassifier(association('diamond'), defaultTheme, measurer, SUPPRESS);
    expect(m.rows).toEqual([]);
    expect(m.dividerYs).toEqual([]);
  });
});
