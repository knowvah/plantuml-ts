import type { ActivityDiagramAST } from '../ast.js';
import type { ActivityEdgeGeo, ActivityGeometry, ActivityNodeGeo } from '../layout.old.js';
import type { Tile } from '../tiles/tile.js';
import { NORTH_HOOK, SOUTH_HOOK } from '../tiles/points.js';
import type { GPoint } from '../tiles/points.js';
import type { StringBounder } from '../tiles/tile.js';
import type { Theme } from '../../../core/theme.js';
import type { GtileAction } from '../tiles/gtile-action.js';
import type { GtileNote } from '../tiles/gtile-note.js';
import type { GtileDiamond } from '../tiles/gtile-diamond.js';
import type { GtileTopDown } from '../tiles/gtile-top-down.js';
import type { GtileIfWithLinks } from '../tiles/gtile-if-with-links.js';
import type { GtileIfDown } from '../tiles/gtile-if-down.js';
import type { GtileIfLongHorizontal } from '../tiles/gtile-if-long-horizontal.js';
import type { GtileWhile } from '../tiles/gtile-while.js';
import type { GtileRepeat } from '../tiles/gtile-repeat.js';
import type { GtileFork } from '../tiles/gtile-fork.js';
import type { GtileGroup } from '../tiles/gtile-group.js';
import type { GtileSwitch } from '../tiles/gtile-switch.js';
import type { GtileLabel } from '../tiles/gtile-label.js';
import { GConnectionVerticalDown } from '../routing/gconnection-vertical-down.js';
import { GConnectionSideThenVerticalThenSide } from '../routing/gconnection-side-then-vertical-then-side.js';
import { dedupeAdjacentPoints } from './edge-point-dedupe.js';
import { walkForkOrSplit } from './walk-fork-branches.js';
import { walkWhile } from './walk-while-branch.js';
import { walkRepeat } from './walk-repeat.js';
import { walkIfWithLinks } from './walk-if-with-links.js';
import { walkIfDown } from './walk-if-down.js';
import { walkIfLongHorizontal } from './walk-if-long-horizontal.js';
import { laneAt, laneIn, laneOut } from './swimlane-placement.js';
import type { EdgeMeta, EdgeShape } from './swimlane-placement.js';
import type { Reservation } from './hexagon-reservations.js';
import { assignCoordinatesFull } from './assign-coordinates-full.js';

export const LAYOUT_MARGIN = 12;

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
}

export function pushNode(out: Out, node: ActivityNodeGeo, lane: string | undefined): void {
  if (lane !== undefined) node.swimlane = lane;
  out.nodes.push(node);
}

export function pushEdge(
  out: Out,
  points: GPoint[],
  lane1: string | undefined,
  lane2: string | undefined,
  shape: EdgeShape = 'default',
): void {
  out.edges.push({ points: dedupeAdjacentPoints(points) });
  out.edgeMeta.push({ lane1, lane2, shape });
}

