/**
 * The `scale …` directive for the sequence engine, applied at the
 * layout→render boundary — mirrors `json/scale-geo.ts` exactly (same
 * rationale, same "why scaling inputs equals scaling outputs" argument);
 * see that file's header for the full derivation. This header states only
 * what is specific to the sequence engine.
 *
 * ## Why here, and why it is the same thing upstream does
 *
 * Upstream applies scale in exactly one place: `SvgGraphics#format`
 * (`klimt/drawing/svg/SvgGraphics.java:466-473`) multiplies EVERY emitted
 * numeric by `option.getScale()` on its way to text — coordinates, font
 * sizes (`:693`), stroke widths (`:555`), and dash-pattern lengths alike
 * (`setStrokeWidth`, `:559`: `"" + format(strokeDasharray[0]) + "," +
 * format(strokeDasharray[1])`). Jar-verified against three `Bob -> Alice:
 * hi` variants rendered through the pinned jar (unscaled / `scale 2` /
 * `scale 3`): root `width`/`height` and every `font-size` are exactly 2x/3x,
 * and no `<g transform="scale(...)">` wrapper is ever emitted — the ONLY
 * upstream use of a `transform="scale(...)"` is `manageScale`
 * (`SvgGraphics.java:1035-1051`), for embedded `UImageSvg` sprites, never
 * the document itself.
 *
 * This engine renders through the same direct `core/svg*.ts` string
 * emitters as the json family (not klimt's `SvgGraphicsCore`, which already
 * carries a faithful scale-applying `format`), whose shared formatter is
 * scale-free by design (ADR-3, `svg-format.ts`). So, as with json, there is
 * no single `format` seam to multiply through, and scaling the INPUTS is
 * the same operation as scaling upstream's outputs (`format(x·k)` either
 * way), because every derived value the renderer computes from geometry is
 * linear in its inputs.
 *
 * ## Exhaustiveness — the part json's renderer does not need
 *
 * Unlike the json renderer, this engine's `renderer.ts`/
 * `renderer-arrowhead.ts` carry their OWN local pixel-literal constants
 * (actor head radius, self-loop dimensions, frame tab size, arrow head
 * geometry, …) that were never captured in `SequenceGeometry` at all — they
 * are computed at render time from an already-positioned point. Because
 * upstream's `format()` intercepts every numeric regardless of where it
 * originated (a computed coordinate or a hardcoded pixel constant), those
 * local constants must ALSO be scaled, or they emit at 1x beside geometry
 * at k and read as a layout bug. `SequenceGeometry`, `Theme.fontSize`, and
 * `HeadGeometry` (the arrowhead module's tip-local shape vocabulary,
 * `sequence-arrowhead.ts`) are scaled HERE, as pure data; renderer.ts and
 * renderer-arrowhead.ts scale their own remaining literals in place, at the
 * point where each one is combined with already-scaled geometry (see the
 * `scaleK`/`k` parameters threaded through those two files).
 *
 * `HeadGeometry` deserves its own note: `headGeometryNormalSide` /
 * `headGeometryReverseSide` / `headGeometrySelf` (`sequence-arrowhead.ts`)
 * are PURE functions of upstream pixel constants only (`ARROW_DELTA_X`,
 * `DIAM_CIRCLE`, `THIN_CIRCLE`, `SPACE_CROSS_X`, …) — no scaled coordinate
 * ever reaches them. A function built ONLY from linear combinations of
 * constants is homogeneous of degree 1 in those constants, so scaling its
 * RETURN VALUE by `k` is arithmetically identical to scaling every constant
 * inside it by `k` first and re-running the function — `f(c₁·k, c₂·k, …) =
 * k·f(c₁, c₂, …)` for the additions/subtractions/scalar-multiplies those
 * builders use (no `min`/`max`/rounding breaks that identity here). That
 * lets `scaleHeadGeometry` scale the OUTPUT once, leaving
 * `sequence-arrowhead.ts` itself untouched — exactly the same move
 * `scaleAtom`/`scaleRow`/`scaleNode`/`scaleEdge` make below for the json
 * family's own small geometry structs.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java#format
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java#setStrokeWidth (:559, dash-pattern scaling)
 * @see src/diagrams/json/scale-geo.ts
 */

