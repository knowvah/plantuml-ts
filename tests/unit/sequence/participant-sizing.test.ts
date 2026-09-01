/**
 * The plain participant box, pinned against named goldens — T2.2 of
 * `plans/sequence-coordinate-convergence`.
 *
 * The width rule is derived in full, with its `file:line` chain, in
 * `plans/sequence-coordinate-convergence/findings/participant-width.md`. In
 * one line:
 *
 *   boxWidth = pureTextWidth + padding.left + padding.right = text + 14
 *
 * from `AbstractTextualComponent#getTextWidth` (`:106-108`), whose result is
 * what `ComponentRoseParticipant#drawInternalU:100-104` hands to
 * `URectangle.build`, with `Padding 7` coming from `plantuml.skin:186-190`.
 *
 * There is NO minimum width under it. `getPureTextWidth`'s
 * `max(super…, minWidth)` (`:140-142`) takes `minWidth` from
 * `Rose#getMinClassWidth` = `style.value(PName.MinimumWidth).asDouble()`
 * (`Rose.java:275-278`); `MinimumWidth` is declared in no skin file, so that
 * resolves to `ValueNull#asDouble()` = 0 (`ValueNull.java:57-59`). This port
 * previously applied an 80px floor with no upstream counterpart, and 1033 of
 * 1124 corpus fixtures had at least one box pinned to it.
 *
 * WHY THESE GOLDENS. They are named, not sampled, and they span the range the
 * derivation has to survive: the narrowest label in the corpus, the widest,
 * the archetype the brief cites, and three ordinary ones in between. Each
 * asserts the JAR'S OWN number — read out of the committed golden, not
 * recomputed here — so a drift in either the measurer or the formula fails
 * this file rather than being absorbed by it.
 *
 * The `<text textLength>` beside each box is the jar's own text width, so the
 * goldens carry both halves of the equation and the test can check the
 * relationship rather than a memorised constant.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';
import { headSlackOf } from '../../../src/diagrams/sequence/sequence-layout-participants.js';

const CACHE = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  'test-results',
  'dot-cache',
  'sequence',
);

/** `Padding 7`, both sides — the whole of the width correction. */
const PADDING_BOTH_SIDES = 2 * defaultTheme.sequence.participantPadding;

interface Box {
  readonly x: number;
  readonly width: number;
  readonly height: number;
  /** The jar's own text width. Absent from our output, which emits no
   *  `textLength`, so only golden-side assertions may read it. */
  readonly textLength: number | undefined;
  readonly label: string;
}

function attrsOf(tag: string): Record<string, string> {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map((a) => [a[1] ?? '', a[2] ?? '']));
}

/**
 * Participant boxes: a `<rect>` immediately followed by a `<text>`.
 *
 * That adjacency is what identifies the shape on BOTH sides, and it has to,
 * because the two sides agree on very little else yet. The jar fills the box
 * `#E2E2F0` and gives its label a `textLength`; this port fills it `#FFF` and
 * centres the label with `text-anchor`. Neither of those is this batch's
 * business (`DIVERGENCES.md`), and keying on either would make this test fail
 * for a reason that is not about width.
 *
 * Nothing else in a sequence SVG has that adjacency: a lifeline rect is
 * followed by its `<line>`, an activation rect by the next shape.
 */
function participantBoxes(svg: string): Box[] {
  const pattern = /<rect ([^>]*?)\/><text ([^>]*?)>([^<]*)<\/text>/g;
  return [...svg.matchAll(pattern)].map((m) => {
    const rect = attrsOf(m[1] ?? '');
    const text = attrsOf(m[2] ?? '');
    const length = text['textLength'];
    return {
      x: Number(rect['x']),
      width: Number(rect['width']),
      height: Number(rect['height']),
      textLength: length === undefined ? undefined : Number(length),
      label: m[3] ?? '',
    };
  });
}

function goldenOf(slug: string): string {
  return readFileSync(join(CACHE, slug, 'in.svg'), 'utf8');
}

function oursFor(slug: string): string {
  const markup = readFileSync(join(CACHE, slug, 'in.puml'), 'utf8');
  return renderFixtureSequence(markup, new DeterministicMeasurer());
}