export function walkTile(tile: Tile, x: number, y: number, hints: WalkHints, out: Out): void {
  const { kindHint, lane } = hints;
  const myLane = laneAt(tile, lane);

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

    case 'gtile-kill':
      pushNode(out, { id: out.nextId('kill'), kind: 'kill', x, y, width: tile.width, height: tile.height }, myLane);
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

    case 'gtile-diamond': {
      const t = tile as unknown as GtileDiamond;
      const k = kindHint !== null && !kindHint.startsWith('gtile-') ? kindHint : 'diamond';
      pushNode(out, { id: out.nextId(k), kind: k, x, y, width: t.width, height: t.height, label: t.label }, myLane);
      return;
    }

    case 'gtile-spot':
      pushNode(out, { id: out.nextId('spot'), kind: 'spot', x, y, width: tile.width, height: tile.height }, myLane);
      return;

    case 'gtile-label': {
      const t = tile as unknown as GtileLabel;
      pushNode(
        out,
        { id: out.nextId('label'), kind: 'label', x, y, width: t.width, height: t.height, label: t.name },
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
      let prevX = 0;
      let prevY = 0;
      for (let i = 0; i < t.children.length; i++) {
        const child = t.children[i]!;
        const childY = y + t.childOffsets[i]!;
        const childX = x + t.childOffsetsX[i]!;
        walkTile(child, childX, childY, { kindHint: null, lane: myLane }, out);
        if (prevChild !== null) {
          const from = { x: prevX + prevChild.getCoord(SOUTH_HOOK).x, y: prevY + prevChild.getCoord(SOUTH_HOOK).y };
          const to = { x: childX + child.getCoord(NORTH_HOOK).x, y: childY + child.getCoord(NORTH_HOOK).y };
          pushEdge(
            out,
            new GConnectionVerticalDown().getPoints(from, to),
            laneOut(prevChild, myLane),
            laneIn(child, myLane),
          );
        }
        prevChild = child;
        prevX = childX;
        prevY = childY;
      }
      return;
    }

    case 'gtile-if-with-links':
      // D1/D5: `FtileIfWithLinks`'s own walker, split into
      // `walk-if-with-links.ts` for the same reason `walkForkOrSplit`/
      // `walkWhile` already are.
      walkIfWithLinks(tile as unknown as GtileIfWithLinks, x, y, myLane, out);
      return;

    case 'gtile-if-down':
      // D1/D5: `FtileIfDown`'s own walker, split into `walk-if-down.ts`
      // for the same reason `walkIfWithLinks` already is.
      walkIfDown(tile as unknown as GtileIfDown, x, y, myLane, out);
      return;

    case 'gtile-if-long-horizontal':
      // D1/D5: `FtileIfLongHorizontal`'s own walker, split into
      // `walk-if-long-horizontal.ts` for the same reason `walkIfDown`/
      // `walkIfWithLinks` already are. The legacy single-diamond tile and
      // this switch's own single-diamond case are retired here (T5, the
      // task that lands the last if-builder, D1).
      walkIfLongHorizontal(tile as unknown as GtileIfLongHorizontal, x, y, myLane, out);
      return;

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

    case 'gtile-switch': {
      const t = tile as unknown as GtileSwitch;
      const centerX = x + tile.width / 2;
      const hasMerge = t.mergeOffsetY !== null;
      const rawChildren = t.children;
      const diamond = rawChildren[0]!;
      const cases = hasMerge ? rawChildren.slice(1, -1) : rawChildren.slice(1);
      const mergeDiamond = hasMerge ? rawChildren[rawChildren.length - 1]! : null;

      const dX = centerX - diamond.width / 2;
      const dY = y + t.diamondOffsetY;
      walkTile(diamond, dX, dY, { kindHint: 'if-split', lane: myLane }, out);

      for (let i = 0; i < cases.length; i++) {
        const c = cases[i]!;
        const cX = x + t.caseOffsets[i]!;
        const cY = y + t.caseOffsetY;
        walkTile(c, cX, cY, { kindHint: null, lane: myLane }, out);

        const from = { x: dX + diamond.getCoord(SOUTH_HOOK).x, y: dY + diamond.getCoord(SOUTH_HOOK).y };
        const to = { x: cX + c.getCoord(NORTH_HOOK).x, y: cY + c.getCoord(NORTH_HOOK).y };
        pushEdge(
          out,
          new GConnectionSideThenVerticalThenSide().getPoints(from, to),
          laneOut(diamond, myLane),
          laneIn(c, myLane),
        );

        if (mergeDiamond !== null) {
          const mX = centerX - mergeDiamond.width / 2;
          const mY = y + t.mergeOffsetY!;
          const mFrom = { x: cX + c.getCoord(SOUTH_HOOK).x, y: cY + c.getCoord(SOUTH_HOOK).y };
          const mTo = { x: mX + mergeDiamond.getCoord(NORTH_HOOK).x, y: mY + mergeDiamond.getCoord(NORTH_HOOK).y };
          pushEdge(
            out,
            new GConnectionSideThenVerticalThenSide().getPoints(mFrom, mTo),
            laneOut(c, myLane),
            laneIn(mergeDiamond, myLane),
          );
        }
      }

      if (mergeDiamond !== null) {
        const mX = centerX - mergeDiamond.width / 2;
        const mY = y + t.mergeOffsetY!;
        walkTile(mergeDiamond, mX, mY, { kindHint: 'if-merge', lane: myLane }, out);
      }
      return;
    }

    case 'gtile-group':
    case 'gtile-partition': {
      const t = tile as unknown as GtileGroup;
      const gKind = tile.kind === 'gtile-group' ? 'group' : 'partition';
      pushNode(out, { id: out.nextId(gKind), kind: gKind, x, y, width: tile.width, height: tile.height }, myLane);
      if (t.children.length > 0) {
        walkTile(t.children[0]!, x + t.bodyOffsetX, y + t.bodyOffsetY, { kindHint: null, lane: myLane }, out);
      }
      return;
    }

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

export function assignCoordinates(
  root: Tile,
  ast: ActivityDiagramAST,
  baseX: number,
  baseY: number,
  bounder: StringBounder,
  theme: Theme,
): ActivityGeometry {
  return assignCoordinatesFull({ root, ast, baseX, baseY, bounder, theme }).geometry;
}
