/**
 * layout-ink-extent.ts — mission G4 S1, mechanism 4 ("document-margin /
 * ink-extent computation gap"): the `SvekResult`/`TextBlockExporter`
 * document-dimension recipe (svek/SvekResult.java:126-133, core/
 * TextBlockExporter.java:200-202,751-753), ported for STATE's own
 * pure-string layout — mirrors `class/layout-ink-extent.ts` (G2 N5's own
 * identical mechanism, shared `CucaDiagram`/`SvekResult` base-class recipe)
 * but with STATE's own per-shape ink rules.
 *
 * Margin constants (`CucaDiagram#getDefaultMargins()`, `.delta(15,15)`,
 * `JAR_INK_MARGIN=6`, `SvgGraphics#ensureVisible`'s truncating `+1`) are
 * IDENTICAL to class's own — `net/atmp/CucaDiagram.java` is shared base
 * machinery for the whole `CucaDiagram` family, grep-verified no
 * `StateDiagram`-local override exists.
 *
 * STATE-SPECIFIC ink rule (jar-verified via 3 independent zero-transition,
 * zero-composite samples — `jocela-05-niba392`, `votoki-67-gufa610`,
 * `gupeto-19-mesa256`, all `svg/@width`+`svg/@height` byte-exact): a
 * `normal`/`json` leaf state's rendered box (rounded rect + horizontal
 * divider line + name text, `renderer.ts#renderNormal`) does NOT follow
 * class's own `addRectInk` rule (`[x-1,x+w] × [y-1,y+h]`) — instead the ink
 * box is `[x-1, x+w] × [y-1, y+h-1]`: the divider `<line>` (upstream
 * `ULine`, `LimitFinder#drawULine` — plain, UNINSET ink) spans the box's
 * FULL uninset width (`x1=x` to `x2=x+w`, confirmed against `jocela-05-
 * niba392`'s own `<line x1="7" y1="31" x2="65.0625" y2="31"/>`, `x2` ==
 * the rect's own `x+width` exactly) and so DOMINATES the rect's own
 * `-1`-inset right edge on WIDTH — but the line's `y` sits well INSIDE the
 * box's own span, never dominating the rect's own `y+h-1` on HEIGHT. Net:
 * max-X uninset (`x+w`), max-Y classic-inset (`y+h-1`) — asymmetric per
 * AXIS, not per CORNER as in class. Verified robust across a plain, a
 * multi-line, and a `<math>`(KaTeX)-body fixture.
 *
 * NOT jar-verified this iteration (documented simplification, not silently
 * dropped — see individual ink-rule functions below for the specific
 * upstream `LimitFinder` dispatch each one reproduces):
 *   - `composite` states (dashed outer box, NO divider line —
 *     `renderer.ts#renderComposite`): reuses the SAME leaf-box rule as a
 *     best-effort default, NOT independently confirmed against a jar
 *     sample (sampled composite fixtures carry children/edges whose own
 *     ink masks any 1px composite-box residual — S1 ledger). Mission G4 S4:
 *     ALSO reused (via {@link computeSvekResultGeometry}) for a wrapped
 *     composite child pass's OWN ink extent — jar-verified correct there
 *     (S4 ledger); mission T9's own mechanism-8 paragraph below is the one
 *     confirmed gap in this reuse (a background-transparency-gated term).
 *   - `fork`/`join`/`syncBar` (plain bar `URectangle`, no divider line):
 *     the classic symmetric `LimitFinder#drawRectangle` rule (`[x-1,x+w-1]
 *     × [y-1,y+h-1]`) — the REAL upstream rule for a bare `URectangle` with
 *     no additional `UEmpty`/`ULine` ink contribution, ported directly from
 *     `core/klimt/drawing/LimitFinder.ts#drawRectangle`, not guessed.
 *   - `initial`/`final`/`history`/`deepHistory` (ellipse-based): the REAL
 *     `LimitFinder#drawEllipse` rule (`[x,y] × [x+w-1,y+h-1]`, NO `-1` on
 *     the min corner — ported directly from `LimitFinder.ts#drawEllipse`).
 *     History/deepHistory's own "H"/"H*" label text ink is NOT modeled
 *     (small, centered inside the ellipse — same "usually dominated by the
 *     shape's own ink reach" simplification `class/layout-ink-extent.ts`'s
 *     own file doc comment documents for edge-label/row text in general).
 *   - `choice` (diamond `UPolygon`): the REAL `LimitFinder#drawUPolygon`
 *     rule (`HACK_X_FOR_POLYGON=10`-padded x, unpadded y — ported directly
 *     from `LimitFinder.ts#drawUPolygon`, the SAME constant class's own
 *     `addFolderPolygonInk`/`renderer-arrowhead.ts#edgeExtremityInk` reuse).
 *
 * Mission G4 S4 (mechanism 7) excluded ALL arrowhead ink from a composite's
 * childImg pass over a suspected `transitionArrowheadInk` over-reach.
 * Mission state-declared-size-fix T9 (SI28 T2's `findings/composite-b.md`)
 * found the over-reach real but NOT self-loop-specific: unioning arrowhead
 * ink unconditionally closes `pebepi-32-cati486`/`taxile-56-goca422`/
 * `tigibi-80-zidi137` (self-loops) to float-noise precision, but GROWS
 * `fovafu-44-mifu394` (`A-->Y`) and `kejabo-83-vinu490` (`Idle-->
 * Configuring`) — plain transitions (full-corpus `harness-diff.py`
 * evidence). {@link addTransitionInk}'s `arrowheadInk` param narrows the
 * fold to `from===to` for a composite pass, matching what T2 jar-verified,
 * while the document-level functions keep the pre-existing unconditional
 * fold.
 *
 * Mechanism 8 (the composite south cap) was diagnosed by T9 and deferred:
 * an UNCONDITIONAL +1 regressed 9 exact, default-styled fixtures
 * (`kenuci-20-cane702`/`nelupe-49-xova546`/`sizife-41-buje191`/`lasasi-13-
 * nona547`/`lonuti-97-voko521`/`sapelo-46-jafe280`/`soxene-95-domu248`/
 * `pexiku-77-japi217`/`nivanu-50-zajo916`; `lasasi-13`/`soxene-95` set
 * `RoundCorner` alone and still regressed, ruling THAT out as the gate).
 * SI31 T4 landed it gated ({@link addSouthCapInk} + `state-composite-pass
 * .ts#resolvesSouthCapInk`, keeping this module theme-free), closing the five
 * G5 fixtures (SI28 T1/T2's `findings/composite-{a,b}.md`), those 9 flat.
 *
 * @see plans/g4-state-svg/ledger.md (S1, mechanism 4; S4, mechanism 7)
 * @see class/layout-ink-extent.ts (the class-engine precedent this mirrors)
 */
