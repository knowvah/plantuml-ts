import { describe, it, expect } from 'vitest';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import {
  arrowConfigurationOf,
} from '../../../src/diagrams/sequence/sequence-parse-helpers.js';
import type { ArrowSpec } from '../../../src/diagrams/sequence/sequence-parse-helpers.js';
import {
  ARROW_DELTA_X,
  ARROW_DELTA_Y,
  NICE_ARROW_INSET,
  DIAM_CIRCLE,
  THIN_CIRCLE,
  SPACE_CROSS_X,
  headGeometryNormalSide,
  headGeometryReverseSide,
  headGeometrySelf,
} from '../../../src/diagrams/sequence/sequence-arrowhead.js';
import type {
  ArrowConfiguration,
  ArrowDecoration,
  ArrowDressing,
  ArrowHeadKind,
  ArrowPart,
} from '../../../src/diagrams/sequence/sequence-arrowhead.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const NO_DECORATION = 'NONE';
const CIRCLE_DECORATION = 'CIRCLE';

/** Circle-induced head shift: `diamCircle / 2 + thinCircle`
 *  (ComponentRoseArrow.java:206, :243). */
const CIRCLE_SHIFT = DIAM_CIRCLE / 2 + THIN_CIRCLE;

function dressing(head: ArrowHeadKind, part: ArrowPart): ArrowDressing {
  return { head, part };
}

function pt(x: number, y: number): { x: number; y: number } {
  return { x, y };
}

/** A config whose `getPart()` resolves through `dressing2` — upstream picks
 *  dressing2's part whenever its head is not NONE
 *  (ArrowConfiguration.java:221-226). */