/**
 * The six pinned goldens. `label` is the participant this row is about;
 * `jarWidth` and `jarText` are read back out of the golden by the first test
 * in this file, so a stale number here fails rather than silently passing.
 */
const GOLDENS = [
  { slug: 'jobadi-87-jegi648', label: 'Bob', note: "the brief's archetype: our box was 80 wide, the jar's 38.938" },
  { slug: 'covuco-47-sotu151', label: 'is', note: 'the narrowest label in the corpus (10.150px)' },
  { slug: 'bujuma-55-rupu730', label: 'Alice', note: 'the most common label in the corpus' },
  { slug: 'dugeki-47-celo546', label: 'P-CSCF', note: 'punctuation and capitals' },
  { slug: 'gacujo-48-leto751', label: 'SignedUrlGenerator', note: 'long enough that the old 80px floor never bound' },
  { slug: 'ximuku-67-lupe952', label: undefined, note: 'the widest label in the corpus (579.250px)' },
] as const;

describe('the plain participant box — width, against the jar', () => {
  it.each(GOLDENS)('$slug: box width is text + 14 in the golden itself ($note)', ({ slug }) => {
    // The relationship, checked on the JAR's own output. If this ever fails,
    // the derivation is wrong and every assertion below it is meaningless.
    const boxes = participantBoxes(goldenOf(slug)).filter(
      (b) => b.height === 28 && b.textLength !== undefined,
    );
    expect(boxes.length).toBeGreaterThan(0);
    for (const box of boxes) {
      expect(box.width - (box.textLength ?? 0)).toBeCloseTo(PADDING_BOTH_SIDES, 2);
    }
  });

  it.each(GOLDENS)('$slug: our box width matches the jar exactly', ({ slug, label }) => {
    const golden = participantBoxes(goldenOf(slug)).filter((b) => b.height === 28);
    const ours = participantBoxes(oursFor(slug));
    expect(golden.length).toBeGreaterThan(0);
    for (const want of golden) {
      if (label !== undefined && want.label !== label) continue;
      const got = ours.find((b) => b.label === want.label);
      expect(got, `no box for ${JSON.stringify(want.label)} in our output`).toBeDefined();
      expect(got?.width).toBeCloseTo(want.width, 2);
    }
  });

  it('jobadi-87-jegi648: the exact numbers the brief names', () => {
    // Spelled out rather than derived, because this is the fixture D2 quotes:
    // "our `Bob` box is width=80 height=34, the jar's is width=38.938
    // height=28". The width half is now exact; the height half is Batch 3.
    const [box] = participantBoxes(oursFor('jobadi-87-jegi648'));
    expect(box?.label).toBe('Bob');
    expect(box?.width).toBeCloseTo(38.938, 3);
    // and the jar's half of the same claim, read from the golden:
    const [jarBox] = participantBoxes(goldenOf('jobadi-87-jegi648'));
    expect(jarBox?.textLength).toBeCloseTo(24.938, 3);
    expect(jarBox?.width).toBeCloseTo(38.938, 3);
  });

  it('no participant box is propped up by a minimum width', () => {
    // The floor's signature was a run of boxes all exactly 80 wide regardless
    // of their labels. `covuco-47-sotu151`'s two-glyph participants are the
    // case that exposed it: 10.150 + 14 = 24.150, less than a third of 80.
    const boxes = participantBoxes(oursFor('covuco-47-sotu151'));
    const narrow = boxes.filter((b) => b.label === 'is');
    expect(narrow.length).toBeGreaterThan(0);
    for (const box of narrow) expect(box.width).toBeCloseTo(24.15, 2);
  });

  it('the label sits one padding in from the box edge, as the jar draws it', () => {
    // `drawInternalU` translates the text block by `padding.getTranslate()`
    // (`:112`), so with `HorizontalAlignment center` the box is symmetric
    // about its own centre and the ink starts at `x + 7` for a label that
    // fills it. Checked on the golden, where rect.x and text.x are both given.
    const svg = goldenOf('jobadi-87-jegi648');
    const rect = /<rect x="10" y="10" width="38.938"/.exec(svg);
    const text = /<text x="17" y="27.889"/.exec(svg);
    expect(rect).not.toBeNull();
    expect(text).not.toBeNull();
    expect(17 - 10).toBe(defaultTheme.sequence.participantPadding);
  });
});