import type {
  BoxGeo,
  SequenceGeometry,
  ParticipantGeo,
  EventGeo,
  MessageGeo,
  NoteGeo,
  ActivationGeo,
  FrameGeo,
  DividerGeo,
  SpaceGeo,
  TextRun,
} from './ast.js';
import type { Theme } from '../../core/theme.js';
import type {
  ArrowCircle,
  ArrowSegment,
  HeadGeometry,
} from './sequence-arrowhead.js';
import type { Point2D } from '../../core/klimt/UTranslate.js';
import { fmt } from '../../core/svg-format.js';

/** A scale of exactly 1 must be a no-op, not a rebuild — see
 *  {@link scaleSequenceGeometry}/{@link scaleHeadGeometry}. */
const IDENTITY = 1;

// ---------------------------------------------------------------------------
// SequenceGeometry
// ---------------------------------------------------------------------------

function scaleParticipant(p: ParticipantGeo, k: number): ParticipantGeo {
  return {
    ...p,
    x: p.x * k,
    y: p.y * k,
    width: p.width * k,
    height: p.height * k,
    centerX: p.centerX * k,
    ...(p.badge !== undefined
      ? { badge: { ...p.badge, width: p.badge.width * k, height: p.badge.height * k } }
      : {}),
  };
}

function scaleBox(b: BoxGeo, k: number): BoxGeo {
  return { ...b, x: b.x * k, y: b.y * k, width: b.width * k, height: b.height * k };
}

const scaleRun = (r: TextRun, k: number): TextRun => ({ ...r, x: r.x * k, y: r.y * k });

/**
 * A message's geometry, scaled. Covers exo messages too: they emit a
 * `MessageGeo` whose `exoType`/`shortArrow`/`arrow` are drawing DATA, not
 * coordinates, so the border-anchored `fromX`/`toX` scale by `k` exactly as
 * a between-lifelines message's do and nothing else needs touching.
 */
function scaleMessage(m: MessageGeo, k: number): MessageGeo {
  return {
    ...m,
    fromX: m.fromX * k,
    toX: m.toX * k,
    y: m.y * k,
    labelLines: m.labelLines.map((r) => scaleRun(r, k)),
    ...(m.labelNumber !== undefined ? { labelNumber: scaleRun(m.labelNumber, k) } : {}),
  };
}

function scaleNote(n: NoteGeo, k: number): NoteGeo {
  return { ...n, x: n.x * k, y: n.y * k, width: n.width * k, height: n.height * k };
}

function scaleActivation(a: ActivationGeo, k: number): ActivationGeo {
  return { ...a, lifelineX: a.lifelineX * k, y: a.y * k, height: a.height * k };
}

/**
 * A frame's geometry, scaled. `backColorElement`/`backColorGeneral` and each
 * separator's `backColorGeneral` are RAW colour tokens (`ast.ts`'s "stored
 * verbatim, interpreted late") and `tabText`/`tabComment` are DATA, not
 * geometry — all five pass through unchanged, same rule as `label` below.
 * `tabWidth`/`tabHeight`/`tabTextWidth` are lengths and scale like the rest.
 */
function scaleFrame(f: FrameGeo, k: number): FrameGeo {
  return {
    ...f,
    x: f.x * k,
    y: f.y * k,
    width: f.width * k,
    height: f.height * k,
    branchSeparators: f.branchSeparators.map((s) => ({ ...s, y: s.y * k })),
    refBody: f.refBody.map((b) => ({ ...b, x: b.x * k })),
    tabTextWidth: f.tabTextWidth * k,
    tabWidth: f.tabWidth * k,
    tabHeight: f.tabHeight * k,
  };
}

function scaleDivider(d: DividerGeo, k: number): DividerGeo {
  return { ...d, y: d.y * k, totalWidth: d.totalWidth * k };
}

function scaleSpace(s: SpaceGeo, k: number): SpaceGeo {
  return { ...s, y: s.y * k, height: s.height * k };
}

/** One `EventGeo`, scaled by its `kind`. Every member of the union carries
 *  its own positional numerics (see `ast.ts:299-305`); `sequenceNumber`/
 *  `label`/`text` etc. are DATA, not geometry, and are left untouched. */
function scaleEvent(event: EventGeo, k: number): EventGeo {
  switch (event.kind) {
    case 'message':
      return scaleMessage(event, k);
    case 'note':
      return scaleNote(event, k);
    case 'activation':
      return scaleActivation(event, k);
    case 'frame':
      return scaleFrame(event, k);
    case 'divider':
      return scaleDivider(event, k);
    case 'space':
      return scaleSpace(event, k);
  }
}

