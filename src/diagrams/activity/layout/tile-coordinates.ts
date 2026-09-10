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
import type { GtileIf } from '../tiles/gtile-if.js';
import type { GtileWhile } from '../tiles/gtile-while.js';
import type { GtileRepeat } from '../tiles/gtile-repeat.js';
import type { GtileFork } from '../tiles/gtile-fork.js';
import type { GtileGroup } from '../tiles/gtile-group.js';
import type { GtileSwitch } from '../tiles/gtile-switch.js';
import type { GtileLabel } from '../tiles/gtile-label.js';
import { GConnectionVerticalDown } from '../routing/gconnection-vertical-down.js';
import { GConnectionVerticalDownThenBack } from '../routing/gconnection-vertical-down-then-back.js';
import { GConnectionDownThenUp } from '../routing/gconnection-down-then-up.js';
import { GConnectionSideThenVerticalThenSide } from '../routing/gconnection-side-then-vertical-then-side.js';
import { dedupeAdjacentPoints } from './edge-point-dedupe.js';
import { walkForkOrSplit } from './walk-fork-branches.js';
import {
  computeSwimlaneChrome,
  laneAt,
  laneIn,
  laneOut,
  placeSwimlanes,
  resolveSwimlaneVertical,
} from './swimlane-placement.js';
import type { EdgeMeta, PlacementResult } from './swimlane-placement.js';

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
  nextId: (prefix: string) => string;
}

export function pushNode(out: Out, node: ActivityNodeGeo, lane: string | undefined): void {
  if (lane !== undefined) node.swimlane = lane;
  out.nodes.push(node);
}

