import type { ActivityDiagramAST } from '../ast.js';
import type { ActivityEdgeGeo, ActivityGeometry, ActivityNodeGeo } from '../activity-geometry.types.js';
import type { Tile } from '../tiles/tile.js';
import { NORTH_HOOK, SOUTH_HOOK } from '../tiles/points.js';
import type { GPoint } from '../tiles/points.js';
import type { StringBounder } from '../tiles/tile.js';
import type { Theme } from '../../../core/theme.js';
import type { GtileAction } from '../tiles/gtile-action.js';
import type { GtileNote, GtileNoteOpale } from '../tiles/gtile-note.js';
import type { GtileWithNotes } from '../tiles/gtile-with-notes.js';
import type { GtileDiamond } from '../tiles/gtile-diamond.js';
import type { GtileTopDown } from '../tiles/gtile-top-down.js';
import type { GtileIfWithLinks } from '../tiles/gtile-if-with-links.js';
import type { GtileIfDown } from '../tiles/gtile-if-down.js';
import type { GtileIfLongHorizontal } from '../tiles/gtile-if-long-horizontal.js';
import type { GtileIfLongVertical } from '../tiles/gtile-if-long-vertical.js';
import type { GtileWhile } from '../tiles/gtile-while.js';
import type { GtileRepeat } from '../tiles/gtile-repeat.js';
import type { GtileFork } from '../tiles/gtile-fork.js';
import type { GtileGroup } from '../tiles/gtile-group.js';
import type { GtileSwitch } from '../tiles/gtile-switch.js';
import type { GtileLabel } from '../tiles/gtile-label.js';
import type { GtileSpot } from '../tiles/gtile-spot.js';
import type { GtileGoto } from '../tiles/gtile-goto.js';
import { GConnectionVerticalDown } from '../routing/gconnection-vertical-down.js';
import { dedupeAdjacentPoints } from './edge-point-dedupe.js';
import { walkForkOrSplit } from './walk-fork-branches.js';
import { walkWhile } from './walk-while-branch.js';
import { walkRepeat } from './walk-repeat.js';
import { walkIfWithLinks } from './walk-if-with-links.js';
import { walkIfDown } from './walk-if-down.js';
import { walkIfLongHorizontal } from './walk-if-long-horizontal.js';
import { walkIfLongVertical } from './walk-if-long-vertical.js';
import { walkSwitch } from './walk-switch.js';
import { walkNoteOpale, walkWithNotes } from './walk-with-notes.js';
import { laneAt, laneIn, laneOut } from './swimlane-placement.js';
import type { EdgeMeta, EdgeShape } from './swimlane-placement.js';
import type { Reservation } from './hexagon-reservations.js';
import type { LoopTranslate } from './swimlane-loop-translate.js';
import type { HlinePayload } from './swimlane-hline.js';
import { assignCoordinatesFull } from './assign-coordinates-full.js';
import { applyInLabel } from './tile-layout-inlabel.js';

/**
 * `kindHint` labels a diamond's role (`if-split`, `if-merge`,
 * `while-header`, `repeat-cond`) for `ActivityNodeGeo.kind`; `lane` is the
 * swimlane inherited from the nearest ancestor tile whose OWN
 * `.swimlane` is set. Structural children with no AST node of their own
 * -- a composite's condition diamond, its merge diamond, a fork/split's
 * bars -- carry no `.swimlane` (`tile-layout.ts` only calls
 * `withSwimlane` on AST-derived tiles), so they fall back to the
 * composite's own resolved lane. Bundled into one object because
 * `walkTile` is already at the file's parameter limit.
 */
export interface WalkHints {
  kindHint: string | null;
  lane: string | undefined;
}

export interface Out {
  nodes: ActivityNodeGeo[];
  edges: ActivityEdgeGeo[];
  edgeMeta: EdgeMeta[];
  /**
   * `UEmpty` compression reservations the if/while walkers emit beside a
   * hexagon's loop-back elbow (mission `activity-klimt-compress` T3, D5).
   * Internal to `layout/`; never part of the public `ActivityGeometry`.
   */
  reservations: Reservation[];
  nextId: (prefix: string) => string;
  /**
   * D1 (T1b): the `FtileGroup`/`partition` nesting stack `pushEdge` tags
   * each new edge's `EdgeMeta.scope` with, joined (`[]` = top level) --
   * see `swimlane-placement.ts`'s `EdgeMeta.scope` doc. Mutated only by
   * `walkTile`'s `'gtile-group'`/`'gtile-partition'` case below.
   */
  groupScope: string[];
}