import type { StateNodeGeo, TransitionGeo } from './state-geo-types.js';
import { svekDimension, svekInkShift } from '../../core/svek/SvekResult.js';
import { applyCucaDocumentMargin } from '../../core/TextBlockExporter.js';
import {
  type InkBox,
  newInkBox,
  addPoint,
  addTransitionInk,
} from './layout-ink-transition.js';
import { positionFromStereotype, usesPortShape } from './state-entity-position.js';
import { textAscent } from './state-render-colors.js';

/** `CucaDiagram#getDefaultMargins()` (net/atmp/CucaDiagram.java:719-722) —
 *  shared across the whole `CucaDiagram` family, see module doc comment. */
// `CucaDiagram#getDefaultMargins()` — single owner at
// `core/atmp/CucaDiagram.ts`. Aliased to the local names so the call
// sites below read unchanged.

// Both from the single owner, `core/svek/SvekResult.ts`. They were declared
// locally here until 2026-08-15; the comment that stood in this place cited
// "class's own `layout-ink-extent.ts#JAR_INK_MARGIN`", a file that does not
// exist (class's copy was in `class-ink-box.ts`) — the drift that four
// declarations of two constants predicts.

/** `LimitFinder#drawUPolygon`'s own `x`-only padding quirk
 *  (`HACK_X_FOR_POLYGON = 10` upstream) — duplicated here rather than
 *  imported, per `class/layout-ink-extent.ts`'s own established
 *  klimt-free-module convention. */
