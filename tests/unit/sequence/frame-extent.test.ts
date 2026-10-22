/**
 * sdd2 T3c: a group frame is bounded by its OWN tiles, its header and its
 * else tiles (`teoz/GroupingTile.java:186-225`), and reaches the document
 * width through `getMaxX = max + EXTERNAL_MARGINX2` (`:988-990`).
 *
 * Expected values are the jar's own `in.svg` (slug named at each case, the
 * source inlined) or Java arithmetic quoted at the assertion.
 */
import { describe, expect, it } from 'vitest';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type {
  DelayGeo,
  ElseGeo,
  FrameEvent,
  FrameGeo,
  ParticipantGeo,
  SequenceGeometry,
} from '../../../src/diagrams/sequence/ast.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { scaleSequenceGeometry } from '../../../src/diagrams/sequence/scale-geo.js';
import {
  FRAME_EXTERNAL_MARGIN_X1,
  FRAME_EXTERNAL_MARGIN_X2,
  FRAME_MARGIN_X,
} from '../../../src/diagrams/sequence/sequence-frame-metrics.js';
import { resolveFrameSpan } from '../../../src/diagrams/sequence/sequence-layout-frame-extent.js';
import { astOrThrow } from '../../helpers/parse-ast.js';

const measurer = new DeterministicMeasurer();

/** `src/index.ts#umlSourceOfBlock`'s widening, over a `@startuml` body (the
 *  skinparam and multi-line `ref` lines need the preprocessed source). */
function sourceOf(body: readonly string[]): UmlSource {
  const block = buildBlockUmls(`@startuml\n${body.join('\n')}\n@enduml`)[0]!;
  if (!block.ok) throw new Error('preprocessor failure');
  return {
    ...block.source,
    stylePositions: block.preprocessed.stylePositions,
    skinparamAssignments: block.preprocessed.skinparamAssignments,
    styleSource: block.preprocessed,
  };
}

function layout(lines: readonly string[]): SequenceGeometry {
  return layoutSequence(astOrThrow(parseSequence(sourceOf(lines)), 'sequence'), defaultTheme, measurer);
}

function groups(geo: SequenceGeometry): FrameGeo[] {
  return geo.events.filter((e): e is FrameGeo => e.kind === 'frame' && e.frameType !== 'ref');
}

/** The canvas width the SVG prints: `(int)(w + 1)` (`SvgGraphics.java:129-135`). */
function svgWidth(geo: SequenceGeometry): number {
  return Math.trunc(geo.totalWidth + 1);
}

describe('resolveFrameSpan (GroupingTile.java:211-225)', () => {
  it('reaches MARGINX (16) beyond its child tiles on each side', () => {
    // min2.add(tile.getDrawnMinX().addFixed(-MARGINX)); max2.add(m.addFixed(MARGINX)) (:211-214).
    const span = resolveFrameSpan({ children: [{ min: 100, max: 200 }], elseWidths: [], headerWidth: 10, xOrigin: 0 });
    expect(span).toEqual({ min: 100 - FRAME_MARGIN_X, max: 200 + FRAME_MARGIN_X });
  });

  it('is at least as wide as its header plus 16 (:224)', () => {
    const span = resolveFrameSpan({ children: [{ min: 100, max: 110 }], elseWidths: [], headerWidth: 90, xOrigin: 0 });
    expect(span).toEqual({ min: 84, max: 84 + 90 + 16 });
  });

  it("reaches each else tile's getMaxX, the group's getMinX plus the else width (ElseTile.java:153-161)", () => {
    // parent.getMinX() = min - EXTERNAL_MARGINX1 (GroupingTile.java:984-986).
    const span = resolveFrameSpan({
      children: [{ min: 100, max: 110 }],
      elseWidths: [300],
      headerWidth: 10,
      xOrigin: 0,
    });
    expect(span).toEqual({ min: 84, max: 84 - FRAME_EXTERNAL_MARGIN_X1 + 300 });
  });

  it('starts at the x origin when no child tile counts (:217-218)', () => {
    const span = resolveFrameSpan({ children: [], elseWidths: [], headerWidth: 40, xOrigin: 10 });
    expect(span).toEqual({ min: 10, max: 10 + 40 + 16 });
  });
});

