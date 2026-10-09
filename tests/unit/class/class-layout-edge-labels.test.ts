/**
 * cdd-T17 (M8): `class-layout-edge-labels.ts#computeMultiplicityAttrs`'s
 * role-label DOT reservation, direct unit tests (per
 * `~/.claude/rules/testability.md`). `SvekEdge.java:329-351` builds all
 * four text blocks (`startTailText`/`endHeadText` from the quantifiers,
 * `startTailRoleText`/`endHeadRoleText` from the roles); `:447-466`'s
 * `if (startTailText != null) ... else if (startTailRoleText != null)`
 * is the fallback this file asserts: a role occupies the SAME
 * taillabel/headlabel reservation slot as the quantifier, ONLY when that
 * end has no multiplicity of its own -- upstream never emits a second,
 * role-specific DOT attribute, so an end carrying BOTH keeps reserving the
 * multiplicity alone.
 *
 * Every exact value is read off `mugobo-34-fede498`'s/`nenexe-35-zere033`'s
 * own oracle SVG (the corpus's only two role fixtures, both carrying a
 * multiplicity AND a role on both ends), via `WidthTableMeasurer` (the
 * deterministic width table jar's own `-DPLANTUML_DETERMINISTIC_TEXT=true`
 * output uses) -- never fitted.
 */
import { describe, it, expect } from 'vitest';
import { edgeLabelAttrs } from '../../../src/diagrams/class/class-layout-edge-labels.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import type { Relationship } from '../../../src/diagrams/class/class-relationship-ast.js';

const measurer = new DeterministicMeasurer();
const font = { family: 'sans-serif', size: 13 };

function rel(overrides: Partial<Relationship>): Relationship {
  return { from: 'A', to: 'B', type: 'association', ...overrides };
}

describe('T17 (M8) — computeMultiplicityAttrs additive case: multiplicity wins the reservation', () => {
  it('an end with BOTH a multiplicity and a role reserves the multiplicity text', () => {
    const attrs = edgeLabelAttrs(rel({ fromMultiplicity: '1', fromRole: 'owner' }), font, font, measurer);
    expect(attrs.tailLabel).toBe('1');
  });

  it('mugobo-34-fede498 shape: both ends carry a multiplicity AND a role together', () => {
    const attrs = edgeLabelAttrs(
      rel({
        fromMultiplicity: 'owner which is very long',
        fromRole: '1',
        toMultiplicity: '0..n',
        toRole: 'items',
      }),
      font,
      font,
      measurer,
    );
    // jar (re-captured, oracle seam #4 v2): taillabel `<text textLength=
    // "141.619">` / svek-1.dot label TABLE WIDTH="141", headlabel 21.612 / "21"
    // (a space is no longer 0 wide: 127.319 -> 141.619).
    expect(attrs.tailLabel).toBe('owner which is very long');
    expect(attrs.tailLabelWidth).toBe(141); // Math.floor(141.619)
    expect(attrs.headLabel).toBe('0..n');
    expect(attrs.headLabelWidth).toBe(21); // Math.floor(21.6125)
  });
});

describe('T17 (M8) — computeMultiplicityAttrs fallback: role occupies the cardinality slot', () => {
  it('an end with a role but NO multiplicity reserves the role text (SvekEdge.java:447-466)', () => {
    const attrs = edgeLabelAttrs(rel({ fromRole: 'owner' }), font, font, measurer);
    expect(attrs.tailLabel).toBe('owner');
    expect(attrs.tailLabelWidth).toBeGreaterThan(0);
    expect(attrs.tailLabelHeight).toBe(13);
  });

  it('the head side takes the SAME fallback independently of the tail', () => {
    const attrs = edgeLabelAttrs(rel({ toRole: 'items' }), font, font, measurer);
    expect(attrs.headLabel).toBe('items');
    expect(attrs.headLabelWidth).toBeGreaterThan(0);
    expect(attrs.tailLabel).toBeUndefined();
  });

  it('neither a multiplicity nor a role on an end reserves nothing for it', () => {
    const attrs = edgeLabelAttrs(rel({ toMultiplicity: '1' }), font, font, measurer);
    expect(attrs.tailLabel).toBeUndefined();
    expect(attrs.tailLabelWidth).toBeUndefined();
    expect(attrs.headLabel).toBe('1');
  });
});