const HACK_X_FOR_POLYGON = 10;

/** Leaf `normal`/`json` state box + composite (best-effort) — see module
 *  doc comment for the jar-verified asymmetric-per-axis mechanism.
 *
 *  mission skin-file-loading Batch 2 (D3's rendering half): `shadow` (the
 *  node's own resolved `theme.shadowing`, `StateNodeGeo.shadowing`'s own
 *  doc comment; `0` for every pre-Batch-2 fixture) folds jar's real
 *  `LimitFinder#drawRectangle` shadow term (`addPoint(x-1,y-1);
 *  addPoint(x+w-1+2*shadow, y+h-1+2*shadow)`, `~/git/plantuml/.../klimt/
 *  drawing/LimitFinder.java:184-188`) into this rule's own max corner via
 *  `Math.max` against the pre-existing unshadowed divider-line point
 *  (`x+w`/`y+h-1`) — NOT a replacement of it: jar's `LimitFinder` walks
 *  EVERY shape a box draws (the shadowed outline rect AND the unshadowed
 *  divider `<line>`), so the real max corner is whichever shape's own ink
 *  reaches furthest, and for `shadow=0` the rect's own `x+w-1`/`y+h-1`
 *  never exceeds the line's `x+w`/rect's own `y+h-1` (verified: `Math.max`
 *  degenerates to this function's pre-Batch-2 return value exactly when
 *  `shadow=0`, so every shadow-off fixture is byte-identical). For
 *  `shadow>0` the rect's shadow-widened corner dominates on BOTH axes
 *  (`x+w-1+2*shadow > x+w` once `shadow>=1`; `y+h-1+2*shadow` always
 *  exceeds the line's un-widened `y+h-1`) — jar-verified mechanism (not the
 *  numeric value) via `RoundedContainer.java`/`EntityImageStateCommon
 *  .java#getShape`, both of which set `deltaShadow` on the SAME outline
 *  rect this function's own unshadowed half already models. */
function addStateBoxInk(box: InkBox, node: StateNodeGeo, hasDivider: boolean): void {
  const { x, y, width: w, height: h } = node;
  const shadow = node.shadowing ?? 0;
  addPoint(box, x - 1, y - 1);
  // mission tail-1px: the uninset `x + w` max-X above is the DIVIDER LINE's
  // own ink (`LimitFinder#drawULine` — `addPoint(x + dx, y + dy)`, no `-1`),
  // NOT the rect's. A box that draws no divider contributes only the rect's
  // own `LimitFinder#drawRectangle` corner (`x + w - 1`). Jar-verified both
  // ways: `jocela-05-niba392` (divider present, `<line x2="65.0625">` ==
  // rect `x+w` exactly) needs `x + w`; `bilare-19-fufe539` (`hide empty
  // description` => `EntityImageStateEmptyDescription.drawU` draws "rect
  // ONLY, no divider", ZERO `<line>` elements in the jar's own SVG) needs
  // `x + w - 1` and yields the jar's own document width 361 exactly.
  addPoint(box, hasDivider ? x + w : x + w - 1, y + h - 1);
  if (shadow > 0) {
    addPoint(box, x + w - 1 + 2 * shadow, y + h - 1 + 2 * shadow);
  }
}

/** Does this leaf box's renderer actually draw the horizontal divider line
 *  whose ink {@link addStateBoxInk}'s uninset max-X models? Mirrors
 *  `renderer-box.ts#renderNormal`'s OWN two early-return branches exactly —
 *  `headerLines === undefined` (unmeasured fallback: box + centred text) and
 *  `emptyDescription === true` (`renderEmptyDescription`: box + header only)
 *  both return before the `line(...)` call. Keeping the predicate identical
 *  to the renderer's is the point: sizer and renderer must agree on which
 *  shapes exist. */