export function pushNode(out: Out, node: ActivityNodeGeo, lane: string | undefined): void {
  if (lane !== undefined) node.swimlane = lane;
  out.nodes.push(node);
}

/**
 * T3k companion fix: `renderNode`'s `'if-split'` case draws the polygon
 * ALONE (the own label moved to its own `'if-own-label'` node,
 * `activity-renderer-shapes.ts`'s own doc) for every `'if-split'`
 * producer, including the switch condition diamond `walkTile`'s
 * `'gtile-diamond'` case pushes (`tile-layout.ts:321`, `kindHint:
 * 'if-split'`, this file's `'gtile-switch'` case). `GtileDiamond` has no
 * north/south slots to land between (`tiles/gtile-diamond.ts`'s own
 * fields), so the own label always sits immediately after the polygon --
 * never pushed for `kind === 'if-merge'` (the merge diamond's own `label`
 * is always `''`, `tile-layout.ts:326`, and `renderIfMerge` never draws
 * text regardless).
 */
function pushDiamondCompanionLabel(
  out: Out,
  kind: string,
  t: GtileDiamond,
  origin: GPoint,
  lane: string | undefined,
): void {
  if (kind !== 'if-split' || t.label === '') return;
  const node = {
    id: out.nextId('if-own-label'),
    kind: 'if-own-label',
    ...origin,
    width: t.width,
    height: t.height,
    label: t.label,
  };
  pushNode(out, node, lane);
}

// `pushTopDownSiblingEdge`'s own link bundle -- declared here, BEFORE
// `pushEdge`, so a TS `interface` block never sits between two
// functions (lizard's TS reader has repeatedly misattributed an
// interface's own field-line count into the PRECEDING function's NLOC
// in this file -- `assignCoordinates`/`walkTile` hit the same thing
// earlier in this task; relocating the interface is the fix each time).
interface TopDownSiblingLink {
  readonly prevChild: Tile;
  readonly prevOffsetX: number;
  readonly prevY: number;
  readonly child: Tile;
  readonly nextOffsetX: number;
  readonly nextY: number;
  readonly baseX: number;
  readonly myLane: string | undefined;
}

/**
 * `pushEdge`'s trailing parameter: a bare {@link EdgeShape} (every existing
 * call site -- fork/if-long-horizontal's three non-default shapes) or,
 * for a `while`/`repeat` back-edge that also carries a translate tag
 * (mission `activity-loop-lane-translate`, T2/T3) or an `hline`-style
 * `ConnectionHline` template (T1p-g), an object bundling the lot. A
 * single parameter keeps `pushEdge` at the file's 5-parameter limit
 * without touching the call sites that already pass a bare shape.
 */
export type PushEdgeRouting =
  EdgeShape | { readonly shape?: EdgeShape; readonly loop?: LoopTranslate; readonly hline?: HlinePayload };

export function pushEdge(
  out: Out,
  points: GPoint[],
  lane1: string | undefined,
  lane2: string | undefined,
  routing: PushEdgeRouting = 'default',
): void {
  const shape = typeof routing === 'string' ? routing : (routing.shape ?? 'default');
  const loop = typeof routing === 'string' ? undefined : routing.loop;
  const hline = typeof routing === 'string' ? undefined : routing.hline;
  const scope = out.groupScope.length > 0 ? out.groupScope.join('>') : undefined;
  out.edges.push({ points: dedupeAdjacentPoints(points) });
  out.edgeMeta.push({
    lane1,
    lane2,
    shape,
    ...(loop !== undefined ? { loop } : {}),
    ...(hline !== undefined ? { hline } : {}),
    ...(scope !== undefined ? { scope } : {}),
  });
}