// cdd3-T32 (E3-13): `SvekEdge.java:430-442` reserves the `<TABLE>` whenever
// `hasNoteLabelText() || link.getLinkConstraint() != null` -- the
// `CONSTRAINT_SPOT` arm (`:440`) and a note-only label included. The layout
// box must follow, or the engine gets no reservation and no `labelX`.
describe('cdd3-T32 (E3-13) — an EMPTY-text label still hands the engine its box', () => {
  it('the constraint spot reserves CONSTRAINT_SPOT (SvekEdge.java:122) on both axes', () => {
    const attrs = edgeLabelAttrs(rel({ linkConstraint: { text: 'enten/eller' } }), font, font, measurer);
    expect(attrs.label).toBe('');
    expect(attrs.labelBoxWidth).toBe(10);
    expect(attrs.labelBoxHeight).toBe(10);
  });
});

// T3e (sejube-03-bote542, link-middle-decor-partial): `SvekEdge.java:353-356`
// sets `labelShield = 7` whenever the link carries a middle decor (`-(0-`
// and its siblings), then `:437-441`'s `dimNote.delta(2 * labelShield)`
// widens the FINAL reserved label block by 14 on BOTH axes, regardless of
// whether the block is a plain measured label or the note-merge/constraint
// arm (`decision-journal.md`/`fixtures.md` row 69). Oracle-verified: jar's
// own DOT box for `something -right(0- anything : description` is 78x29
// against this port's pre-fix 64.8875x15 (`Math.floor(64.8875 + 14) = 78`,
// `15 + 14 = 29`) -- `DeterministicMeasurer.measure('description', font)`
// reproduces the unshielded 64.8875 independently (not fitted).
describe('T3e — link-middle-decor label shield (SvekEdge.java:353-356,437-441)', () => {
  it('sejube-03-bote542 shape: a middle-decor edge widens its plain label box by 2*7', () => {
    const plain = edgeLabelAttrs(rel({ label: 'description' }), font, font, measurer);
    const decorated = edgeLabelAttrs(rel({ label: 'description', middleDecor: 'circleCircled' }), font, font, measurer);
    expect(plain.labelWidth).toBeCloseTo(64.8875);
    expect(plain.labelHeight).toBe(15);
    expect(decorated.labelWidth).toBeCloseTo(64.8875 + 14);
    expect(decorated.labelHeight).toBe(15 + 14);
    // `withLayoutBox` carries the float through unfloored -- the DOT emitter
    // floors at `graph-layout-build-edges.ts`'s own `appendTable` mirror,
    // outside this file (SvekEdge.java:504-507's `(int)` cast).
    expect(decorated.labelBoxWidth).toBeCloseTo(64.8875 + 14);
    expect(decorated.labelBoxHeight).toBe(29);
  });

  it('the shield also widens the CONSTRAINT_SPOT arm (SvekEdge.java:437-441 applies to both dimNote sources)', () => {
    const attrs = edgeLabelAttrs(rel({ linkConstraint: { text: 'x' }, middleDecor: 'circle' }), font, font, measurer);
    expect(attrs.labelWidth).toBe(10 + 14);
    expect(attrs.labelHeight).toBe(10 + 14);
  });

  it('no middle decor leaves the box unshielded (regression guard)', () => {
    const attrs = edgeLabelAttrs(rel({ label: 'description' }), font, font, measurer);
    expect(attrs.labelWidth).toBeCloseTo(64.8875);
  });
});
