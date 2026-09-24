/**
 * cdd-T15 (A2a/M1, decisions.md D6) — the qualified-association box.
 *
 * A faithful port of `~/git/plantuml/src/main/java/net/sourceforge/plantuml/
 * svek/Kal.java`: `class1 [Qualifier] --> class2` makes upstream build one
 * `Kal` per qualified end (`svek/SvekEdge.java:242-246`, off
 * `classdiagram/command/CommandLinkClass.java:345-353`'s `QUALIFIER1`/
 * `QUALIFIER2` groups). A `Kal` is four things at once, and all four are
 * ported here:
 *
 *  1. a MEASURE — `textBlock.calculateDimension(…).delta(4, 2)`
 *     (`Kal.java:104`);
 *  2. a NODE MARGIN — `entity.ensureMargins(new Margins(…))`
 *     (`Kal.java:106-121`), which becomes the qualified node's DOT shield
 *     table (`svek/SvekNode.java:245-267`), plus `EntityImageClass.java:113`'s
 *     `Math.max(width, getKalWidth() * 1.3)` width floor;
 *  3. an EXTREMITY TRANSLATE — `getTranslateForDecoration()`
 *     (`Kal.java:72-85`), applied in `SvekEdge.java:548-562`'s
 *     `getExtremitySimplier` to BOTH the arrow decoration's centre and the
 *     spline's own start/end point;
 *  4. a DRAWING — `drawU` (`Kal.java:134-144`): a `URectangle(dim)` filled
 *     with the `class.qualified` style's BackGroundColor, stroked at
 *     `UStroke.withThickness(0.5)`, with the text at `UTranslate(2, 1)`;
 *     positioned at `getTextDelta().compose(translate)` (`:146-173`), where
 *     `translate` is the UNTRIMMED spline endpoint
 *     (`SvekEdge.java:1069-1077`'s `computeKal`, reading `dotPathInit` —
 *     the copy taken at `:658`, before `simulateCompound` and before the
 *     extremity trim).
 *
 * cdd2-T12 (Q-7): `Kal#getX1`/`getX2`/`overlapx`/`moveX` and
 * `SvekNode#fixOverlap`/`fixHoverlap` (`svek/SvekNode.java:445-463`),
 * which spread boxes on the SAME UP/DOWN side of one entity apart, are
 * ported in `class-kal-overlap.ts` (`rilali-81-gifu188` puts three DOWN
 * boxes on `top`).
 */

import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import type { Relationship } from './class-relationship-ast.js';
import { dotEdgeRunsReversed } from './class-dot-edge-order.js';

/** `UStroke.withThickness(0.5)` — `Kal.java:142`. */
export const KAL_STROKE_THICKNESS = 0.5;
/** `textBlock.drawU(ug.apply(new UTranslate(2, 1)))` — `Kal.java:143`. */
export const KAL_TEXT_DX = 2;
export const KAL_TEXT_DY = 1;
/** `XDimension2D#delta(4, 2)` — `Kal.java:104`. */
const KAL_PAD_X = 4;
const KAL_PAD_Y = 2;
/** `EntityImageClass.java:113` — `Math.max(width, getKalWidth() * 1.3)`. */
export const KAL_WIDTH_FACTOR = 1.3;

/** `utils/Direction` as `Kal#position` uses it (`Kal.java:106-121`). */
export type KalPosition = 'RIGHT' | 'LEFT' | 'DOWN' | 'UP';

/** One `Kal`, keyed back to the relationship and end it was built for. */
export interface Kal {
  /** `link.getEntity1()`/`getEntity2()` — NOT `rel.from`/`rel.to`; see
   *  {@link computeKals}. */
  entityId: string;
  /** Index into the relationship array `computeKals` was handed. */
  relIndex: number;
  /** 1 for `kal1` (entity1's box), 2 for `kal2` (entity2's). */
  end: 1 | 2;
  text: string;
  /** `dim` — the measured text plus `delta(4, 2)`. */
  width: number;
  height: number;
  /** The measured text width alone (the jar's `textLength`). */
  textWidth: number;
  /** `font.size - measurer.getDescent(font, text)` -- the baseline offset
   *  inside the text block, resolved here (where the `class.qualified`
   *  font lives) so {@link kalBoxAt} needs no measurer at the geometry
   *  seam. Same conversion `class-edge-label-anchor.ts` applies. */
  baselineOffset: number;
  position: KalPosition;
}