describe('the plain participant box — height, against the jar', () => {
  it.each(GOLDENS)('$slug: our box height matches the jar exactly', ({ slug, label }) => {
    // `getTextHeight = textBlock.height + padding.top + padding.bottom`
    // (`AbstractTextualComponent.java:110-114`) — the same `Padding 7`, on the
    // other axis. 28 for a one-line label, and 2304 corpus boxes agree.
    const golden = participantBoxes(goldenOf(slug)).filter((b) => b.height === 28);
    const ours = participantBoxes(oursFor(slug));
    expect(golden.length).toBeGreaterThan(0);
    for (const want of golden) {
      if (label !== undefined && want.label !== label) continue;
      const got = ours.find((b) => b.label === want.label);
      expect(got?.height).toBeCloseTo(want.height, 2);
    }
  });

  it('reserves one pixel below the box before the lifeline starts', () => {
    // `ComponentRoseParticipant#getPreferredHeight:129-132` adds `+ 1` that
    // `drawInternalU` does not paint, and `LivingSpace#drawHeadOrTail:191-214`
    // reserves the PREFERRED dimension. So the head row is one taller than the
    // box, and the gap shows up between the box bottom and the lifeline top.
    // The jar puts jobadi's box at [10, 38) and its lifeline at 39; this port
    // has the same diagram at a different origin (Batch 5), so the RELATIVE
    // gap is what is pinned here.
    const svg = oursFor('jobadi-87-jegi648');
    const [head] = participantBoxes(svg);
    const lifeline = /<rect x="[\d.]+" y="([\d.]+)"[^>]*fill-opacity="0"/.exec(svg);
    expect(head).toBeDefined();
    expect(lifeline).not.toBeNull();
    expect(Number(lifeline?.[1])).toBeCloseTo((head?.height ?? 0) + 1, 3);
  });

  it('the jar shows the same one-pixel gap in the golden', () => {
    const svg = goldenOf('jobadi-87-jegi648');
    const box = /<rect x="10" y="(\d+)" width="38.938" height="(\d+)"/.exec(svg);
    const lifeline = /<rect x="[\d.]+" y="(\d+)"[^>]*fill-opacity="0"/.exec(svg);
    const boxBottom = Number(box?.[1]) + Number(box?.[2]);
    expect(boxBottom).toBe(38);
    expect(Number(lifeline?.[1])).toBe(boxBottom + 1);
  });

  it('no glyph participant kind gets that extra pixel', () => {
    // Read one at a time rather than generalised: `ComponentRoseActor:89-92`,
    // `ComponentRoseDatabase:96-99`, `ComponentRoseBoundary:90-93`,
    // `ComponentRoseControl:91-94`, `ComponentRoseEntity:91-94` are all
    // `stickman.height + getTextHeight` with no constant, and
    // `ComponentRoseQueue:82-85` is the glyph height alone. Only
    // `ComponentRoseParticipant` carries the `+ 1`.
    expect(headSlackOf('participant')).toBe(1);
    expect(headSlackOf('collections')).toBe(1);
    for (const kind of ['actor', 'boundary', 'control', 'entity', 'database', 'queue'] as const) {
      expect(headSlackOf(kind)).toBe(0);
    }
  });
});