describe('group frame extent (GroupingTile.java:186-225)', () => {
  it('spans only the tiles inside it, not every lifeline (dofefe-55 mechanism)', () => {
    const geo = layout(['participant A', 'participant B', 'participant C', 'group G', 'A -> B : hello', 'end']);
    const [frame] = groups(geo);
    const [a, b] = geo.participants;
    // CommunicationTile#getMinX/getMaxX (:445-460): posC of A, posC of B.
    expect(frame!.x).toBeCloseTo(a!.centerX - FRAME_MARGIN_X, 6);
    expect(frame!.x + frame!.width).toBeCloseTo(b!.centerX + FRAME_MARGIN_X, 6);
  });

  it('grows to a long header plus 16 (badoba-13: frame 147.137, canvas 188)', () => {
    const geo = layout([
      'skinparam backgroundcolor transparent',
      'alt successful',
      'Server -> Client: OK',
      'else failure',
      'Server -> Client : ERROR',
      'end',
    ]);
    const [frame] = groups(geo);
    expect(frame!.width).toBeCloseTo(147.137, 3);
    expect(svgWidth(geo)).toBe(188);
    const separator = geo.events.find((e): e is ElseGeo => e.kind === 'else');
    expect(separator!.x).toBe(frame!.x);
    expect(separator!.width).toBe(frame!.width);
  });

  it('grows to an else label: getMinX + text + 10 (xovuse-55: frame 400.181, canvas 436)', () => {
    const geo = layout([
      'Alice -> Bob',
      'alt successful case',
      '    Bob -> Alice',
      'else Another type of failure and more to do for Alice and Bob and the logging system',
      '   Bob -> Alice',
      'end',
    ]);
    expect(groups(geo)[0]!.width).toBeCloseTo(400.181, 3);
    expect(svgWidth(geo)).toBe(436);
  });

  it('counts a LifeEventTile at posC + level * 5 (selave-46: frame 161.344, canvas 194)', () => {
    const geo = layout([
      'a->b : this is a message',
      'alt toto',
      'a->b++ : msg2',
      'end',
      'b->a++ : msg3',
      'return msg4',
    ]);
    expect(groups(geo)[0]!.width).toBeCloseTo(161.344, 3);
    expect(svgWidth(geo)).toBe(194);
  });

  it("counts a self message's DRAWN extent, max(42, 7 + text) (bovugo-63: frame 149.925, canvas 183)", () => {
    const geo = layout([
      'opt toto',
      'Bob->Alice : coucou\\nit\\nme',
      'activate Alice',
      'Alice->Alice: well',
      'else sinon',
      'Alice-->Bob: ok',
      'end',
      'deactivate Alice',
    ]);
    expect(groups(geo)[0]!.width).toBeCloseTo(149.925, 3);
    expect(svgWidth(geo)).toBe(183);
  });

  it('shifts the drawing right when an exo tile drags the frame left (bifuzu-54: frame x 13)', () => {
    const geo = layout([
      'group groupname',
      '    [-> B : label1',
      '    & B -> C : label2',
      '    C -> B : label3',
      '    & B ->[ : label4',
      'end',
    ]);
    const [frame] = groups(geo);
    // getMinX = min - EXTERNAL_MARGINX1 lands on the 10 px margin.
    expect(frame!.x).toBeCloseTo(10 + FRAME_EXTERNAL_MARGIN_X1, 6);
    expect(frame!.width).toBeCloseTo(149.55, 3);
  });
});

/** The participant `id`'s geometry. */
function participant(geo: SequenceGeometry, id: string): ParticipantGeo {
  return geo.participants.find((p) => p.id === id)!;
}

/** The leftmost lifeline box, `xorigin.addAtLeast(0)` (`SequenceDiagramFileMakerTeoz.java:89-96`). */
function origin(geo: SequenceGeometry): number {
  return Math.min(...geo.participants.map((p) => p.x));
}