export function pushEdge(out: Out, points: GPoint[], lane1: string | undefined, lane2: string | undefined): void {
  out.edges.push({ points: dedupeAdjacentPoints(points) });
  out.edgeMeta.push({ lane1, lane2 });
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
      const t = tile as unknown as GtileTopDown;
      if (t.children.length === 0) return;
      const centerX = x + tile.width / 2;
      for (let i = 0; i < t.children.length; i++) {
        const child = t.children[i]!;
        const childY = y + t.childOffsets[i]!;
        const childX = centerX - child.width / 2;
        walkTile(child, childX, childY, { kindHint: null, lane: myLane }, out);
        if (i < t.children.length - 1) {
          const next = t.children[i + 1]!;
          const nextY = y + t.childOffsets[i + 1]!;
          const nextX = centerX - next.width / 2;
          const from = { x: childX + child.getCoord(SOUTH_HOOK).x, y: childY + child.getCoord(SOUTH_HOOK).y };
          const to = { x: nextX + next.getCoord(NORTH_HOOK).x, y: nextY + next.getCoord(NORTH_HOOK).y };
          pushEdge(
            out,
            new GConnectionVerticalDown().getPoints(from, to),
            laneOut(child, myLane),
            laneIn(next, myLane),
          );
        }
      }
      return;
    }

    case 'gtile-if': {
      const t = tile as unknown as GtileIf;
      const centerX = x + tile.width / 2;
      const hasMerge = t.mergeOffsetY !== null;
      const rawChildren = t.children;
      const diamond = rawChildren[0]!;
      const branches = hasMerge ? rawChildren.slice(1, -1) : rawChildren.slice(1);
      const mergeDiamond = hasMerge ? rawChildren[rawChildren.length - 1]! : null;

      const dX = centerX - diamond.width / 2;
      const dY = y + t.diamondOffsetY;
      walkTile(diamond, dX, dY, { kindHint: 'if-split', lane: myLane }, out);

      for (let i = 0; i < branches.length; i++) {
        const branch = branches[i]!;
        const bX = x + t.branchOffsets[i]!;
        const bY = y + t.branchOffsetY;
        walkTile(branch, bX, bY, { kindHint: null, lane: myLane }, out);

        const from = { x: dX + diamond.getCoord(SOUTH_HOOK).x, y: dY + diamond.getCoord(SOUTH_HOOK).y };
        const to = { x: bX + branch.getCoord(NORTH_HOOK).x, y: bY + branch.getCoord(NORTH_HOOK).y };
        pushEdge(
          out,
          new GConnectionSideThenVerticalThenSide().getPoints(from, to),
          laneOut(diamond, myLane),
          laneIn(branch, myLane),
        );

        if (mergeDiamond !== null) {
          const mX = centerX - mergeDiamond.width / 2;
          const mY = y + t.mergeOffsetY!;
          const mFrom = { x: bX + branch.getCoord(SOUTH_HOOK).x, y: bY + branch.getCoord(SOUTH_HOOK).y };
          const mTo = { x: mX + mergeDiamond.getCoord(NORTH_HOOK).x, y: mY + mergeDiamond.getCoord(NORTH_HOOK).y };
          pushEdge(
            out,
            new GConnectionSideThenVerticalThenSide().getPoints(mFrom, mTo),
            laneOut(branch, myLane),
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

    case 'gtile-while': {
      const t = tile as unknown as GtileWhile;
      const rawChildren = t.children;
      const header = rawChildren[0]!;
      const body = rawChildren[1]!;
      // Center of content area (excludes the back-edge lane)
      const contentCenterX = x + t.getCoord(NORTH_HOOK).x;

      const hX = contentCenterX - header.width / 2;
      const hY = y + t.headerOffsetY;
      walkTile(header, hX, hY, { kindHint: 'while-header', lane: myLane }, out);

      const bX = contentCenterX - body.width / 2;
      const bY = y + t.bodyOffsetY;
      walkTile(body, bX, bY, { kindHint: null, lane: myLane }, out);

      // Forward: header south → body north
      const fFrom = { x: hX + header.getCoord(SOUTH_HOOK).x, y: hY + header.getCoord(SOUTH_HOOK).y };
      const fTo = { x: bX + body.getCoord(NORTH_HOOK).x, y: bY + body.getCoord(NORTH_HOOK).y };
      pushEdge(out, new GConnectionVerticalDown().getPoints(fFrom, fTo), laneOut(header, myLane), laneIn(body, myLane));

      // Back: body south → header north, going right
      const backFrom = { x: bX + body.getCoord(SOUTH_HOOK).x, y: bY + body.getCoord(SOUTH_HOOK).y };
      const backTo = { x: hX + header.getCoord(NORTH_HOOK).x, y: hY + header.getCoord(NORTH_HOOK).y };
      const rightMargin = x + t.backEdgeRightX - backFrom.x;
      pushEdge(
        out,
        new GConnectionVerticalDownThenBack(rightMargin).getPoints(backFrom, backTo),
        laneOut(body, myLane),
        laneIn(header, myLane),
      );
      return;
    }

    case 'gtile-repeat': {
      const t = tile as unknown as GtileRepeat;
      const rawChildren = t.children;
      const body = rawChildren[0]!;
      const condition = rawChildren[1]!;
      const backwardBody = rawChildren.length > 2 ? rawChildren[2]! : null;
      const contentCenterX = x + tile.width / 2;

      const bodyX = contentCenterX - body.width / 2;
      const bodyY = y + t.bodyOffsetY;
      walkTile(body, bodyX, bodyY, { kindHint: null, lane: myLane }, out);

      const condX = contentCenterX - condition.width / 2;
      const condY = y + t.conditionOffsetY;

      const fFrom = { x: bodyX + body.getCoord(SOUTH_HOOK).x, y: bodyY + body.getCoord(SOUTH_HOOK).y };
      const fTo = { x: condX + condition.getCoord(NORTH_HOOK).x, y: condY + condition.getCoord(NORTH_HOOK).y };
      pushEdge(
        out,
        new GConnectionVerticalDown().getPoints(fFrom, fTo),
        laneOut(body, myLane),
        laneIn(condition, myLane),
      );

      walkTile(condition, condX, condY, { kindHint: 'repeat-cond', lane: myLane }, out);

      if (backwardBody !== null) {
        const bwX = contentCenterX - backwardBody.width / 2;
        const bwY = y + t.backwardOffsetY!;
        const bwFrom = { x: condX + condition.getCoord(SOUTH_HOOK).x, y: condY + condition.getCoord(SOUTH_HOOK).y };
        const bwTo = { x: bwX + backwardBody.getCoord(NORTH_HOOK).x, y: bwY + backwardBody.getCoord(NORTH_HOOK).y };
        pushEdge(
          out,
          new GConnectionVerticalDown().getPoints(bwFrom, bwTo),
          laneOut(condition, myLane),
          laneIn(backwardBody, myLane),
        );

        walkTile(backwardBody, bwX, bwY, { kindHint: null, lane: myLane }, out);

        const backFrom = { x: bwX + backwardBody.getCoord(SOUTH_HOOK).x, y: bwY + backwardBody.getCoord(SOUTH_HOOK).y };
        const backTo = { x: bodyX + body.getCoord(NORTH_HOOK).x, y: bodyY + body.getCoord(NORTH_HOOK).y };
        const leftMargin = backFrom.x - (x + t.backEdgeLeftX);
        pushEdge(
          out,
          new GConnectionDownThenUp(leftMargin).getPoints(backFrom, backTo),
          laneOut(backwardBody, myLane),
          laneIn(body, myLane),
        );
      } else {
        // Back: condition south → body north, going left
        const backFrom = { x: condX + condition.getCoord(SOUTH_HOOK).x, y: condY + condition.getCoord(SOUTH_HOOK).y };
        const backTo = { x: bodyX + body.getCoord(NORTH_HOOK).x, y: bodyY + body.getCoord(NORTH_HOOK).y };
        const leftMargin = backFrom.x - (x + t.backEdgeLeftX);
        pushEdge(
          out,
          new GConnectionDownThenUp(leftMargin).getPoints(backFrom, backTo),
          laneOut(condition, myLane),
          laneIn(body, myLane),
        );
      }
      return;
    }

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

/**
 * SWIMLANES COUNT TOWARD THE CANVAS TOO (32/268 fixtures once overflowed
 * by up to 216px, `pakema-21-xema183`). T6 replaced the boxed header with
 * real lane origins: the band's right edge (`lanes[0].x + Σwidth - 1`,
 * `swimlane-placement.ts#computeSwimlaneChrome`) is always `lanesRight -
 * 1`, so `lanesRight` alone bounds every drawn X extent. Y is untouched
 * here -- the title-band vertical reservation is folded into `baseY`
 * BEFORE this runs (see `assignCoordinates`'s `contentY`).
 */
function computeBounds(
  root: Tile,
  baseX: number,
  baseY: number,
  placed: PlacementResult,
): { maxX: number; maxY: number } {
  let maxX = baseX + root.width;
  let maxY = baseY + root.height;
  for (const n of placed.nodes) {
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  }
  for (const e of placed.edges) {
    for (const p of e.points) {
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }
  if (placed.swimlanes.length > 0) {
    const lanesRight = Math.max(...placed.swimlanes.map((s) => s.x + s.width));
    maxX = Math.max(maxX, lanesRight);
  }
  return { maxX, maxY };
}

export function assignCoordinates(
  root: Tile,
  ast: ActivityDiagramAST,
  baseX: number,
  baseY: number,
  bounder: StringBounder,
  theme: Theme,
): ActivityGeometry {
  const nodes: ActivityNodeGeo[] = [];
  const edges: ActivityEdgeGeo[] = [];
  const edgeMeta: EdgeMeta[] = [];
  let idCounter = 0;
  const out: Out = { nodes, edges, edgeMeta, nextId: (prefix: string) => `${prefix}-${++idCounter}` };
  const { contentY, titlesHeight } = resolveSwimlaneVertical(ast.swimlanes, baseY, bounder, theme);
  walkTile(root, baseX, contentY, { kindHint: null, lane: undefined }, out);

  const placed = placeSwimlanes({ nodes, edges, edgeMeta, laneNames: ast.swimlanes, baseX, bounder, theme });
  const { maxX, maxY } = computeBounds(root, baseX, contentY, placed);

  return {
    totalWidth: maxX + LAYOUT_MARGIN,
    totalHeight: maxY + LAYOUT_MARGIN,
    nodes: placed.nodes,
    edges: placed.edges,
    swimlanes: placed.swimlanes,
    ...computeSwimlaneChrome(placed.swimlanes, baseY, titlesHeight, maxY),
  };
}