/**
 * Every geometric number in the diagram, multiplied by `k`.
 *
 * Returns the input unchanged when `k` is 1 so the overwhelmingly common
 * unscaled case allocates nothing and cannot be perturbed by a rounding
 * artefact of multiplying by one.
 */
export function scaleSequenceGeometry(geo: SequenceGeometry, k: number): SequenceGeometry {
  if (k === IDENTITY) return geo;
  return {
    ...geo,
    totalWidth: geo.totalWidth * k,
    totalHeight: geo.totalHeight * k,
    lifelineEndY: geo.lifelineEndY * k,
    footerShapeY: geo.footerShapeY * k,
    participants: geo.participants.map((p) => scaleParticipant(p, k)),
    events: geo.events.map((e) => scaleEvent(e, k)),
    boxes: geo.boxes.map((b) => scaleBox(b, k)),
  };
}

// ---------------------------------------------------------------------------
// Theme — only the numeric this engine's renderer actually reads
// ---------------------------------------------------------------------------

/**
 * `Theme` plus the resolved render-time scale factor. `renderer.ts` and
 * `renderer-arrowhead.ts` thread this in place of a bare `Theme` wherever a
 * function needs to scale a LOCAL pixel-literal constant of its own (see
 * this module's header) — reusing the existing `theme` parameter slot keeps
 * every such function at its pre-existing parameter count.
 */
export interface ScaledTheme extends Theme {
  readonly scaleK: number;
}

/**
 * `theme.fontSize` is the only `Theme` numeric this engine's renderer
 * reads (`renderer.ts`/`renderer-arrowhead.ts` — confirmed by grep; the
 * `theme.sequence.*` layout knobs are consumed by `layout.ts`, BEFORE this
 * scale multiply, and are already baked into the geometry `scaleSequenceGeometry`
 * scales above, so they are not re-scaled here). Mirrors `json/scale-geo.ts`'s
 * `scaleNodeStyle`: applied to the RESOLVED theme, matching upstream's
 * single `format(fontSize)` call (`SvgGraphics.java:693`).
 */
export function scaleSequenceTheme(theme: Theme, k: number): ScaledTheme {
  return { ...theme, fontSize: theme.fontSize * k, scaleK: k };
}

// ---------------------------------------------------------------------------
// Arrowhead shape vocabulary (sequence-arrowhead.ts's HeadGeometry)
// ---------------------------------------------------------------------------

function scalePoint(p: Point2D, k: number): Point2D {
  return { x: p.x * k, y: p.y * k };
}

function scaleSegment(s: ArrowSegment, k: number): ArrowSegment {
  return [scalePoint(s[0], k), scalePoint(s[1], k)];
}

function scaleCircle(c: ArrowCircle, k: number): ArrowCircle {
  return { cx: c.cx * k, cy: c.cy * k, d: c.d * k, thickness: c.thickness * k };
}

/**
 * Scales a `HeadGeometry`'s tip-local points/segments/circle by `k`. Safe to
 * apply to `sequence-arrowhead.ts`'s output as-is — see this module's header
 * for why that is arithmetically identical to scaling that module's own
 * constants.
 */
export function scaleHeadGeometry(head: HeadGeometry, k: number): HeadGeometry {
  if (k === IDENTITY) return head;
  return {
    ...(head.polygon === undefined ? {} : { polygon: head.polygon.map((p) => scalePoint(p, k)) }),
    ...(head.lines === undefined ? {} : { lines: head.lines.map((s) => scaleSegment(s, k)) }),
    ...(head.circle === undefined ? {} : { circle: scaleCircle(head.circle, k) }),
  };
}

// ---------------------------------------------------------------------------
// Shared dash pattern
// ---------------------------------------------------------------------------

/** The `5,5` dash unit this engine's lifelines/frames/branch-separators/
 *  self-messages all dash with, pre-scaling. */
const DASH_UNIT = 5;

/**
 * The scaled, formatted `"N,N"` dash pattern — built and formatted TOGETHER
 * (not as two independently-`fmt`'d numbers) because upstream builds it as
 * one string, from `format()`, at `setStrokeWidth` time.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java:559
 */
export function scaledDashPattern(k: number): string {
  const unit = fmt(DASH_UNIT * k);
  return `${unit},${unit}`;
}