/** `svek/Margins.java` — the four shield offsets, merged by `Math.max`. */
export interface KalMargins {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

/** The drawn box, in final diagram coordinates. */
export interface KalBox {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  /** `x + 2` (`Kal.java:143`). */
  textX: number;
  /** The `<text>` BASELINE for `textY = y + 1 + (size - descent)`. */
  textY: number;
  /** `textLength` for the emitted `<text>`. */
  textWidth: number;
  /** cdd2-T12: `Kal#position` (`Kal.java:106-121`), carried so the render
   *  side can rebuild {@link kalTranslateForDecoration} from the box's own
   *  (scaled) `width`/`height` — `Kal#dim` IS the box. */
  position: KalPosition;
}

/**
 * `Kal.java:106-121`. `link.getLength() == 1` reaches this port as
 * `rel.length === 1` (`class-dot-edges.ts` emits `minlen = length - 1`,
 * and `mucoti-34-seve858`'s cached `svek-1.dot` carries `minlen=0` for its
 * single-`-` link).
 */
function positionOf(end: 1 | 2, length: number): KalPosition {
  if (length === 1) return end === 1 ? 'RIGHT' : 'LEFT';
  return end === 1 ? 'DOWN' : 'UP';
}

/**
 * `Kal.java:106-121`'s `entity.ensureMargins(new Margins(x1, x2, y1, y2))`,
 * one per position.
 */
export function kalMargins(kal: Kal): KalMargins {
  switch (kal.position) {
    case 'RIGHT':
      return { x1: 0, x2: kal.width, y1: 0, y2: 0 };
    case 'LEFT':
      return { x1: kal.width, x2: 0, y1: 0, y2: 0 };
    case 'DOWN':
      return { x1: 0, x2: 0, y1: 0, y2: kal.height };
    case 'UP':
      return { x1: 0, x2: 0, y1: kal.height, y2: 0 };
  }
}

/** `Kal#getTranslateForDecoration` (`Kal.java:72-85`). cdd2-T12: takes
 *  anything carrying `position` + `dim` (a {@link Kal} or its drawn
 *  {@link KalBox}), since upstream reads only those two fields. */
export function kalTranslateForDecoration(kal: Pick<Kal, 'position' | 'width' | 'height'>): {
  dx: number;
  dy: number;
} {
  switch (kal.position) {
    case 'RIGHT':
      return { dx: kal.width, dy: 0 };
    case 'LEFT':
      return { dx: -kal.width, dy: 0 };
    case 'DOWN':
      return { dx: 0, dy: kal.height };
    case 'UP':
      return { dx: 0, dy: -kal.height };
  }
}

/** `Kal#getTextDelta` (`Kal.java:159-173`) — including the two `+ 0.5`
 *  nudges upstream applies on the LEFT/UP arms only. */
export function kalTextDelta(kal: Kal): { dx: number; dy: number } {
  switch (kal.position) {
    case 'RIGHT':
      return { dx: 0, dy: -kal.height / 2 };
    case 'LEFT':
      return { dx: -kal.width + 0.5, dy: -kal.height / 2 };
    case 'DOWN':
      return { dx: -kal.width / 2, dy: 0 };
    case 'UP':
      return { dx: -kal.width / 2, dy: -kal.height + 0.5 };
  }
}

/**
 * `SvekEdge.java:242-246` — one `Kal` per non-empty qualifier, in link
 * order, `kal1` before `kal2`.
 *
 * `kal1` belongs to `link.getEntity1()`, which is `rel.to` (not `rel.from`)
 * whenever the parser normalised the endpoints against the arrowhead —
 * `dotEdgeRunsReversed` is exactly that flag (`class-dot-edge-order.ts`).
 * `fromQualifier`/`toQualifier` are swapped by the SAME `swapDirection`
 * that produced `from`/`to` (`class-relationship-parser.ts#sidedRelFields`),
 * so the qualifier always travels with its own endpoint and the pairing
 * below needs no second adjustment.
 *
 * `font` is the `class.qualified` style's font configuration
 * (`Kal.java:99`), which inherits the class font when no `<style>` sets
 * one — `camuna-58-veca254`'s `qualified { BackgroundColor / FontColor }`
 * block sets no size, and its jar `<text>` renders at `font-size="14"`.
 */
export function computeKals(relationships: readonly Relationship[], font: FontSpec, measurer: StringMeasurer): Kal[] {
  const kals: Kal[] = [];
  relationships.forEach((rel, relIndex) => {
    const reversed = dotEdgeRunsReversed(rel);
    const entity1 = reversed ? rel.to : rel.from;
    const entity2 = reversed ? rel.from : rel.to;
    const kal1 = reversed ? rel.toQualifier : rel.fromQualifier;
    const kal2 = reversed ? rel.fromQualifier : rel.toQualifier;
    const length = rel.length ?? 2;
    for (const [end, entityId, text] of [
      [1, entity1, kal1],
      [2, entity2, kal2],
    ] as const) {
      // `Link#hasKal1`/`hasKal2` (`abel/Link.java:569-575`) treat an empty
      // string as absent; `SvekEdge.java:242` only checks `!= null`, but
      // the grammar cannot produce an empty bracket (`([^\[\]]+)`).
      if (text === undefined || text === '') continue;
      const m = measurer.measure(text, font);
      kals.push({
        entityId,
        relIndex,
        end,
        text,
        textWidth: m.width,
        baselineOffset: font.size - measurer.getDescent(font, text),
        width: m.width + KAL_PAD_X,
        height: font.size + KAL_PAD_Y,
        position: positionOf(end, length),
      });
    }
  });
  return kals;
}

/** `Margins#merge` (`svek/Margins.java:56-62`) — componentwise `max`, the
 *  accumulation `Entity#ensureMargins` performs (`abel/Entity.java:288-291`). */
export function kalMarginsByEntity(kals: readonly Kal[]): Map<string, KalMargins> {
  const out = new Map<string, KalMargins>();
  for (const kal of kals) {
    const m = kalMargins(kal);
    const prev = out.get(kal.entityId);
    if (prev === undefined) out.set(kal.entityId, m);
    else {
      out.set(kal.entityId, {
        x1: Math.max(prev.x1, m.x1),
        x2: Math.max(prev.x2, m.x2),
        y1: Math.max(prev.y1, m.y1),
        y2: Math.max(prev.y2, m.y2),
      });
    }
  }
  return out;
}

/** `EntityImageClass#getKalWidth` (`EntityImageClass.java:117-127`) —
 *  `max(sum of UP widths, sum of DOWN widths)`; LEFT/RIGHT boxes never
 *  widen their entity. */
export function kalWidthByEntity(kals: readonly Kal[]): Map<string, number> {
  const sums = new Map<string, { UP: number; DOWN: number }>();
  for (const kal of kals) {
    if (kal.position !== 'UP' && kal.position !== 'DOWN') continue;
    const entry = sums.get(kal.entityId) ?? { UP: 0, DOWN: 0 };
    entry[kal.position] += kal.width;
    sums.set(kal.entityId, entry);
  }
  return new Map([...sums].map(([id, e]) => [id, Math.max(e.UP, e.DOWN)]));
}

/**
 * `Kal#drawU` (`Kal.java:134-144`) placed at `getTranslate()` — the
 * untrimmed spline endpoint plus {@link kalTextDelta}.
 *
 * `anchor` is `dotPathInit.getStartPoint()`/`getEndPoint()` in final
 * coordinates, i.e. this port's normalised edge points BEFORE the
 * cluster clip and BEFORE the extremity trim.
 */
export function kalBoxAt(kal: Kal, anchor: { x: number; y: number }): KalBox {
  const delta = kalTextDelta(kal);
  const x = anchor.x + delta.dx;
  const y = anchor.y + delta.dy;
  return {
    x,
    y,
    width: kal.width,
    height: kal.height,
    text: kal.text,
    textX: x + KAL_TEXT_DX,
    textY: y + KAL_TEXT_DY + kal.baselineOffset,
    textWidth: kal.textWidth,
    position: kal.position,
  };
}
