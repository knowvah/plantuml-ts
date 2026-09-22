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
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import type { Relationship } from '../../../src/diagrams/class/class-relationship-ast.js';

const measurer = new WidthTableMeasurer();
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
    // jar: taillabel box width 127.319 (WidthTableMeasurer.measure confirms
    // the SAME value -- see class-edge-label-anchor.test.ts's own citation).
    expect(attrs.tailLabel).toBe('owner which is very long');
    expect(attrs.tailLabelWidth).toBe(127); // Math.floor(127.31875)
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