// The `gtile-top-down` sibling edge, gated on the preceding child's own
// out point (FtileFactoryDelegatorAssembly.java:67-70: `geo =
// tile1.calculateDimension(...)`, `if (geo.hasPointOut() == false)
// return result` -- no connection when the PRECEDING sibling has no out
// point, e.g. a stop/kill/break; T2b row 28, piruxe-91-zivi081
// residual). T1b (stop-13 fix, journal row 22): resolves each side's
// own LOCAL round-trip (childOffsetsX[i] + ownHook.x) FIRST, then adds
// the walk-time baseX exactly ONCE -- matching getTranslated1/2's own
// local grouping (FtileAssemblySimple.java:132-140, FtileGeometry.java
// :149-156,77-82), not folding baseX in a step earlier the way `childX
// = x + childOffsetsX[i]` did. Regrouping the same three terms left
// from.x/to.x one ULP apart on pixako-75-kumi821 even though both
// represent the same composite left.
function pushTopDownSiblingEdge(out: Out, link: TopDownSiblingLink): void {
  const { prevChild, prevOffsetX, prevY, child, nextOffsetX, nextY, baseX, myLane } = link;
  if (!prevChild.hasPointOut()) return;
  const southHook = prevChild.getCoord(SOUTH_HOOK);
  const northHook = child.getCoord(NORTH_HOOK);
  const from = { x: baseX + (prevOffsetX + southHook.x), y: prevY + southHook.y };
  const to = { x: baseX + (nextOffsetX + northHook.x), y: nextY + northHook.y };
  pushEdge(out, new GConnectionVerticalDown().getPoints(from, to), laneOut(prevChild, myLane), laneIn(child, myLane));
  // T1b pass 2: `ConnectionVerticalDown.java:79-80`'s own `withLabel(textBlock, arrowHorizontalAlignment())`.
  applyInLabel(out, child, { horizontal: 'LEFT' });
}

/** Every if-builder's own tile kind -- checked BEFORE `walkTile`'s own
 *  switch (same precedent as `tile-layout.ts#isSimpleLeaf`/
 *  `isNullResultKind`, used there for the identical reason: a `Set.has`
 *  guard costs ONE decision point for the whole group, where N more `case`
 *  labels inside the switch would cost N -- keeping `walkTile`'s own
 *  NLOC/CCN from growing every time a new if-builder lands, T1p-b's own
 *  addition included). */
const IF_VARIANT_KINDS: ReadonlySet<string> = new Set([
  'gtile-if-with-links',
  'gtile-if-down',
  'gtile-if-long-horizontal',
  'gtile-if-long-vertical',
]);

/**
 * D1/D5/D12(T1p-b): every if-builder's own walker, each split into its own
 * sibling module for the same reason `walkForkOrSplit`/`walkWhile` already
 * are. Gated by {@link IF_VARIANT_KINDS} rather than inline `case` labels
 * in `walkTile` itself (that function's own doc).
 */
function walkIfVariant(tile: Tile, x: number, y: number, myLane: string | undefined, out: Out): void {
  switch (tile.kind) {
    case 'gtile-if-with-links':
      walkIfWithLinks(tile as unknown as GtileIfWithLinks, x, y, myLane, out);
      return;
    case 'gtile-if-down':
      walkIfDown(tile as unknown as GtileIfDown, x, y, myLane, out);
      return;
    case 'gtile-if-long-horizontal':
      // The legacy single-diamond tile and this switch's own single-diamond
      // case are retired here (T5, the task that lands the last if-builder,
      // D1).
      walkIfLongHorizontal(tile as unknown as GtileIfLongHorizontal, x, y, myLane, out);
      return;
    default:
      walkIfLongVertical(tile as unknown as GtileIfLongVertical, x, y, myLane, out);
  }
}