function rendersDivider(node: StateNodeGeo): boolean {
  return node.headerLines !== undefined && node.emptyDescription !== true;
}

/** `fork`/`join`/`syncBar` bar — `LimitFinder#drawRectangle`'s real rule,
 *  no additional divider-line/UEmpty ink contribution. */
function addBarInk(box: InkBox, x: number, y: number, w: number, h: number): void {
  addPoint(box, x - 1, y - 1);
  addPoint(box, x + w - 1, y + h - 1);
}

/** `initial`/`final`/`history`/`deepHistory` ellipse (`cx,cy,r,r` render
 *  call shape) — `LimitFinder#drawEllipse`'s real rule (NO `-1` on the min
 *  corner). */
function addEllipseInk(box: InkBox, cx: number, cy: number, r: number): void {
  const x = cx - r;
  const y = cy - r;
  const w = 2 * r;
  const h = 2 * r;
  addPoint(box, x, y);
  addPoint(box, x + w - 1, y + h - 1);
}

/**
 * `LimitFinder#drawText` (`klimt/drawing/LimitFinder.java:217-225`): a
 * `UText`'s ink is NOT its layout box. Given the BASELINE `y` it is drawn at,
 * `LimitFinder` records `[y - (height - 1.5), y + 1.5]` — so the ink reaches
 * `height - 1.5` above the baseline and only `1.5` below it, where a text
 * block's own box spans `[y - ascent, y - ascent + height]`.
 *
 * At 14pt those differ by `1.611` at BOTH edges (`fontSize/4.5 - 1.5`), which
 * is exactly the rigid offset eight border-point fixtures carried — jar's
 * whole drawing sat 1.611px lower than ours because its canvas reserved that
 * much more above the topmost label.
 *
 * Only the border-point label needs this: every other text in a state diagram
 * sits inside a shape whose own ink already dominates it, which is why no
 * other case in this module models text at all.
 */
const TEXT_INK_BASELINE_DROP = 1.5;

/**
 * G9/T7: a BORDER POINT's own ink — the `RADIUS*2` symbol plus the name label
 * `EntityImageStateBorder#drawU` (`:79-89`) draws OUTSIDE it, above or below.
 *
 * The label is what makes this its own rule: every other leaf's text sits
 * INSIDE the shape whose ink already dominates it, so no other case here adds
 * a text contribution. `LimitFinder` walks what `drawU` actually draws, and
 * `drawU` draws both — which is why jar's canvas has room above the topmost
 * border point and this port's did not (`lulozu-10-bopu547`: 136 against our
 * 109, the difference being exactly one `2*RADIUS + descHeight` band).
 *
 * The symbol takes the ellipse rule for ENTRY_POINT/EXIT_POINT and the
 * rectangle rule otherwise, matching what `renderer-border-point.ts` draws;
 * the label takes the uninset text-block rule (`LimitFinder`'s own text walk,
 * the same one `addNoteInk` documents for a path).
 */
function addBorderPointInk(box: InkBox, node: StateNodeGeo): void {
  const r = node.width / 2;
  if (usesPortShape(positionFromStereotype(node.stereotype))) {
    addEllipseInk(box, node.x + r, node.y + r, r);
  } else {
    addBarInk(box, node.x, node.y, node.width, node.height);
  }
  const lines = node.headerLines ?? [];
  const labelHeight = node.borderPointLabelHeight;
  if (lines.length === 0 || labelHeight === undefined) return;
  const labelWidth = Math.max(...lines.map((ln) => ln.width));
  const top = node.borderPointLabelAbove === true ? node.y - node.height - labelHeight : node.y + node.height;
  // One `UText` per line, each contributing `LimitFinder#drawText`'s own box
  // (see {@link TEXT_INK_BASELINE_DROP}). `labelHeight` is `lines * fontSize`
  // by construction (`state-sizing.ts#buildStateGeoTextFields`), so the
  // division recovers the per-line height `calculateDimension` reports.
  const lineHeight = labelHeight / lines.length;
  const firstBaseline = top + textAscent(lineHeight);
  const lastBaseline = firstBaseline + (lines.length - 1) * lineHeight;
  addPoint(box, node.x - (labelWidth - node.width) / 2, firstBaseline - lineHeight + TEXT_INK_BASELINE_DROP);
  addPoint(box, node.x + (labelWidth + node.width) / 2, lastBaseline + TEXT_INK_BASELINE_DROP);
}

