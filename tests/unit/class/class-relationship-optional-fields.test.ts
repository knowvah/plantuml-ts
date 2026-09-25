/**
 * Round-trip coverage for `withOptionalFields` (class-relationship-parser.ts)
 * — code review 2026-09-21: the function used to build its result via
 * `{ ...base } as unknown as Record<string, unknown>` / `rel as unknown as
 * Relationship`, a double `as unknown as` that defeated field-name checking
 * entirely. It was rewritten to a single, narrower cast (`Pick<Relationship,
 * 'from' | 'to' | 'type'> & Record<string, unknown>` -> `Relationship`), but
 * that rewrite is still a cast, not a fully type-checked assembly. These
 * tests assert every `OptionalRelFields` key actually lands on the returned
 * `Relationship` with the value it was given, across three relationship
 * lines chosen so each of the interface's 24 keys is set by at least one of
 * them (see `class-relationship-parser.ts`'s `OptionalRelFields` interface
 * for the full key list).
 */
import { describe, it, expect } from 'vitest';
import { parseRelationshipLine } from '../../../src/diagrams/class/class-relationship-parser.js';

describe('withOptionalFields round-trip (via parseRelationshipLine)', () => {
  it('carries multiplicities, roles, ports, qualifiers, label, weight, ids, and #color/thickness overrides', () => {
    const r = parseRelationshipLine(
      '@2.5 A[Q1] "1"/roleA <-[#blue,thickness=3]- "0..*"/roleB [Q2] B::member <<tag>> : mylabel',
    )!;
    expect(r.fromMultiplicity).toBe('0..*');
    expect(r.toMultiplicity).toBe('1');
    expect(r.fromRole).toBe('roleB');
    expect(r.toRole).toBe('roleA');
    expect(r.fromPort).toBe('member');
    expect(r.fromQualifier).toBe('Q2');
    expect(r.toQualifier).toBe('Q1');
    expect(r.label).toBe('mylabel');
    expect(r.length).toBe(2);
    expect(r.weight).toBe(2.5);
    expect(r.idEntity1).toBe('A');
    expect(r.idEntity2).toBe('B');
    expect(r.idEntity1Decor).toBe('open');
    expect(r.idEntity2Decor).toBe('none');
    expect(r.idEntity1FullId).toBe('A');
    expect(r.idEntity2FullId).toBe('B');
    expect(r.thicknessOverride).toBe(3);
    expect(r.colorOverride).toBe('blue');
    expect(r.swapDirection).toBe(true);
    expect(r.dotEdgeReversed).toBe(true);
  });

  it('carries toPort, single, norank, and parentIsLinkEntity1 on an extension arrow', () => {
    const r = parseRelationshipLine('A::a1 <|-[norank,single]- B::b1')!;
    expect(r.fromPort).toBe('b1');
    expect(r.toPort).toBe('a1');
    expect(r.single).toBe(true);
    expect(r.norank).toBe(true);
    expect(r.parentIsLinkEntity1).toBe(true);
  });

  it('carries lineStyleOverride, and an explicit dotEdgeReversed: false survives', () => {
    const r = parseRelationshipLine('A -[dashed]-> B')!;
    expect(r.lineStyleOverride).toBe('dashed');
    expect(r.dotEdgeReversed).toBe(false);
    expect(r.swapDirection).toBeUndefined();
  });
});

/**
 * S-4 (cdd2-T7, begico-70-guva302/xoxuni-96-fere626): `CommandLinkClass
 * .java:368`'s `link.setColors(color().getColor(arg, ...))` -- the trailing
 * `#color[;text:color2]` spec after the second endpoint (REL_RE's own
 * REL_COLOR group, matched but discarded -- `class-relationship-parser.ts`'s
 * own doc comment on that group) is now captured independently via
 * `REL_COLOR_CAPTURE_RE` and resolved onto `Relationship.colorOverride`
 * (the SAME field the `-[#color]->` bracket form already populates).
 */
describe('S-4 (cdd2-T7) — trailing #color spec sets colorOverride', () => {
  it('a bare trailing #color (begico) sets colorOverride to the LINE color', () => {
    const r = parseRelationshipLine('research .. correlations #Green : "label"')!;
    expect(r.colorOverride).toBe('#Green');
  });

  it('a compound #color;text:color2 spec (xoxuni) sets colorOverride to the LINE half only', () => {
    const r = parseRelationshipLine('cl1 --> cl2 #red;text:blue : foo3')!;
    expect(r.colorOverride).toBe('#red');
    expect(r.label).toBe('foo3');
  });

  it('the bracket form wins over a trailing spec when (implausibly) both are present', () => {
    const r = parseRelationshipLine('A -[#blue]-> B #red')!;
    expect(r.colorOverride).toBe('blue');
  });

  it('a line with no trailing color spec leaves colorOverride unset', () => {
    const r = parseRelationshipLine('A --> B')!;
    expect(r.colorOverride).toBeUndefined();
  });
});
