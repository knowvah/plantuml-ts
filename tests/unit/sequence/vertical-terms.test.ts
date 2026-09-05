/**
 * The sequence engine's VERTICAL model, pinned term by term against the jar —
 * C3 of `plans/sequence-text-and-y-convergence`, whose derivation (every
 * `file:line`) is `findings/vertical-terms.md`.
 *
 * In one block, read top-down:
 *
 * ```
 * svgHeight   = (int)( bodyBlockHeight + 5 + 5 + 1 )   SvgGraphics#ensureVisible:128-135
 * bodyBlock   = pswpHeight + 10                        SequenceDiagramFileMakerTeoz:132,150-158
 * pswpHeight  = pageHeight + (footbox ? 2 : 1) * headHeight
 *                                     PlayingSpaceWithParticipants#calculateDimensionSlow:74-87
 * pageHeight  = max(ink, 8 + SUM(tileHeight)) + 10     PlayingSpace#getPreferredHeight:154-161
 * ```
 *
 * WHY THE DOCUMENT HEIGHT IS THE ASSERTION. Every term below is a summand of
 * it, and the jar's own goldens carry it — so a fixture whose height matches
 * exactly has had all of its terms right at once, and no constant can be
 * fitted to pass one row without breaking another. The five in `CANARIES`
 * are `findings/vertical-terms.md` §6's, chosen so each adds exactly one term
 * to the one before it: a bare message, three of them, a note, a group, and a
 * group with an `else`.
 *
 * The per-term cases underneath use `FixedMeasurer(8, 16)` on a synthetic AST
 * because no corpus fixture isolates them: they assert the DIFFERENCE one
 * event makes to `totalHeight`, which is that event's tile height and nothing
 * else — tiles chain flush (`YGauge.createWithContact:103-116`), so the delta
 * IS `getPreferredHeight`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { FixedMeasurer } from '../../../src/core/measurer.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';
import { arrowConfigurationOf } from '../../../src/diagrams/sequence/sequence-parse-helpers.js';
import type {
  SequenceDiagramAST,
  SequenceEvent,
} from '../../../src/diagrams/sequence/ast.js';

const HERE = dirname(fileURLToPath(import.meta.url));
// Markup AND golden both come from the committed `dot-cache`, never from
// `tests/corpus/` -- that tree is GITIGNORED and populated locally by
// `scripts/populate-corpus.py`, so a test reading it passes on a dev box and
// fails on a clean checkout. This file did exactly that from `3eb50eb8` until
// 2026-09-05, red on CI for eight pushes while green locally. The cache's
// `in.puml` is byte-identical to the corpus `.puml` for all five canaries
// (verified before the switch), so this changes what the test READS, not what
// it asserts.
const CACHE = join(HERE, '..', '..', '..', 'test-results', 'dot-cache', 'sequence');

function dimsOf(svg: string): { width: number; height: number } {
  const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  return { width: Number(m?.[1]), height: Number(m?.[2]) };
}

function oursFor(slug: string): string {
  return renderFixtureSequence(
    readFileSync(join(CACHE, slug, 'in.puml'), 'utf8'),
    new DeterministicMeasurer(),
  );
}

function goldenOf(slug: string): string {
  return readFileSync(join(CACHE, slug, 'in.svg'), 'utf8');
}

// ---------------------------------------------------------------------------
// The whole model, against named goldens
// ---------------------------------------------------------------------------

/** Each row adds ONE term to the row above it, so the first failure names the
 *  term. Every expected number is read out of the golden, never memorised. */
const CANARIES = [
  { slug: 'bidopa-30-jafi560', adds: 'one flat message: the frame, the head band, the tail' },
  { slug: 'gibaro-25-sibu619', adds: 'three of them: the per-message advance in isolation' },
  { slug: 'jobadi-87-jegi648', adds: 'a self message: the 13-unit loop and its tile' },
  { slug: 'fasafe-10-fepe885', adds: 'a group: header, body offset, frame height, slack' },
  { slug: 'lenamo-57-fano574', adds: 'an `else`: the separator height, across two branches' },
] as const;