/** `choice` diamond (`core/svg.ts#diamond`'s own 4-point layout) —
 *  `LimitFinder#drawUPolygon`'s real rule (x padded by `HACK_X_FOR_POLYGON`
 *  on both sides, y unpadded). */
function addDiamondInk(box: InkBox, cx: number, cy: number, size: number): void {
  addPoint(box, cx - size - HACK_X_FOR_POLYGON, cy - size);
  addPoint(box, cx + size + HACK_X_FOR_POLYGON, cy + size);
}

/** mission G4 S10: a note's own `<path>`-based folded-corner/opale-notch
 *  outline (`renderer-note.ts`) — `LimitFinder`'s generic path-vertex walk
 *  for a `UPath`/`Opale` shape reports its own bounding box with NO
 *  systematic inset on EITHER corner (unlike a `URectangle`'s own `-1`
 *  stroke-half-width heuristic, {@link addStateBoxInk}) — jar-verified
 *  against `labono-83-nega255`'s own document canvas: combining the
 *  note's UNINSET `[x,y]..[x+w,y+h]` box with `foo`'s own `addStateBoxInk`
 *  contribution reproduces the fixture's real `236x71` canvas exactly
 *  (`plans/g4-state-svg/ledger.md` S10 has the full arithmetic). */
function addNoteInk(box: InkBox, x: number, y: number, w: number, h: number): void {
  addPoint(box, x, y);
  addPoint(box, x + w, y + h);
}

/** SI31 T4 (G5, mechanism 8): the composite south cap's own uninset ink.
 *  The cap is a SEPARATE shape reaching the container's FULL `y + height`
 *  (`~/git/plantuml/.../svek/RoundedContainer.java:89-91`) and, on
 *  `RoundedSouth.drawU`'s `rounded != 0` branch, a `UPath` — so
 *  `LimitFinder#drawUPath` folds it with ZERO inset (`.../klimt/drawing/
 *  LimitFinder.java:164-167`), exactly 1 px past the outline `URectangle`'s
 *  `y + height - 1` from `#drawRectangle` (`LimitFinder.java:184-188`). That
 *  difference IS this term — no constant. X already reaches `x + width` via
 *  the composite branch's own `addStateBoxInk`. Gate and full derivation:
 *  `StateNodeGeo.southCapInk` (state-geo-types.ts). */
function addSouthCapInk(box: InkBox, node: StateNodeGeo): void {
  if (node.southCapInk !== true) return;
  addPoint(box, node.x + node.width, node.y + node.height);
}

/** One node's own ink contribution (recurses into composite children AND
 *  this node's own nested `.transitions` — `state-composite-geo.ts`
 *  already positions both in the SAME absolute coordinate space
 *  `StateGeometry.states` uses, no re-basing needed here. Mission G4 S5:
 *  a composite node's own pass edges live on `node.transitions` now (the
 *  transition-nesting mechanism), not a separate flat array threaded in by
 *  the caller — walking them here keeps every ink-box call site's own
 *  signature unchanged while still covering the SAME ink this recursion
 *  covered before the restructuring (previously via a flat
 *  `outTransitions` accumulator merged into the top-level `transitions`
 *  array by the caller). */