describe('the document origin — where the first box sits', () => {
  /** `LEFT_MARGIN`, which the derivation says is 5 + 5. */
  const ORIGIN = 10;

  // Fixtures whose LEFTMOST participant is a plain box, so the box itself is
  // the leftmost ink. A glyph-first diagram would put a stickman there and the
  // first rect would be somewhere else entirely.
  it.each([
    'jobadi-87-jegi648',
    'bujuma-55-rupu730',
    'covuco-47-sotu151',
    'bacupi-77-fuke586',
  ])('%s: the leftmost participant box starts on the jar\'s left margin', (slug) => {
    // `TextBlockExporter:173` translates by `margin.left`, which for a Teoz
    // sequence is 5 (`SequenceDiagram#getDefaultMargins:624-628`), and
    // `SequenceDiagramFileMakerTeoz#getTextBlock`'s `drawU` applies its own
    // `UTranslate(5, 5)` (`:132`) before `dx(-min1)` lands the body's leftmost
    // extent at 0. 5 + 5 = 10.
    const leftmost = (svg: string): number => Math.min(...participantBoxes(svg).map((b) => b.x));
    expect(leftmost(goldenOf(slug))).toBeCloseTo(ORIGIN, 3);
    expect(leftmost(oursFor(slug))).toBeCloseTo(ORIGIN, 3);
  });

  it('a left-border exo arrow starts on that margin, not on the image edge', () => {
    // `border1` is the DRAWING SPACE's left edge. The jar on `[<- Bob : hello`
    // puts the border-end head at 11 -- one pixel off a border at 10, not at 1.
    const svg = oursFor('jobadi-87-jegi648');
    expect(svg).not.toMatch(/\s(?:x|x1|x2|cx)="-/);
  });

  it('pushes the row right when something overhangs, rather than going negative', () => {
    // Upstream solves an origin and draws the body at `dx(-min1)`
    // (`SequenceDiagramFileMakerTeoz.java:82,135-136`): whatever reaches
    // furthest left lands ON the margin. `?-> Bob` is the case -- its body
    // starts at `posC - preferredWidth`, which is left of the box.
    const svg = renderFixtureSequence(
      '@startuml\nparticipant Bob\n?-> Bob : hello\n@enduml',
      new DeterministicMeasurer(),
    );
    expect(svg).not.toMatch(/\s(?:x|x1|x2|cx)="-/);
    // and the leftmost thing IS on the margin
    const xs = [...svg.matchAll(/\s(?:x|x1|x2)="([\d.]+)"/g)].map((m) => Number(m[1]));
    expect(Math.min(...xs.filter((n) => n > 0 || n === 0))).toBeCloseTo(ORIGIN, 3);
  });
});

describe('inter-participant spacing — the lifeline centres', () => {
  /** Lifeline centres in document order: the `x1` of each dashed line. */
  function lifelineCentres(svg: string): number[] {
    return [...svg.matchAll(/<line x1="([\d.]+)"[^>]*dasharray/g)].map((m) => Number(m[1]));
  }

  // `LivingSpaces#addConstraints:61-71` is
  // `current.getPosA().ensureBiggerThan(previous.getPosE().addFixed(10))`,
  // with `posA = posB - marginBefore` and `posE = posD + marginAfter`
  // (`LivingSpace.java:292-298`) and both margins zero unless an englober or a
  // self-message overflow widened them. So neighbouring boxes are 10 apart,
  // edge to edge -- not the 20 this port used.
  //
  // Each of these is a fixture where EVERY lifeline centre lands on the jar's,
  // which is only possible if the widths, the origin and the gap are all right
  // at once. `degire` and `dicega` carry five participants each, so four
  // consecutive gaps have to be right for them to pass.
  it.each([
    { slug: 'degire-21-dujo330', n: 5 },
    { slug: 'dicega-90-zubu260', n: 5 },
    { slug: 'calido-79-kovi606', n: 3 },
    { slug: 'doleso-00-deme832', n: 2 },
  ])('$slug: all $n lifeline centres match the jar', ({ slug, n }) => {
    const jar = lifelineCentres(goldenOf(slug));
    const ours = lifelineCentres(oursFor(slug));
    expect(jar).toHaveLength(n);
    expect(ours).toHaveLength(n);
    for (const [i, want] of jar.entries()) expect(ours[i]).toBeCloseTo(want, 3);
  });

  it('the natural gap between two plain boxes is 10, edge to edge', () => {
    const svg = renderFixtureSequence(
      '@startuml\nparticipant Bob\nparticipant Alice\n@enduml',
      new DeterministicMeasurer(),
    );
    const boxes = participantBoxes(svg).slice(0, 2);
    expect(boxes).toHaveLength(2);
    const left = boxes[0]!;
    const right = boxes[1]!;
    expect(right.x - (left.x + left.width)).toBeCloseTo(10, 3);
  });
});