export function walkTile(tile: Tile, x: number, y: number, hints: WalkHints, out: Out): void {
  const { kindHint, lane } = hints;
  const myLane = laneAt(tile, lane);

  if (IF_VARIANT_KINDS.has(tile.kind)) {
    walkIfVariant(tile, x, y, myLane, out);
    return;
  }

  switch (tile.kind) {
    case 'gtile-start':
      pushNode(out, { id: out.nextId('start'), kind: 'start', x, y, width: tile.width, height: tile.height }, myLane);
      return;

    case 'gtile-stop':
      pushNode(out, { id: out.nextId('stop'), kind: 'stop', x, y, width: tile.width, height: tile.height }, myLane);
      return;

    case 'gtile-end':
      pushNode(out, { id: out.nextId('end'), kind: 'end', x, y, width: tile.width, height: tile.height }, myLane);
      return;

    case 'gtile-break':
      pushNode(out, { id: out.nextId('break'), kind: 'break', x, y, width: tile.width, height: tile.height }, myLane);
      return;

    case 'gtile-action': {
      const t = tile as unknown as GtileAction;
      const node: ActivityNodeGeo = {
        id: out.nextId('action'),
        kind: 'action',
        x,
        y,
        width: t.width,
        height: t.height,
        label: t.label,
      };
      if (t.color !== undefined) node.color = t.color;
      pushNode(out, node, myLane);
      return;
    }

    case 'gtile-note': {
      const t = tile as unknown as GtileNote;
      pushNode(
        out,
        {
          id: out.nextId('note'),
          kind: 'note',
          x,
          y,
          width: t.width,
          height: t.height,
          label: t.text,
          notePosition: t.side,
        },
        myLane,
      );
      return;
    }

    // `FtileWithNoteOpale#drawU` (`:195-221`) -- see `walk-with-notes.ts`'s
    // own `walkNoteOpale` doc.
    case 'gtile-note-opale':
      walkNoteOpale(tile as unknown as GtileNoteOpale, x, y, myLane, out);
      return;

    // NOTE-MULTI/GROUPNOTE (`activity-divergence-drive-3` T2a):
    // `FtileWithNotes` -- see `walk-with-notes.ts`'s own doc.
    case 'gtile-with-notes':
      walkWithNotes(tile as unknown as GtileWithNotes, x, y, myLane, out);
      return;

    case 'gtile-diamond': {
      const t = tile as unknown as GtileDiamond;
      const k = kindHint !== null && !kindHint.startsWith('gtile-') ? kindHint : 'diamond';
      pushNode(out, { id: out.nextId(k), kind: k, x, y, width: t.width, height: t.height, label: t.label }, myLane);
      return pushDiamondCompanionLabel(out, k, t, { x, y }, myLane);
    }

    // add2-T2g: `label: t.name` added so the renderer's `renderSpot`
    // (`activity-renderer-terminals.ts`) has the circled character to
    // draw -- the pre-existing case built the node without it (never
    // wired to an `ActivityNode` of its own until this task). Reported
    // per this task's write-set note (T2h owns this file).
    case 'gtile-spot': {
      const t = tile as unknown as GtileSpot;
      const node: ActivityNodeGeo = { id: out.nextId('spot'), kind: 'spot', x, y, width: t.width, height: t.height, label: t.name };
      if (t.color !== undefined) node.color = t.color;
      pushNode(out, node, myLane);
      return;
    }

    case 'gtile-label': {
      const t = tile as unknown as GtileLabel;
      pushNode(
        out,
        { id: out.nextId('label'), kind: 'label', x, y, width: t.width, height: t.height, label: t.name },
        myLane,
      );
      return;
    }

    // add2-T2g: NEW case (`gtile-goto` did not exist before this task).
    // Zero-size, same push shape as `gtile-label` immediately above --
    // `renderNode`'s own `'goto'` case draws nothing (`FtileGoto` draws
    // nothing, `ast.ts`'s own doc). Reported per this task's write-set
    // note (T2h owns this file; a new case was unavoidable since no
    // existing kind modeled "no out point").
    case 'gtile-goto': {
      const t = tile as unknown as GtileGoto;
      pushNode(
        out,
        { id: out.nextId('goto'), kind: 'goto', x, y, width: t.width, height: t.height, label: t.name },
        myLane,
      );
      return;
    }

    case 'gtile-top-down': {
      // D7 (`plans/activity-if-tile-port/decisions.md`,
      // `.agent-notes/aicdo-planning.md` "the jar draws EVERY sibling link
      // after BOTH endpoints"): the vertical link between two siblings is
      // added AROUND `FtileAssemblySimple(tile1, tile2)` by
      // `FtileFactoryDelegatorAssembly#assembly`
      // (`vcompact/FtileFactoryDelegatorAssembly.java:57-79`), whose own
      // `drawU` draws only the two tiles, no connection
      // (`FtileAssemblySimple.java:108-112`); `FtileWithConnection#drawU`
      // draws its delegate BEFORE its own connections
      // (`FtileWithConnection.java:69-74`). So for siblings `a, X, c` the
      // jar's run is `X's internals, a->X, c's internals, X->c`: each link
      // is pushed only after the child it points TO has been fully walked,
      // not before the child it points FROM.
      // T6b (`FtileAssemblySimple.java:131-141`): children are NOT centred
      // on the composite's width -- each child i is translated by
      // `left - child_i.left` so every child's own in/out x lands under the
      // merged `left` (`GtileTopDown`'s `childOffsetsX`).
      const t = tile as unknown as GtileTopDown;
      if (t.children.length === 0) return;
      let prevChild: Tile | null = null;
      let prevOffsetX = 0;
      let prevY = 0;
      for (let i = 0; i < t.children.length; i++) {
        const child = t.children[i]!;
        const childY = y + t.childOffsets[i]!;
        const offsetX = t.childOffsetsX[i]!;
        walkTile(child, x + offsetX, childY, { kindHint: null, lane: myLane }, out);
        // `hasPointOut()` gate: see `pushTopDownSiblingEdge`'s own doc.
        if (prevChild !== null) {
          pushTopDownSiblingEdge(out, {
            prevChild,
            prevOffsetX,
            prevY,
            child,
            nextOffsetX: offsetX,
            nextY: childY,
            baseX: x,
            myLane,
          });
        }
        prevChild = child;
        prevOffsetX = offsetX;
        prevY = childY;
      }
      return;
    }

    case 'gtile-while':
      walkWhile(tile as unknown as GtileWhile, x, y, myLane, out);
      return;

    case 'gtile-repeat':
      // D10: `FtileRepeat`'s own walker, split into `walk-repeat.ts` for
      // the same reason `walkWhile`/`walkIfDown` already are.
      walkRepeat(tile as unknown as GtileRepeat, x, y, myLane, out);
      return;

    case 'gtile-fork':
    case 'gtile-split': {
      // D4: the bar/line nodes, `walkForkBranches`, and the join node
      // all delegate to a sibling module only to keep this switch under
      // the file's 500-line cap (mission `activity-parallel-connectors`
      // README, "Push forward").
      walkForkOrSplit(tile as unknown as GtileFork, x, y, myLane, out);
      return;
    }

    case 'gtile-switch':
      // D1/D5 (T1p-e step 1): `FtileSwitchWith{One,Many}Links`'s own
      // walker, split into `walk-switch.ts` for the same reason
      // `walkIfDown`/`walkIfWithLinks`/`walkRepeat` already are.
      walkSwitch(tile as unknown as GtileSwitch, x, y, myLane, out);
      return;

    case 'gtile-group':
    case 'gtile-partition':
      walkTileGroup(tile as unknown as GtileGroup, x, y, myLane, out);
      return;

    default:
      // #lizard forgives -- faithful port of the upstream tile-kind
      // dispatch switch (mirrors `Ftile`/`Gtile` subtype dispatch);
      // splitting this into per-kind functions would obscure the 1:1
      // correspondence CLAUDE.md requires ("do not refactor while
      // porting").
      pushNode(
        out,
        { id: out.nextId('unknown'), kind: tile.kind, x, y, width: tile.width, height: tile.height },
        myLane,
      );
      return;
  }
}