function addNodeInk(
  box: InkBox,
  node: StateNodeGeo,
  labelInk: boolean,
  arrowheadInk: 'always' | 'self-loop',
): void {
  if (node.children.length > 0) {
    // A composite's own outer box draws no divider line, but this call is
    // deliberately left at the pre-existing `hasDivider: true` ink: the
    // composite reuse is flagged NOT-jar-verified in this module's own doc
    // comment, and flipping it is a separate, separately-evidenced change.
    addStateBoxInk(box, node, true);
    // G9/T8: a border-point composite reserves ink OUTSIDE the frame it draws
    // -- jar's ink/draw passes frontier it against different child rectangles.
    // Same `-1`/`+0` insets as the rect ink above. See `StateNodeGeo.inkOverflow`.
    const over = node.inkOverflow;
    if (over !== undefined) {
      addPoint(box, node.x - over.left - 1, node.y - over.top - 1);
      addPoint(box, node.x + node.width + over.right, node.y + node.height + over.bottom - 1);
    }
    addSouthCapInk(box, node);
    for (const child of node.children) addNodeInk(box, child, labelInk, arrowheadInk);
    for (const t of node.transitions) addTransitionInk(box, t, labelInk, arrowheadInk);
    return;
  }
  // G9/T7: a border point is a different image class upstream, not a state
  // box — `renderer.ts#renderShape` dispatches on the same marker.
  if (node.borderPointLabelAbove !== undefined) {
    addBorderPointInk(box, node);
    return;
  }
  switch (node.kind) {
    case 'initial':
    case 'final':
    case 'history':
    case 'deepHistory': {
      const r = node.width / 2;
      addEllipseInk(box, node.x + r, node.y + r, r);
      return;
    }
    case 'fork':
    case 'join':
    case 'syncBar':
      addBarInk(box, node.x, node.y, node.width, node.height);
      return;
    case 'choice': {
      const size = node.width / 2;
      addDiamondInk(box, node.x + size, node.y + size, size);
      return;
    }
    case 'normal':
    case 'json':
      addStateBoxInk(box, node, rendersDivider(node));
      return;
    case 'note':
      addNoteInk(box, node.x, node.y, node.width, node.height);
      return;
    // #lizard forgives -- faithful one-branch-per-StateKind dispatch,
    // mirroring renderer.ts#renderNode's own shape switch.
  }
}

/** The shared ink-point accumulation walk {@link computeStateDocumentDims},
 *  {@link computeStateInkShift}, and {@link computeSvekResultGeometry} consume. */
function buildInkBox(
  states: readonly StateNodeGeo[],
  transitions: readonly TransitionGeo[],
  labelInk: boolean,
  arrowheadInk: 'always' | 'self-loop',
): InkBox {
  const box = newInkBox();
  for (const n of states) addNodeInk(box, n, labelInk, arrowheadInk);
  for (const t of transitions) addTransitionInk(box, t, labelInk, arrowheadInk);
  return box;
}

export interface StateDocumentDims {
  readonly width: number;
  readonly height: number;
}

/**
 * The `SvekResult`/`TextBlockExporter`/`SvgGraphics` recipe (see module doc
 * comment), applied to state's own plain-geometry `StateNodeGeo`/
 * `TransitionGeo` arrays instead of a klimt `UGraphic` draw pass. Returns
 * `{width: 0, height: 0}` for an empty diagram (no ink at all) rather than
 * `NaN` from an unbounded `Infinity` box.
 */
export function computeStateDocumentDims(
  states: readonly StateNodeGeo[],
  transitions: readonly TransitionGeo[],
): StateDocumentDims {
  // `labelInk: false` -- this function is already jar-verified/pinned
  // (57 svg-state goldens) at the pre-existing point-only label fold;
  // G8 T2's box fold is scoped to `computeSvekResultGeometry` below.
  const raw = svekDimension(buildInkBox(states, transitions, false, 'always'));
  // Empty diagram (no ink at all): stay {0, 0} rather than applying the
  // margin to nothing, which would yield 6x6. The pre-refactor code got this
  // from an early `return {width: 0, height: 0}` before the margin
  // arithmetic; sharing the recipe made the guard explicit, and
  // `class/layout-ink-extent.ts#computeClassDocumentDims` states the reason:
  // a `{0, 0}` raw is the "no ink walked" sentinel, indistinguishable in
  // VALUE from 1x1 ink at the origin, and only the former skips the margin.
  if (raw.width === 0 && raw.height === 0) return raw;
  return applyCucaDocumentMargin(raw);
}

export interface StateInkShift {
  readonly dx: number;
  readonly dy: number;
}