describe('child tile kinds (GroupingTile.java:188-215)', () => {
  it('reaches the x origin for a divider: DividerTile#getMinX is xorigin (DividerTile.java:111-113)', () => {
    const geo = layout(['participant A', 'participant B', 'group G', 'A -> B : x', '== d ==', 'end']);
    expect(groups(geo)[0]!.x).toBeCloseTo(origin(geo) - FRAME_MARGIN_X, 6);
  });

  it('reaches the x origin for a newpage (NewpageTile.java:110-116)', () => {
    const geo = layout(['participant A', 'participant B', 'group G', 'B -> B : x', 'newpage', 'end']);
    expect(groups(geo)[0]!.x).toBeCloseTo(origin(geo) - FRAME_MARGIN_X, 6);
  });

  it('starts an empty group at the x origin (:217-218)', () => {
    const geo = layout(['participant A', 'participant B', 'A -> B : x', 'group G', 'end']);
    expect(groups(geo)[0]!.x).toBeCloseTo(origin(geo), 6);
  });

  it('spans a delay: middle -/+ preferredWidth / 2 (DelayTile.java:123-131)', () => {
    const geo = layout(['participant A', 'participant B', 'group G', '...a long long delay text...', 'end']);
    const delay = geo.events.find((e): e is DelayGeo => e.kind === 'delay')!;
    expect(groups(geo)[0]!.x).toBeCloseTo(delay.middleX - delay.textWidth / 2 - FRAME_MARGIN_X, 6);
  });

  it("spans a ref: ReferenceTile's first/last, xMargin (2) outside its box (ReferenceTile.java:163-180)", () => {
    const geo = layout(['participant A', 'participant B', 'participant C', 'group G', 'ref over B, C : r', 'end']);
    const ref = geo.events.find((e): e is FrameGeo => e.kind === 'frame' && e.frameType === 'ref')!;
    const frame = groups(geo)[0]!;
    expect(frame.x).toBeCloseTo(ref.x - 2 - FRAME_MARGIN_X, 6);
    expect(frame.x + frame.width).toBeCloseTo(ref.x + ref.width + 2 + FRAME_MARGIN_X, 6);
  });

  it('reads a nested group as one tile: its getMinX/getMaxX, -3/+9 past its frame (:984-990)', () => {
    const geo = layout([
      'participant A',
      'participant B',
      'participant C',
      'group O',
      'group I',
      'B -> C : x',
      'end',
      'end',
    ]);
    const [outer, inner] = groups(geo);
    expect(outer!.x).toBeCloseTo(inner!.x - FRAME_EXTERNAL_MARGIN_X1 - FRAME_MARGIN_X, 6);
    expect(outer!.x + outer!.width).toBeCloseTo(inner!.x + inner!.width + FRAME_EXTERNAL_MARGIN_X2 + FRAME_MARGIN_X, 6);
  });

  it('spans a right-border exo: posC to posC + width (CommunicationExoTile.java:206-218)', () => {
    const geo = layout(['participant A', 'participant B', 'group G', 'A ->] : out', 'end']);
    const a = participant(geo, 'A');
    expect(groups(geo)[0]!.x).toBeCloseTo(a.centerX - FRAME_MARGIN_X, 6);
    expect(groups(geo)[0]!.x + groups(geo)[0]!.width).toBeGreaterThan(a.centerX + FRAME_MARGIN_X);
  });

  it("spans a created participant's posC: the CREATE LifeEventTile (CommandArrow.java:397-398)", () => {
    const geo = layout(['participant A', 'group G', 'A -> B ** : make', 'end']);
    const frame = groups(geo)[0]!;
    expect(frame.x + frame.width).toBeCloseTo(participant(geo, 'B').centerX + FRAME_MARGIN_X, 6);
  });

  it('spans a deactivate at its level: posC - 5 .. posC + level * 5 (LifeEventTile.java:143-158)', () => {
    const geo = layout([
      'participant A',
      'participant B',
      'A -> B ++ : go',
      'activate B',
      'group G',
      'deactivate B',
      'end',
    ]);
    const b = participant(geo, 'B');
    // After the deactivate one level stays open: min posC - 5, max posC + 5.
    expect(groups(geo)[0]!.x).toBeCloseTo(b.centerX - 5 - FRAME_MARGIN_X, 6);
  });

  it('spans an unlabelled self message by the loop alone, xRight = 42 (ComponentRoseSelfArrow.java:348-352)', () => {
    const geo = layout(['participant A', 'participant B', 'group G', 'B -> B', 'end']);
    const frame = groups(geo)[0]!;
    expect(frame.x + frame.width).toBeCloseTo(participant(geo, 'B').centerX + 42 + FRAME_MARGIN_X, 6);
  });
  it('builds no tile for an event on an unknown participant (messageTileMetrics / exoTileMetrics guards)', () => {
    const ast = astOrThrow(
      parseSequence(sourceOf(['participant A', 'group G', 'A -> A : x', 'A ->] : y', 'activate A', 'end'])),
      'sequence',
    );
    const frame = ast.events.find((e): e is FrameEvent => e.kind === 'frame')!;
    // A hand-built AST naming a participant the layout never placed.
    frame.branches[0] = frame.branches[0]!.map((e) =>
      e.kind === 'message' ? { ...e, from: 'Z', to: 'Z' } : e.kind === 'messageExo' ? { ...e, participant: 'Z' } : e,
    );
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const a = participant(geo, 'A');
    // Only the activate on A is left: LifeEventTile posC .. posC + 5.
    expect(groups(geo)[0]!.x).toBeCloseTo(a.centerX - 5 - FRAME_MARGIN_X, 6);
  });
});