describe('the vertical model — document height, against the jar', () => {
  it.each(CANARIES)('$slug ($adds)', ({ slug }) => {
    expect(dimsOf(oursFor(slug)).height).toBe(dimsOf(goldenOf(slug)).height);
  });
});

describe('the vertical model — the landmarks inside one document', () => {
  // `bidopa-30-jafi560` is `Alice -> Bob : Hello`, the smallest diagram that
  // exercises every band. Its golden: head rect at y=10 h=28, lifelines from
  // 39 to 84, arrow at 66, foot rect at 84, document 124 tall.
  const ours = oursFor('bidopa-30-jafi560');

  it('puts the head row on the document top margin', () => {
    expect(ours).toContain('<rect x="10" y="10" width="44.45" height="28"');
  });

  it('starts the lifelines one head BAND below it, slack included', () => {
    // `28 + 1`: `ComponentRoseParticipant#getPreferredHeight:129-132`'s bare
    // `+ 1`, which `drawInternalU` does not paint.
    expect(ours).toContain('<line x1="32.225" y1="39" x2="32.225" y2="84"');
  });

  it('puts the arrow `startingY + blockH + getPaddingY` under the body top', () => {
    // 39 + 8 + 13 + 6. `PlayingSpace:55`, then
    // `ComponentRoseArrow#getYPoint:329-335`.
    expect(ours).toContain('<line x1="32.225" y1="66" x2="79.962" y2="66"');
  });

  it('opens the foot row a 10-unit tail below the last tile', () => {
    // The tile ends at 47 + 27 = 74, and `PlayingSpace#getPreferredHeight:158`
    // adds 10. No footer LABEL band: upstream reserves none
    // (`LivingSpaces#drawHeads:135-141`).
    expect(ours).toContain('<rect x="10" y="84" width="44.45" height="28"');
  });

  it('emits `(int)(dim + 1)` for the root dimensions, not `trunc(dim)`', () => {
    // `SvgGraphics#ensureVisible:128-135`. The clean witness: this port's
    // width was 115 against the jar's 116, and 424 of 1101 fixtures were
    // exactly one narrow.
    expect(dimsOf(ours)).toEqual(dimsOf(goldenOf('bidopa-30-jafi560')));
  });
});

describe('the vertical model — a self message', () => {
  // `jobadi-87-jegi648` is `activate Bob #White #Black` + `Bob -> Bob`, whose
  // label is EMPTY: `blockH` is 0, so its loop starts six below its tile top.
  const ours = oursFor('jobadi-87-jegi648');

  it('drops the loop by `getArrowOnlyHeight()`, which is 13 and not 20', () => {
    // `ComponentRoseSelfArrow:321-323`, drawn as `vline(arrowHeight)` at
    // `:125`. The golden runs `y1="53"` to `y2="66"`.
    expect(ours).toContain('<line x1="76.469" y1="53" x2="76.469" y2="66"');
  });

  it('reserves `blockH + 27` for the tile, so the foot lands on the jar', () => {
    // 8 + 27 + 10 below a body top of 39 puts the footbox at 84, which is
    // where the golden's is, and the activation bar spans the tile exactly.
    expect(ours).toContain('<rect x="24.469" y="47" width="10" height="37"');
    expect(ours).toContain('<rect x="10" y="84" width="38.938" height="28"');
  });
});

// ---------------------------------------------------------------------------
// Per-term: the height ONE event adds
// ---------------------------------------------------------------------------

const measurer = new FixedMeasurer(8, 16);

function astOf(events: SequenceEvent[]): SequenceDiagramAST {
  return {
    participants: ['A', 'B'].map((id, i) => ({
      id,
      display: id,
      type: 'participant' as const,
      order: i,
    })),
    events,
    autonumber: { enabled: false, start: 1, current: 1, step: 1, prefix: '' },
    options: { hideFootbox: false, messageAlign: 'center' },
    boxes: [],
  };
}

