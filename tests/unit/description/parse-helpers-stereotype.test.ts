/**
 * Tests for `description/parse-helpers-strings.ts#extractNodeStereotype`
 * after S1L-tail F2-b routed it through the real `Stereotype` /
 * `StereotypeDecoration` port instead of a second hand-written
 * `/<<\s*(.+?)\s*>>/g`.
 *
 * The chain under test is upstream's own, end to end:
 * `Stereotype.build(...)` -> `StereotypeDecoration#buildComplex`
 * (`stereo/StereotypeDecoration.java:143-183`) -> `Stereotype#getLabels`
 * (java:177-183) -> `cutLabels` (java:185-196) -- the same list
 * `net/atmp/CucaDiagram.java:590-602`'s `getVisibleStereotypeLabels` hands
 * `EntityImageDescription`'s `stereo` block (`java:193-201`).
 *
 * Two closed size-conformance fixtures are pinned here as behavior:
 * `junoxu-15-gori632` (G7, the `<<<...>>>` drop) and `nobiza-91-fimo741`
 * (G3-M1, the sprite-only empty-label rewrite). The third, already-ported
 * branch (plain `«text»`) carries explicit regression guards -- it is the
 * only one of upstream's three branches this port implemented before F2-b,
 * and the regex tightening's blast radius is every description element
 * carrying a stereotype.
 */
import { describe, it, expect } from 'vitest';
import { extractNodeStereotype } from '../../../src/diagrams/description/parse-helpers-strings.js';

/** The labels only -- every case below asserts the remainder separately
 *  where consumption is the point. */
function labelsOf(rest: string): readonly string[] {
  const result = extractNodeStereotype(rest);
  if (result === undefined) throw new Error(`no stereotype run matched in: ${rest}`);
  return result.stereotypes;
}

describe('extractNodeStereotype — G7: angle brackets inside the run', () => {
  // junoxu-15-gori632. `!define MICRO(foo='') <U+00B5>` expands
  // `<<MICRO()Service>>` to `<<<U+00B5>Service>>`, whose opener is the
  // three-character `<<<`. `cutLabels` drops every `<<<...>>>` run, so
  // upstream's label list is EMPTY and the entity draws no stereotype row.
  // Node sh0010's oracle is 1.312674 x 0.611111in with exactly one `<text>`.
  it('drops a run whose <U+XXXX> escape makes the opener `<<<`', () => {
    expect(labelsOf('<<<U+00B5>Service>>')).toEqual([]);
  });

  it('still consumes that run from the remainder rather than leaking it', () => {
    const result = extractNodeStereotype('as MS2 <<<U+00B5>Service>> #red');
    expect(result).toEqual({ stereotypes: [], remainder: 'as MS2 #red' });
  });

  // The SPACED form `<< MICROSERVICE >>` on the same fixture opens with a
  // plain `<<`, so `cutLabels` keeps it and the escape decodes as usual.
  // (That declaration is a cluster in junoxu-15, which is why the fixture's
  // whole delta sat on the leaf above.)
  it('keeps a run whose angle-bracket escape is not in leading position', () => {
    expect(labelsOf('<< <U+00B5>Service >>')).toEqual(['µService']);
  });
});

describe('extractNodeStereotype — G3-M1: sprite-only stereotypes', () => {
  // nobiza-91-fimo741 node 0, `rectangle "First" <<$Net>>`.
  // `buildComplex`'s circleSprite branch (java:156-160) rewrites the label
  // to "" when the LABEL group is empty, so the stereotype contributes
  // NOTHING -- jar node 0 is 0.655729 x 0.472222in = 47.2125 x 34px, i.e.
  // `27.2125 + 20` wide and `14 + 20` tall: one text row, stereo block 0x0.
  it('contributes no label for `<<$name>>`', () => {
    expect(labelsOf('<<$Net>>')).toEqual([]);
  });

  it('contributes no label for a `jar:`-declared sprite name either -- tuliba-37-liza126', () => {
    expect(labelsOf('<<$aComponent>>')).toEqual([]);
  });

  // `Stereotype#getLabel` (java:167-175) maps an `archimate/` sprite name to
  // its bare last segment, DISCARDING every co-occurring text label -- the
  // "sprite replaces the whole stereo block" rule, seen from the label side.
  // turasu-73/lesori-32/ravodu-50 all carry this trio.
  it('maps an archimate sprite name to its bare last segment', () => {
    expect(labelsOf('<<$archimate/interface>>')).toEqual(['interface']);
  });

  it('drops a co-occurring text label when a sprite is present', () => {
    expect(labelsOf('<<$archimate/technology-function>> <<behavioural>>')).toEqual(['technology-function']);
  });

  // `<<($name,color)LABEL>>` -- the circled-sprite decoration keeps its
  // LABEL group (java:157-158 rewrites `name` to `<<LABEL>>`, not "").
  it('keeps the LABEL group of a circled-sprite decoration', () => {
    expect(labelsOf('<<($Net,red)Foo>>')).toEqual(['Foo']);
  });

  // `<<(C,color)LABEL>>` -- the circled-CHARACTER sibling branch
  // (java:167-172) behaves identically for the label.
  it('keeps the LABEL group of a circled-character decoration', () => {
    expect(labelsOf('<<(X,red)Foo>>')).toEqual(['Foo']);
  });
});

describe('extractNodeStereotype — regression guards on the plain text branch', () => {
  it('leaves an ordinary `<<Net>>` untouched -- nobiza-91 probe branch 3', () => {
    expect(labelsOf('<<Net>>')).toEqual(['Net']);
  });

  it('keeps every tag of a consecutive run, in source order -- mamase-39-buto560', () => {
    expect(labelsOf('<<1>> <<2>> <<3>>')).toEqual(['1', '2', '3']);
  });

  it('tolerates parentheses that are not a circled decoration', () => {
    expect(labelsOf('<<Serv()ice>>')).toEqual(['Serv()ice']);
  });

  it('passes a non-ASCII label through unchanged', () => {
    expect(labelsOf('<<µService>>')).toEqual(['µService']);
  });

  it('strips the one-space padding of `<< x >>`', () => {
    expect(labelsOf('<< Human >>')).toEqual(['Human']);
  });

  it('returns undefined when there is no `<<...>>` run at all', () => {
    expect(extractNodeStereotype('as MS2 #red')).toBeUndefined();
  });

  it('joins the two sides of the consumed run with a single space', () => {
    expect(extractNodeStereotype('$tag <<Net>> #red')).toEqual({ stereotypes: ['Net'], remainder: '$tag #red' });
  });
});