function selfConfig(head: ArrowHeadKind, part: ArrowPart): ArrowConfiguration {
  return {
    dressing1: dressing('NONE', 'FULL'),
    dressing2: dressing(head, part),
    decoration1: NO_DECORATION,
    decoration2: NO_DECORATION,
    dashed: false,
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('sequence arrowhead constants', () => {
  it('carries the upstream arrow deltas and circle/cross metrics', () => {
    expect(ARROW_DELTA_X).toBe(10);
    expect(ARROW_DELTA_Y).toBe(4);
    expect(NICE_ARROW_INSET).toBe(4);
    expect(DIAM_CIRCLE).toBe(8);
    expect(THIN_CIRCLE).toBe(1.5);
    expect(SPACE_CROSS_X).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// T6: parity with the deleted `MessageStyle` adapter
// ---------------------------------------------------------------------------

/**
 * The six values of the DELETED `MessageStyle` enum (`ast.ts:39-45` before
 * T6). Nothing in `src/` names them any more; they survive here only as the
 * coordinate system the parity oracle below is expressed in.
 */
type LegacyStyle = 'sync' | 'async' | 'reply' | 'replyAsync' | 'lost' | 'found';

/** The four booleans `MessageEvent` carried beside `style` before T6. */
interface LegacyDecorations {
  readonly headCircle?: boolean;
  readonly tailCircle?: boolean;
  readonly headCross?: boolean;
  readonly tailCross?: boolean;
}

/** `HEAD_BY_STYLE`, transcribed from the deleted `sequence-arrowhead.ts:447`. */
const LEGACY_HEAD_BY_STYLE: Readonly<Record<LegacyStyle, ArrowDressing>> = {
  sync: dressing('NORMAL', 'FULL'),
  async: dressing('ASYNC', 'FULL'),
  reply: dressing('NORMAL', 'FULL'),
  replyAsync: dressing('ASYNC', 'FULL'),
  lost: dressing('NORMAL', 'FULL'),
  found: dressing('NORMAL', 'FULL'),
};

/** `DASHED_STYLES`, transcribed from the deleted `sequence-arrowhead.ts:462`. */
const LEGACY_DASHED: Readonly<Record<LegacyStyle, boolean>> = {
  sync: false, async: false, reply: true, replyAsync: true, lost: false, found: false,
};

/**
 * The composition T6 replaced: the deleted `arrowConfigurationFor(style)`
 * (`sequence-arrowhead.ts:489`) with the deleted `applyMessageDecorations`
 * overlay (`renderer-arrowhead.ts:225`) on top of it. This is the ORACLE —
 * every assertion below compares the parser's new `ArrowConfiguration`
 * against it, so a divergence fails rather than being absorbed.
 */
function legacyArrowConfiguration(
  style: LegacyStyle,
  d: LegacyDecorations = {},
): ArrowConfiguration {
  const base = {
    dressing1: dressing('NONE', 'FULL'),
    dressing2: LEGACY_HEAD_BY_STYLE[style],
    decoration1: NO_DECORATION as ArrowDecoration,
    decoration2: NO_DECORATION as ArrowDecoration,
    dashed: LEGACY_DASHED[style],
  };
  return {
    ...base,
    decoration1: d.tailCircle === true ? CIRCLE_DECORATION : base.decoration1,
    decoration2: d.headCircle === true ? CIRCLE_DECORATION : base.decoration2,
    dressing1: d.tailCross === true ? dressing('CROSSX', 'FULL') : base.dressing1,
    dressing2: d.headCross === true
      ? { ...base.dressing2, head: 'CROSSX' }
      : base.dressing2,
  };
}

const ALL_LEGACY_STYLES: readonly LegacyStyle[] = [
  'sync', 'async', 'reply', 'replyAsync', 'lost', 'found',
];

/** All 2^4 settings of the four deleted booleans. */
const ALL_DECORATION_COMBOS: readonly LegacyDecorations[] = Array.from(
  { length: 16 },
  (_unused, bits) => ({
    headCircle: (bits & 1) !== 0,
    tailCircle: (bits & 2) !== 0,
    headCross: (bits & 4) !== 0,
    tailCross: (bits & 8) !== 0,
  }),
);

/** The spec `command-arrow.ts` hands {@link arrowConfigurationOf} for a
 *  message the old enum described as `style` plus those four booleans. */
function specFor(style: LegacyStyle, d: LegacyDecorations): ArrowSpec {
  return {
    dashed: LEGACY_DASHED[style],
    async2: style === 'async' || style === 'replyAsync',
    circle1: d.tailCircle === true,
    circle2: d.headCircle === true,
    cross1: d.tailCross === true,
    cross2: d.headCross === true,
  };
}

describe('arrowConfigurationOf — exhaustive parity with the deleted adapter', () => {
  const cases = ALL_LEGACY_STYLES.flatMap((style) =>
    ALL_DECORATION_COMBOS.map((d) => ({ style, d })),
  );

  it('covers all six styles times all sixteen decoration settings', () => {
    expect(cases).toHaveLength(96);
  });

  it.each(cases)(
    'builds the legacy configuration for $style with $d',
    ({ style, d }) => {
      expect(arrowConfigurationOf(specFor(style, d))).toEqual(
        legacyArrowConfiguration(style, d),
      );
    },
  );

  // `withDirectionBoth()` (`ArrowConfiguration.java:101-105`) gives dressing1
  // a NORMAL head too. No enumerated token reached it, so it has no legacy
  // counterpart -- assert it directly against the Java.
  it('gives dressing1 a NORMAL head under withDirectionBoth', () => {
    expect(arrowConfigurationOf({ both: true }).dressing1).toEqual(
      dressing('NORMAL', 'FULL'),
    );
  });

  // `withHead1`/`withHead2(CROSSX)` run AFTER `withHead1/2(ASYNC)`
  // (`CommandArrow.java:355-358` then `:373-387`), so the cross wins.
  it('lets CROSSX overwrite an ASYNC head on either side', () => {
    const cfg = arrowConfigurationOf({
      async1: true, async2: true, cross1: true, cross2: true, both: true,
    });
    expect(cfg.dressing1.head).toBe('CROSSX');
    expect(cfg.dressing2.head).toBe('CROSSX');
  });

  it('keeps an ASYNC head on dressing1 when no cross overwrites it', () => {
    expect(arrowConfigurationOf({ async1: true }).dressing1).toEqual(
      dressing('ASYNC', 'FULL'),
    );
  });
});

/**
 * Every arrow form the two enumerated regexes accepted, with the
 * `MessageStyle` + decoration flags the pre-T6 parser produced for it. The
 * table was MEASURED, not hand-written: a detached worktree at the pre-T6
 * commit parsed each `src` and dumped
 * `applyMessageDecorations(arrowConfigurationFor(style), msg)`; all 48 rows
 * matched the new parser's `arrow` field byte for byte.
 *
 * Some rows pinned quirks of the deleted table rather than upstream behavior --
 * `o->>` resolved to `sync`, not `async`, because the decorated rule fell
 * back to the shaft length and ignored the right dressing, and `<->` took
 * the same fallback. They were pinned here so T7's rebuild had to CHOOSE to
 * change them.
 *
 * T7 CHOSE, on jar evidence rather than on the deleted table. Thirteen rows
 * left this list:
 *
 *  - `->?`, `?->`, `->\\`, `->/` moved to the refusal case below. The jar
 *    reports `Error line 2` for all four (`scripts/oracle-render.sh`, T7):
 *    `?` is `CommandExoArrow*`'s ARROW_SUPPCIRCLE marker and neither
 *    `>\\` nor `>/` is an ARROW_DRESSING2 alternative
 *    (`CommandArrow.java:112-116`), so upstream's own regex declines them.
 *  - `o->>`, `->>o`, `o-->>`, `<->`, `<<->`, `<->>`, `o<->x`, `\\->`, `/->`
 *    moved to `command-arrow.test.ts`, which asserts each against
 *    `executeArg`'s real `sync1`/`sync2`/`reverseDefine` algebra
 *    (`CommandArrow.java:300-390`) instead of against the deleted enum. The
 *    legacy oracle CANNOT express what they actually are: `withDirectionBoth`
 *    gives dressing1 a NORMAL head and `sync1` gives it an ASYNC one, and
 *    `LEGACY_HEAD_BY_STYLE` has no way to say either.
 */
const LEGACY_TOKEN_ORACLE: readonly {
  readonly src: string;
  readonly from: string;
  readonly to: string;
  readonly style: LegacyStyle;
  readonly decorations?: LegacyDecorations;
}[] = [
  { src: 'Alice -> Bob', from: 'Alice', to: 'Bob', style: 'sync' },
  { src: 'Alice ->> Bob', from: 'Alice', to: 'Bob', style: 'async' },
  { src: 'Alice --> Bob', from: 'Alice', to: 'Bob', style: 'reply' },
  { src: 'Alice -->> Bob', from: 'Alice', to: 'Bob', style: 'replyAsync' },
  { src: 'Alice <- Bob', from: 'Bob', to: 'Alice', style: 'sync' },
  { src: 'Alice <<- Bob', from: 'Bob', to: 'Alice', style: 'async' },
  { src: 'Alice <-- Bob', from: 'Bob', to: 'Alice', style: 'reply' },
  { src: 'Alice <<-- Bob', from: 'Bob', to: 'Alice', style: 'replyAsync' },
  { src: 'Alice ->o Bob', from: 'Alice', to: 'Bob', style: 'sync', decorations: { headCircle: true } },
  { src: 'Alice o-> Bob', from: 'Alice', to: 'Bob', style: 'sync', decorations: { tailCircle: true } },
  { src: 'Alice ->x Bob', from: 'Alice', to: 'Bob', style: 'sync', decorations: { headCross: true } },
  { src: 'Alice x-> Bob', from: 'Alice', to: 'Bob', style: 'sync', decorations: { tailCross: true } },
  { src: 'Alice o->o Bob', from: 'Alice', to: 'Bob', style: 'sync', decorations: { headCircle: true, tailCircle: true } },
  { src: 'Alice x->x Bob', from: 'Alice', to: 'Bob', style: 'sync', decorations: { headCross: true, tailCross: true } },
  { src: 'Alice o->x Bob', from: 'Alice', to: 'Bob', style: 'sync', decorations: { tailCircle: true, headCross: true } },
  { src: 'Alice x->o Bob', from: 'Alice', to: 'Bob', style: 'sync', decorations: { headCircle: true, tailCross: true } },
  { src: 'Alice -->o Bob', from: 'Alice', to: 'Bob', style: 'reply', decorations: { headCircle: true } },
  { src: 'Alice o--> Bob', from: 'Alice', to: 'Bob', style: 'reply', decorations: { tailCircle: true } },
  { src: 'Alice -->x Bob', from: 'Alice', to: 'Bob', style: 'reply', decorations: { headCross: true } },
  { src: 'Alice x--> Bob', from: 'Alice', to: 'Bob', style: 'reply', decorations: { tailCross: true } },
  { src: 'Alice <-o Bob', from: 'Bob', to: 'Alice', style: 'sync', decorations: { tailCircle: true } },
  { src: 'Alice o<- Bob', from: 'Bob', to: 'Alice', style: 'sync', decorations: { headCircle: true } },
  { src: 'Alice <-x Bob', from: 'Bob', to: 'Alice', style: 'sync', decorations: { tailCross: true } },
  { src: 'Alice x<- Bob', from: 'Bob', to: 'Alice', style: 'sync', decorations: { headCross: true } },
  { src: 'Alice <--o Bob', from: 'Bob', to: 'Alice', style: 'reply', decorations: { tailCircle: true } },
  { src: 'Alice o<-- Bob', from: 'Bob', to: 'Alice', style: 'reply', decorations: { headCircle: true } },
  { src: 'Alice <<-o Bob', from: 'Bob', to: 'Alice', style: 'async', decorations: { tailCircle: true } },
  { src: 'Alice o<<- Bob', from: 'Bob', to: 'Alice', style: 'async', decorations: { headCircle: true } },
  { src: 'Alice <<--o Bob', from: 'Bob', to: 'Alice', style: 'replyAsync', decorations: { tailCircle: true } },
  { src: 'Alice o<<-- Bob', from: 'Bob', to: 'Alice', style: 'replyAsync', decorations: { headCircle: true } },
  { src: 'Alice o<<--x Bob', from: 'Bob', to: 'Alice', style: 'replyAsync', decorations: { headCircle: true, tailCross: true } },
  { src: 'Alice -->>x Bob', from: 'Alice', to: 'Bob', style: 'reply', decorations: { headCross: true } },
  { src: 'Alice -> Alice', from: 'Alice', to: 'Alice', style: 'sync' },
  { src: 'Alice ->o Alice', from: 'Alice', to: 'Alice', style: 'sync', decorations: { headCircle: true } },
  { src: 'Alice <- Alice', from: 'Alice', to: 'Alice', style: 'sync' },
];

describe('parsed arrow tokens carry the legacy ArrowConfiguration', () => {
  it.each(LEGACY_TOKEN_ORACLE)('$src', ({ src, from, to, style, decorations }) => {
    const result = parseSequence([`${src} : hi`]);
    if ('refused' in result) throw new Error(`refused: ${result.message}`);
    const msg = result.events.find((e) => e.kind === 'message');
    expect(msg).toBeDefined();
    expect(msg?.from).toBe(from);
    expect(msg?.to).toBe(to);
    expect(msg?.arrow).toEqual(legacyArrowConfiguration(style, decorations ?? {}));
  });

  // The two forms the pre-T6 parser refused, plus the four T7's composed
  // grammar stopped accepting. All six are `Error line 2` from the jar --
  // measured with `scripts/oracle-render.sh`, T7 -- so refusing is the
  // faithful answer, not a capability loss.
  it.each([
    'Alice <\\\\- Bob',
    'Alice -\\\\> Bob',
    'Alice ->? Bob',
    'Alice ?-> Bob',
    'Alice ->\\\\ Bob',
    'Alice ->/ Bob',
  ])('still refuses %s', (src) => {
    const result = parseSequence([`${src} : hi`]);
    expect('refused' in result).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// headGeometryNormalSide — dressing2, getPolygonNormal
// ---------------------------------------------------------------------------

describe('headGeometryNormalSide', () => {
  it('builds the nice-arrow FULL polygon', () => {
    const geo = headGeometryNormalSide(
      dressing('NORMAL', 'FULL'),
      NO_DECORATION,
      true,
    );
    expect(geo.polygon).toEqual([pt(-10, -4), pt(0, 0), pt(-10, 4), pt(-6, 0)]);
    expect(geo.lines).toBeUndefined();
    expect(geo.circle).toBeUndefined();
  });

  it('omits the nice-arrow point under strict UML style', () => {
    const geo = headGeometryNormalSide(
      dressing('NORMAL', 'FULL'),
      NO_DECORATION,
      false,
    );
    expect(geo.polygon).toEqual([pt(-10, -4), pt(0, 0), pt(-10, 4)]);
  });

  it('builds the TOP_PART half polygon with no nice-arrow point', () => {
    const geo = headGeometryNormalSide(
      dressing('NORMAL', 'TOP_PART'),
      NO_DECORATION,
      true,
    );
    expect(geo.polygon).toEqual([pt(-10, -4), pt(0, 0), pt(-10, 0)]);
  });

  it('builds the BOTTOM_PART half polygon', () => {
    const geo = headGeometryNormalSide(
      dressing('NORMAL', 'BOTTOM_PART'),
      NO_DECORATION,
      true,
    );
    expect(geo.polygon).toEqual([pt(-10, 0), pt(0, 0), pt(-10, 4)]);
  });

  it('builds two ASYNC line segments for a FULL part', () => {
    const geo = headGeometryNormalSide(
      dressing('ASYNC', 'FULL'),
      NO_DECORATION,
      true,
    );
    expect(geo.lines).toEqual([
      [pt(0, 0), pt(-10, -4)],
      [pt(0, 0), pt(-10, 4)],
    ]);
    expect(geo.polygon).toBeUndefined();
  });

  it('builds exactly one ASYNC segment for TOP_PART', () => {
    const geo = headGeometryNormalSide(
      dressing('ASYNC', 'TOP_PART'),
      NO_DECORATION,
      true,
    );
    expect(geo.lines).toEqual([[pt(0, 0), pt(-10, -4)]]);
  });

  it('builds exactly one ASYNC segment for BOTTOM_PART', () => {
    const geo = headGeometryNormalSide(
      dressing('ASYNC', 'BOTTOM_PART'),
      NO_DECORATION,
      true,
    );
    expect(geo.lines).toEqual([[pt(0, 0), pt(-10, 4)]]);
  });

  it('builds the CROSSX saltire left of the tip', () => {
    const geo = headGeometryNormalSide(
      dressing('CROSSX', 'FULL'),
      NO_DECORATION,
      true,
    );
    expect(geo.lines).toEqual([
      [pt(-16, -5), pt(-6, 5)],
      [pt(-16, 5), pt(-6, -5)],
    ]);
  });

  it('produces no shape for a NONE head', () => {
    const geo = headGeometryNormalSide(
      dressing('NONE', 'FULL'),
      NO_DECORATION,
      true,
    );
    expect(geo).toEqual({});
  });

  it('places the CIRCLE decoration right of the tip and shifts the head', () => {
    const geo = headGeometryNormalSide(
      dressing('NORMAL', 'FULL'),
      CIRCLE_DECORATION,
      true,
    );
    expect(geo.circle).toEqual({
      cx: 1.5,
      cy: -0.75,
      d: 8,
      thickness: 1.5,
    });
    expect(geo.polygon).toEqual([
      pt(-10 - CIRCLE_SHIFT, -4),
      pt(-CIRCLE_SHIFT, 0),
      pt(-10 - CIRCLE_SHIFT, 4),
      pt(-6 - CIRCLE_SHIFT, 0),
    ]);
  });

  it('shifts a CROSSX head too — dressing2 translates unconditionally', () => {
    const geo = headGeometryNormalSide(
      dressing('CROSSX', 'FULL'),
      CIRCLE_DECORATION,
      true,
    );
    expect(geo.lines).toEqual([
      [pt(-16 - CIRCLE_SHIFT, -5), pt(-6 - CIRCLE_SHIFT, 5)],
      [pt(-16 - CIRCLE_SHIFT, 5), pt(-6 - CIRCLE_SHIFT, -5)],
    ]);
  });

  it('draws the circle alone for a NONE head', () => {
    const geo = headGeometryNormalSide(
      dressing('NONE', 'FULL'),
      CIRCLE_DECORATION,
      true,
    );
    expect(geo.circle).toEqual({ cx: 1.5, cy: -0.75, d: 8, thickness: 1.5 });
    expect(geo.polygon).toBeUndefined();
    expect(geo.lines).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// headGeometryReverseSide — dressing1, getPolygonReverse
// ---------------------------------------------------------------------------

describe('headGeometryReverseSide', () => {
  it('builds the nice-arrow FULL polygon mirrored about the tip', () => {
    const geo = headGeometryReverseSide(
      dressing('NORMAL', 'FULL'),
      NO_DECORATION,
      true,
    );
    expect(geo.polygon).toEqual([pt(10, -4), pt(0, 0), pt(10, 4), pt(6, 0)]);
  });

  it('omits the nice-arrow point under strict UML style', () => {
    const geo = headGeometryReverseSide(
      dressing('NORMAL', 'FULL'),
      NO_DECORATION,
      false,
    );
    expect(geo.polygon).toEqual([pt(10, -4), pt(0, 0), pt(10, 4)]);
  });

  it('builds the TOP_PART half polygon with no nice-arrow point', () => {
    const geo = headGeometryReverseSide(
      dressing('NORMAL', 'TOP_PART'),
      NO_DECORATION,
      true,
    );
    expect(geo.polygon).toEqual([pt(10, -4), pt(0, 0), pt(10, 0)]);
  });

  it('builds the BOTTOM_PART half polygon', () => {
    const geo = headGeometryReverseSide(
      dressing('NORMAL', 'BOTTOM_PART'),
      NO_DECORATION,
      true,
    );
    expect(geo.polygon).toEqual([pt(10, 0), pt(0, 0), pt(10, 4)]);
  });

  it('builds two ASYNC line segments for a FULL part', () => {
    const geo = headGeometryReverseSide(
      dressing('ASYNC', 'FULL'),
      NO_DECORATION,
      true,
    );
    expect(geo.lines).toEqual([
      [pt(0, 0), pt(10, -4)],
      [pt(0, 0), pt(10, 4)],
    ]);
  });

  it('builds exactly one ASYNC segment for TOP_PART', () => {
    const geo = headGeometryReverseSide(
      dressing('ASYNC', 'TOP_PART'),
      NO_DECORATION,
      true,
    );
    expect(geo.lines).toEqual([[pt(0, 0), pt(10, -4)]]);
  });

  it('builds exactly one ASYNC segment for BOTTOM_PART', () => {
    const geo = headGeometryReverseSide(
      dressing('ASYNC', 'BOTTOM_PART'),
      NO_DECORATION,
      true,
    );
    expect(geo.lines).toEqual([[pt(0, 0), pt(10, 4)]]);
  });

  it('builds the CROSSX saltire right of the tip', () => {
    const geo = headGeometryReverseSide(
      dressing('CROSSX', 'FULL'),
      NO_DECORATION,
      true,
    );
    expect(geo.lines).toEqual([
      [pt(6, -5), pt(16, 5)],
      [pt(6, 5), pt(16, -5)],
    ]);
  });

  it('produces no shape for a NONE head', () => {
    const geo = headGeometryReverseSide(
      dressing('NONE', 'FULL'),
      NO_DECORATION,
      true,
    );
    expect(geo).toEqual({});
  });

  it('places the CIRCLE decoration left of the tip and shifts the head', () => {
    const geo = headGeometryReverseSide(
      dressing('NORMAL', 'FULL'),
      CIRCLE_DECORATION,
      true,
    );
    expect(geo.circle).toEqual({
      cx: -1.5,
      cy: -0.75,
      d: 8,
      thickness: 1.5,
    });
    expect(geo.polygon).toEqual([
      pt(10 + CIRCLE_SHIFT, -4),
      pt(CIRCLE_SHIFT, 0),
      pt(10 + CIRCLE_SHIFT, 4),
      pt(6 + CIRCLE_SHIFT, 0),
    ]);
  });

  it('leaves a CROSSX head unshifted — dressing1 skips the translate', () => {
    const geo = headGeometryReverseSide(
      dressing('CROSSX', 'FULL'),
      CIRCLE_DECORATION,
      true,
    );
    expect(geo.circle).toEqual({ cx: -1.5, cy: -0.75, d: 8, thickness: 1.5 });
    expect(geo.lines).toEqual([
      [pt(6, -5), pt(16, 5)],
      [pt(6, 5), pt(16, -5)],
    ]);
  });

  it('shifts ASYNC segments when a circle is present', () => {
    const geo = headGeometryReverseSide(
      dressing('ASYNC', 'FULL'),
      CIRCLE_DECORATION,
      true,
    );
    expect(geo.lines).toEqual([
      [pt(CIRCLE_SHIFT, 0), pt(10 + CIRCLE_SHIFT, -4)],
      [pt(CIRCLE_SHIFT, 0), pt(10 + CIRCLE_SHIFT, 4)],
    ]);
  });
});

// ---------------------------------------------------------------------------
// headGeometrySelf — ComponentRoseSelfArrow#getPolygon
// ---------------------------------------------------------------------------

describe('headGeometrySelf', () => {
  it('points right with the nice-arrow inset when not reverse-defined', () => {
    const geo = headGeometrySelf(selfConfig('NORMAL', 'FULL'), false, true);
    expect(geo.polygon).toEqual([pt(10, -4), pt(0, 0), pt(10, 4), pt(6, 0)]);
  });

  it('points left when reverse-defined, insetting the other way', () => {
    const geo = headGeometrySelf(selfConfig('NORMAL', 'FULL'), true, true);
    expect(geo.polygon).toEqual([pt(-10, -4), pt(0, 0), pt(-10, 4), pt(-6, 0)]);
  });

  it('omits the nice-arrow point under strict UML style', () => {
    const geo = headGeometrySelf(selfConfig('NORMAL', 'FULL'), false, false);
    expect(geo.polygon).toEqual([pt(10, -4), pt(0, 0), pt(10, 4)]);
  });

  it('nudges the TOP_PART polygon back by one, unlike the flat builders', () => {
    const geo = headGeometrySelf(selfConfig('NORMAL', 'TOP_PART'), false, true);
    expect(geo.polygon).toEqual([pt(9, -4), pt(-1, 0), pt(9, 0)]);
  });

  it('nudges the BOTTOM_PART polygon back by one', () => {
    const geo = headGeometrySelf(
      selfConfig('NORMAL', 'BOTTOM_PART'),
      false,
      true,
    );
    expect(geo.polygon).toEqual([pt(9, 0), pt(-1, 0), pt(9, 4)]);
  });

  it('mirrors the BOTTOM_PART nudge when reverse-defined', () => {
    const geo = headGeometrySelf(
      selfConfig('NORMAL', 'BOTTOM_PART'),
      true,
      true,
    );
    expect(geo.polygon).toEqual([pt(-11, 0), pt(-1, 0), pt(-11, 4)]);
  });

  it('falls back to dressing1 part when dressing2 has no head', () => {
    const cfg: ArrowConfiguration = {
      dressing1: dressing('NORMAL', 'TOP_PART'),
      dressing2: dressing('NONE', 'FULL'),
      decoration1: NO_DECORATION,
      decoration2: NO_DECORATION,
      dashed: false,
    };
    const geo = headGeometrySelf(cfg, false, true);
    expect(geo.polygon).toEqual([pt(9, -4), pt(-1, 0), pt(9, 0)]);
  });
});