/** The document height with `events` in it. */
function heightOf(events: SequenceEvent[]): number {
  return layoutSequence(astOf(events), defaultTheme, measurer).totalHeight;
}

/** What `events` ADD to an otherwise identical document — the sum of their
 *  tile heights, because tiles chain flush. */
function addedBy(events: SequenceEvent[]): number {
  return heightOf(events) - heightOf([]);
}

const MSG: SequenceEvent = {
  kind: 'message',
  from: 'A',
  to: 'B',
  label: 'x',
  arrow: arrowConfigurationOf({}),
};

/** `FixedMeasurer(8, 16)` reports 16 for every line, whatever the font. */
const LINE = 16;

describe('one tile, one height', () => {
  it('a flat message reserves `blockH + 14`', () => {
    // `ComponentRoseArrow#getPreferredHeight:341-344` = `getTextHeight + 4 +
    // 2 * 4`, and `getTextHeight` is `blockH + 1 + 1`
    // (`AbstractComponentRoseArrow:62`).
    expect(addedBy([MSG])).toBe(LINE + 14);
  });

  it('a two-line label adds exactly one more line, not a spacing', () => {
    // `\n` is PlantUML's own line break inside a label, which `displayLines`
    // splits on -- hence the escaped backslash in the source string.
    expect(addedBy([{ ...MSG, label: 'x\\ny' }])).toBe(2 * LINE + 14);
  });

  it('an unlabelled message reserves 14 — an empty block is 0 tall', () => {
    // `StringBounderFromWidthTable#calculateDimension:64-80` over an empty
    // `Display`. The jar's `jobadi-87-jegi648` proves it on the self form.
    expect(addedBy([{ ...MSG, label: '' }])).toBe(14);
  });

  it('a self message reserves 13 more than a flat one', () => {
    // `ComponentRoseSelfArrow#getPreferredHeight:316-323` adds
    // `getArrowOnlyHeight()`.
    expect(addedBy([{ ...MSG, to: 'A' }])).toBe(addedBy([MSG]) + 13);
  });

  it('a note reserves `blockH + 20`, and draws a box `blockH + 10` tall', () => {
    // `NoteTile:167-171` -> `ComponentRoseNote#getPreferredHeight:88-91` =
    // `getTextHeight + 2 * getPaddingY`, padding 5 (`:67-70`, `Rose:66`).
    const note: SequenceEvent = {
      kind: 'note', position: 'over', participants: ['A'], text: 'n',
    };
    expect(addedBy([note])).toBe(LINE + 20);
    const geo = layoutSequence(astOf([note]), defaultTheme, measurer);
    const drawn = geo.events.find((e) => e.kind === 'note');
    expect(drawn?.height).toBe(LINE + 10);
  });

  it('draws that box 5 below its own tile top, not on it', () => {
    // `AbstractComponent#drawU:142-143` applies `getPaddingY()` first.
    const geo = layoutSequence(
      astOf([{ kind: 'note', position: 'over', participants: ['A'], text: 'n' }]),
      defaultTheme,
      measurer,
    );
    const note = geo.events.find((e) => e.kind === 'note');
    // The body's first tile top is `headHeight + startingY`.
    expect(note?.y).toBe(geo.headHeight + 8 + 5);
  });

  it('a `|||` reserves exactly its pixels, with nothing beside them', () => {
    // `HSpaceTile:72-75`; `ComponentRoseGroupingSpace#getPreferredHeight:66-69`.
    expect(addedBy([{ kind: 'space', pixels: 37 }])).toBe(37);
  });

  it('a bare `...` reserves 20 and a `...text...` reserves `blockH + 28`', () => {
    // `ComponentRoseDelayLine:68-71` and `ComponentRoseDelayText:54,72-75`.
    expect(addedBy([{ kind: 'delay' }])).toBe(20);
    expect(addedBy([{ kind: 'delay', text: 'wait' }])).toBe(LINE + 28);
  });

  it('an `activate`/`deactivate` pair reserves nothing', () => {
    // `LifeEventTile#getPreferredHeight:128-138` returns 0 for everything but
    // a destroy with no message.
    expect(
      addedBy([
        { kind: 'activate', participantId: 'A' },
        MSG,
        { kind: 'deactivate', participantId: 'A' },
      ]),
    ).toBe(addedBy([MSG]));
  });
});