/**
 * T3h (row PART-XLANE, `vodobe-33-kefa909`/`notuli-49-xugi698`):
 * `FtileGroup.getSwimlanes()` (`:128-130`) delegates to `inner
 * .getSwimlanes()`, which for a sequential body resolves through
 * `FtileAssemblySimple.getSwimlanes()`'s union-of-children recursion
 * (`ftile/FtileAssemblySimple.java:148-153`) down to `FtileBox
 * .getSwimlanes()`'s own-field-only leaf case (`ftile/vertical/FtileBox
 * .java:110-115`: `swimlane == null ? emptySet() : singleton(swimlane)`).
 * No "inherited ambient lane" fallback anywhere in that chain -- every
 * real AST leaf already carries its OWN resolved `.swimlane`
 * (`tile-layout.ts`'s threading, `tile.ts`'s own doc), so a structural
 * tile with no AST node of its own (a diamond, a fork bar) contributes
 * nothing, exactly as the jar's generic `Ftile` would. Mirrored here as
 * a `children`-recursion generic over every `TileComposite` kind, not
 * `laneAt`/`laneIn`/`laneOut` (`swimlane-lanes.ts`) -- those port a
 * DIFFERENT upstream accessor pair (`Swimable.java`'s single-valued
 * `getSwimlaneIn()`/`getSwimlaneOut()`), never the full `Set<Swimlane>`.
 */