describe('group frame in the document width (GroupingTile.java:988-990)', () => {
  it('reaches EXTERNAL_MARGINX2 (9) past the frame (cujoci-19: canvas 119)', () => {
    const geo = layout([
      'skinparam sequenceGroupHeaderFontName Impact',
      'skinparam sequenceReferenceFontName Impact',
      'Alice -> Bob: ok',
      'alt',
      'Alice -> Bob: ok',
      'end',
      'ref over Alice,Bob',
      '  some text',
      'end',
    ]);
    const [frame] = groups(geo);
    expect(geo.totalWidth).toBeGreaterThanOrEqual(frame!.x + frame!.width + FRAME_EXTERNAL_MARGIN_X2);
    expect(svgWidth(geo)).toBe(119);
  });
});

describe('parallel groups (GroupingTile.java:145-154,229-239)', () => {
  it("starts an `& opt` at the previous tile's min, beside it (caciga-47: both at y 51)", () => {
    const geo = layout(['opt', '    A->B: message', 'end', '& opt', '    C->D: message', 'end', 'A -> B : after']);
    const [first, second] = groups(geo);
    expect(second!.y).toBe(first!.y);
    expect(first!.y).toBe(51);
    // Its x is its own tiles' (C -> D): posC(C) - MARGINX.
    const c = geo.participants.find((p) => p.id === 'C')!;
    expect(second!.x).toBeCloseTo(c.centerX - FRAME_MARGIN_X, 6);
  });

  it('pushes the next tile below the taller of the pair (parallelMax.ensureBiggerThan(previousMax))', () => {
    const geo = layout([
      'opt',
      '    A->B: one',
      '    A->B: two',
      'end',
      '& opt',
      '    C->D: message',
      'end',
      'A -> B : after',
    ]);
    const [first] = groups(geo);
    const after = geo.events.filter((e) => e.kind === 'message').at(-1)!;
    // The taller first frame's reserved height ends 4 + 10 below its border.
    expect(after.kind === 'message' && after.y).toBeGreaterThan(first!.y + first!.height);
  });
});

describe('T3c2: x origin and parallel chains', () => {
  it('reaches the layout x origin for a divider, which lands the frame on the margin (probe q3: frame x 13)', () => {
    // DividerTile#getMinX is xorigin (DividerTile.java:111-113): min = xorigin - 16,
    // getMinX = min - 3 drives the shift, so the frame border lands at 10 + 3.
    const geo = layout(['participant a', 'participant b', 'participant c', 'group g', 'a -> b : x', '== d ==', 'end']);
    expect(groups(geo)[0]!.x).toBe(13);
    expect(participant(geo, 'a').centerX).toBeCloseTo(39.894, 3);
  });

  it('chains a third `&` group on the same min (GroupingTile.java:236, probe q2: all at y 51)', () => {
    const geo = layout([
      'opt one',
      'A -> B : x',
      'end',
      '& opt two',
      'C -> D : y',
      'end',
      '& opt three',
      'E -> F : z',
      'end',
      'A -> B : after',
    ]);
    expect(groups(geo).map((g) => g.y)).toEqual([51, 51, 51]);
  });

  it('chains a `&` group after a `++` message on its LifeEventTile, below it (rugeco-70: frame y 78)', () => {
    // The `++` is a LifeEventTile of its own, createPropagating with height 0
    // (LifeEventTile.java:95,128-138): its min is the message's max.
    const geo = layout([
      'participant a',
      'participant b',
      'participant c',
      'b ->> c ++: Outside Group',
      '&opt test',
      '  activate a',
      '  a ->> b --++ : Inside Group',
      'end',
      'deactivate a',
      'deactivate c',
      'deactivate b',
    ]);
    expect(groups(geo)[0]!.y).toBe(78);
  });

  it('shifts the drawing by a reverse self loop on the first participant: its tile min (probe r1: a at 126.619)', () => {
    // PlayingSpace min folds CommunicationTileSelf#getMinX, posC - getCompWidth()
    // (:263-270), left of the drawn stroke (PlayingSpace.java:91-94).
    const geo = layout(['a <- a : reverse loop label', 'a -> b : hi']);
    expect(participant(geo, 'a').centerX).toBeCloseTo(126.619, 3);
    const loop = geo.events.find((e) => e.kind === 'message');
    expect(loop?.kind === 'message' && loop.tileMinX).toBeCloseTo(10, 6);
  });

  it('scales the reverse loop tile min with the geometry (scale-geo.ts)', () => {
    const geo = layout(['a <- a : reverse loop label', 'a -> b : hi']);
    const scaled = scaleSequenceGeometry(geo, 2).events.find((e) => e.kind === 'message');
    expect(scaled?.kind === 'message' && scaled.tileMinX).toBeCloseTo(20, 6);
  });
});