describe('a destroy with no message reserves the cross', () => {
  // `LifeEventTile:132-136` -> `ComponentRoseDestroy:57,68-70`, `crossSize *
  // 2` = 18. Every other life event reserves 0, and this port reserved 0 for
  // all of them.
  it('reserves 18 when no preceding message deals with the participant', () => {
    // Upstream's own worked example, from the comment at
    // `SequenceDiagram.java:382-387`: `X -> X` then `destroy Y`.
    const selfOnA: SequenceEvent = { ...MSG, to: 'A' };
    expect(
      addedBy([selfOnA, { kind: 'deactivate', participantId: 'B', destroy: true }]),
    ).toBe(addedBy([selfOnA]) + 18);
  });

  it('reserves nothing when the last message DID deal with it', () => {
    // `lastEventWithDeactivate.dealWith(p)` passes and it is an
    // `AbstractMessage`, so `setMessage` binds the life event (`:395-398`).
    expect(
      addedBy([MSG, { kind: 'deactivate', participantId: 'B', destroy: true }]),
    ).toBe(addedBy([MSG]));
  });

  it('reserves 18 after a group `end`, which is not a message', () => {
    // `grouping(... END ...)` sets `lastEventWithDeactivate` to the
    // `GroupingLeaf` (`:438`), which fails the `instanceof AbstractMessage`
    // test at `:396`.
    const group: SequenceEvent = {
      kind: 'frame', frameType: 'opt', label: 'o', branches: [[MSG]], branchLabels: [''],
    };
    expect(
      addedBy([group, { kind: 'deactivate', participantId: 'B', destroy: true }]),
    ).toBe(addedBy([group]) + 18);
  });

  it('reserves nothing for a plain `deactivate`, flag absent', () => {
    expect(
      addedBy([{ kind: 'deactivate', participantId: 'B' }]),
    ).toBe(0);
  });
});

describe('a group frame — the four terms that differ from its gauge', () => {
  // `GroupingTile:88,91,156,240-242,342-345,348-357`, all read against
  // `lenamo-57-fano574`, whose golden puts the frame border at y=51 with
  // height 96, its tab 51..66, its two arrows at 95 and 139, its `else` rule
  // at 104 and its footbox at 171.
  const ours = oursFor('lenamo-57-fano574');

  it('draws the border `EXTERNAL_MARGINY` below the chaining point', () => {
    // The gauge min is 47 (body top 39 + startingY 8); the border is at 51.
    expect(ours).toContain('<rect x="13.469" y="51" width="192.581" height="96"');
  });

  it('opens the body `headerH + MARGINY_MAGIC / 2 + EXTERNAL_MARGINY` down', () => {
    // 47 + 15 + 10 + 4 = 76, and the first arrow sits `blockH + 6` inside it.
    expect(ours).toContain('<line x1="29.469" y1="95" x2="184.05" y2="95"');
  });

  it('reserves `blockH + 6` for the `else` separator, not a flat 20', () => {
    // `ComponentRoseGroupingElse#getPreferredHeight:115-121` on the teoz arm.
    // The separator tile opens at 103 and the second arrow lands 17 + 19
    // lower, at 139.
    expect(ours).toContain('<line x1="29.469" y1="139" x2="184.05" y2="139"');
  });

  it('leaves `EXTERNAL_MARGINY + MARGINY_MAGIC / 2` of slack under it', () => {
    // 14, not one `messageSpacing`. The frame's own bottom is 147, the tile
    // ends at 161, and the tail's 10 puts the footbox at 171.
    expect(ours).toContain('<rect x="10" y="171" width="38.938" height="28"');
  });
});