function collectTouchedLanes(tile: Tile, out: Set<string>): void {
  if (tile.swimlane !== undefined) out.add(tile.swimlane);
  if ('children' in tile) {
    for (const child of (tile as unknown as { children: readonly Tile[] }).children) {
      collectTouchedLanes(child, out);
    }
  }
}

/**
 * The `'gtile-group'`/`'gtile-partition'` case, split out of `walkTile`'s
 * own switch purely to keep that function's NLOC from growing (D1, T1b):
 * pushes a new `groupScope` id before walking the group's own body, so
 * `pushEdge` tags every edge inside with it, then pops it back off.
 *
 * T3h: `FtileGroup.drawU` (`:209-227`) draws the SAME-sized frame
 * (`type.asBig(...)`, dims from the cached, lane-spanning `calculateDimension`)
 * every time it is invoked -- and `UGraphicInterceptorOneSwimlane.draw`
 * (`:66-75`) invokes `tile.drawU(this)` once per lane the group's
 * `getSwimlanes()` touches, since `drawWhenSwimlanes`'s own outer loop
 * (`Swimlanes.java:328-347`) runs that interceptor once per
 * `swimlanesSpecial()` entry. Net effect, verified against jar's own
 * `notuli-49-xugi698` SVG: two `<rect>` frames, BOTH `width="80.05"
 * height="130"`, one per touched lane, each at that lane's own x. One
 * `pushNode` per lane in {@link collectTouchedLanes}'s result (falling
 * back to `[myLane]`, a single push, when the body touches no lane of
 * its own -- the zero/one-lane case, byte-identical to the pre-T3h
 * single push). `bucketNodesByLane`'s own stable-order grouping
 * (`activity-renderer-swimlanes.ts`) means push order across DIFFERENT
 * lanes is immaterial; within a lane it still matters, which is why this
 * stays ahead of the content walk below, mirroring `drawU`'s own
 * frame-then-content order inside each lane's pass.
 */
function walkTileGroup(tile: GtileGroup, x: number, y: number, myLane: string | undefined, out: Out): void {
  const gKind = tile.kind === 'gtile-group' ? 'group' : 'partition';
  const touched = new Set<string>();
  if (tile.children.length > 0) collectTouchedLanes(tile.children[0]!, touched);
  const lanes: ReadonlyArray<string | undefined> = touched.size > 0 ? [...touched] : [myLane];
  for (const lane of lanes) {
    pushNode(
      out,
      { id: out.nextId(gKind), kind: gKind, x, y, width: tile.width, height: tile.height, label: tile.title },
      lane,
    );
  }
  if (tile.children.length === 0) return;
  // D1 (T1b): `FtileGroup` opens its own nested `UGraphicForSnake`
  // (`decisions.md#D1`) -- a pushed scope id so `snake-merge.ts` never
  // fuses an edge inside this group with one outside it.
  out.groupScope.push(out.nextId('scope'));
  walkTile(tile.children[0]!, x + tile.bodyOffsetX, y + tile.bodyOffsetY, { kindHint: null, lane: myLane }, out);
  out.groupScope.pop();
}

/**
 * T1b: `base` bundles the formerly-separate `baseX`/`baseY` positional pair
 * -- a pre-existing parser blind spot in this file (`lizard` never parsed
 * past the giant `walkTile` switch, so this 6th positional argument's own
 * cap violation went undetected) surfaced once an unrelated edit let it
 * parse the whole file; the two coordinates were always passed together at
 * every call site, so bundling them is a reshape, not a behavior change.
 */
export function assignCoordinates(
  root: Tile,
  ast: ActivityDiagramAST,
  base: GPoint,
  bounder: StringBounder,
  theme: Theme,
): ActivityGeometry {
  return assignCoordinatesFull({ root, ast, baseX: base.x, baseY: base.y, bounder, theme }).geometry;
}