/**
 * `SvekResult#calculateDimension`'s `moveDelta(6 - minMax.getMinX(), 6 -
 * minMax.getMinY())` — the uniform translate applied to every state/
 * transition position (post-layout, pre-render) so the diagram's own ink
 * extent's top-left corner lands at `(JAR_INK_MARGIN, JAR_INK_MARGIN)`.
 * Mirrors `class/layout-ink-extent.ts#computeClassInkShift`'s identical
 * mechanism. Returns `{dx: 0, dy: 0}` for an empty diagram.
 */
export function computeStateInkShift(
  states: readonly StateNodeGeo[],
  transitions: readonly TransitionGeo[],
): StateInkShift {
  // `labelInk: false` -- same already-pinned point-only fold as
  // `computeStateDocumentDims` above (shares its own ink-extent bbox
  // mechanism, must stay consistent with it).
  return svekInkShift(buildInkBox(states, transitions, false, 'always'));
}

export interface SvekResultGeometry {
  readonly width: number;
  readonly height: number;
  readonly dx: number;
  readonly dy: number;
}

/**
 * `SvekResult#calculateDimension()`'s FULL mechanism (mission G4 S4,
 * mechanism 7 — the composite-wrapper sizing/position gap): upstream
 * derives BOTH the reported dimension (`minMax.getDimension().delta(15,
 * 15)`) AND the `moveDelta(6 - minMax.getMinX(), 6 - minMax.getMinY())`
 * position shift from the SAME `TextBlockUtils.getMinMax` ink-extent walk
 * over a wrapped child pass's own DRAWN content — NOT from a naive
 * geometric (node/edge-extent-only) bounding box. `state-composite-
 * cluster.ts#tightContentDimension`'s own S3 trial fix used the naive
 * geometric box and was jar-verified WRONG by exactly the leaf-state-box
 * ink rule's `-1` min-corner asymmetry ({@link addStateBoxInk}'s
 * `[x-1,...] x [y-1,...]`, see this module's own doc comment) — that trial
 * shrank two fixtures' own diff counts (evidence the mechanism was
 * directionally right) but never reached byte-exact and regressed two
 * pinned `size-backlog.json` entries, so it was reverted.
 *
 * This function reproduces the REAL upstream mechanism (both halves driven
 * by the SAME ink-extent bbox, not two independent formulas) — jar-verified
 * byte-exact width/height/child-position on `coteta-47-mare883` (1 nesting
 * level) and `lonuti-97-voko521` (2 levels) once wired through
 * `state-composite-autonom.ts#buildPlainAutonomSpec`. See plans/g4-state-svg
 * /ledger.md S4 for the full hand-derivation (why the shift is `(7,7)`, not
 * the naively-expected `(6,6)`).
 *
 * Folds arrowhead ink for `from===to` transitions via {@link buildInkBox}
 * (mission T9, this module's own mechanism-7 paragraph). `buildPlainAutonom
 * Spec`'s own `Math.max(geometry.*, result.*)` floor is a SEPARATE, second
 * guard (the still-not-fully-closed edge-label-width gap — see that site).
 * @see ~/git/plantuml/.../svek/SvekResult.java:130-135
 */
export function computeSvekResultGeometry(
  states: readonly StateNodeGeo[],
  transitions: readonly TransitionGeo[],
): SvekResultGeometry {
  // `labelInk: true` -- G8 T2 (mission g7-borderpoint-rank T20b's verified
  // mechanism): fold each labeled transition's own reserved BOX, not just
  // its anchor point, into the composite's own content ink -- this is the
  // aggregation gap `buildPlainAutonomSpec`'s `Math.max` floor used to
  // compensate for (see that call site's own doc comment: proven redundant
  // once this box fold lands, D6, and removed there).
  // The SAME `SvekResult#calculateDimension` recipe the document-level
  // functions above use — dimension and moveDelta together, which is what
  // that one upstream method returns. This was a third inline copy.
  const box = buildInkBox(states, transitions, true, 'self-loop');
  return { ...svekDimension(box), ...svekInkShift(box) };
}
