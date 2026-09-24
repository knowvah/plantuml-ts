/**
 * cdd2-T12 (Q-7) — spreading apart the qualifier boxes on one side of one
 * entity. Ports, whole:
 *
 *  - `svek/LineOfSegments.java` (the 1-D overlap solver);
 *  - `Kal#getX1`/`getX2`/`overlapx`/`moveX` (`svek/Kal.java:151-157,
 *    188-216`);
 *  - `SvekNode#fixOverlap`/`fixHoverlap` (`svek/SvekNode.java:445-463`).
 *
 * Upstream runs it from `SvekResult#computeKal` (`svek/SvekResult.java:
 * 104-109`): first every edge's `computeKal` anchors its boxes (this port's
 * `class-edge-geo.ts#attachKalBoxes`), THEN every node's `fixOverlap`
 * spreads its DOWN list and its UP list. So {@link fixKalOverlaps} runs once,
 * after every edge is built.
 *
 * `moveX` moves the box (`translate.compose(dx)`) and — only when the box's
 * entity is the link's `entity1` — the link's start point through
 * `SvekEdge#moveStartPoint` (`SvekEdge.java:1346-1349`, i.e.
 * `DotPath#moveStartPoint`, removal branch included). An UP box (entity2)
 * moves alone; the link end stays put.
 */
import type { EdgeGeo } from './layout.js';
import type { Kal, KalBox, KalPosition } from './class-kal.js';
import { movePointsStart } from './renderer-arrowhead-move.js';

/** `LineOfSegments.Segment` (`LineOfSegments.java:44-73`). */
class Segment {
  readonly idx: number;
  middle: number;
  readonly halfSize: number;

  constructor(idx: number, x1: number, x2: number) {
    this.idx = idx;
    this.middle = (x1 + x2) / 2;
    this.halfSize = (x2 - x1) / 2;
  }

  /** `Segment#overlap` (`:61-68`). */
  overlap(other: Segment): number {
    const distance = other.middle - this.middle;
    if (distance < 0) throw new Error('LineOfSegments.Segment#overlap: segments out of order');
    const diff = distance - this.halfSize - other.halfSize;
    if (diff > 0) return 0;
    return -diff;
  }

  push(delta: number): void {
    this.middle += delta;
  }
}

/**
 * `svek/LineOfSegments.java` — pushes overlapping segments right until they
 * abut, then re-centres the whole set on its original mean.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/LineOfSegments.java
 */
export class LineOfSegments {
  private readonly all: Segment[] = [];

  addSegment(x1: number, x2: number): void {
    this.all.push(new Segment(this.all.length, x1, x2));
  }

  getMean(): number {
    let sum = 0;
    for (const seg of this.all) sum += seg.middle;
    return sum / this.all.length;
  }

  /** `solveOverlapsInternal` (`:89-96`) — `Collections.sort` is stable, as
   *  is `Array#sort`. */
  private solveOverlapsInternal(): void {
    if (this.all.length < 2) return;
    this.all.sort((a, b) => a.middle - b.middle);
    for (let i = 0; i < this.all.length; i++) if (!this.oneLoop()) return;
  }

  /** `oneLoop` (`:98-111`) — fixes the right-most overlapping pair only. */
  private oneLoop(): boolean {
    for (let i = this.all.length - 2; i >= 0; i--) {
      const overlap = this.all[i]!.overlap(this.all[i + 1]!);
      if (overlap > 0) {
        for (let k = i + 1; k < this.all.length; k++) this.all[k]!.push(overlap);
        return true;
      }
    }
    return false;
  }

  /** `solveOverlaps` (`:113-126`) — each segment's new `x1`, by insertion
   *  index. */
  solveOverlaps(): number[] {
    const mean1 = this.getMean();
    this.solveOverlapsInternal();
    const mean2 = this.getMean();
    const diff = mean1 - mean2;
    if (diff !== 0) for (const seg of this.all) seg.push(diff);
    const result = new Array<number>(this.all.length).fill(0);
    for (const seg of this.all) result[seg.idx] = seg.middle - seg.halfSize;
    return result;
  }
}

/** `Kal#getX1` (`Kal.java:151-153`): `getTranslate().getDx() - 5` — the
 *  drawn box's own `x` IS `getTranslate().getDx()`. */
export function kalX1(box: Pick<KalBox, 'x'>): number {
  return box.x - 5;
}

/** `Kal#getX2` (`Kal.java:155-157`): `getX1() + dim.getWidth() + 10`. */
export function kalX2(box: Pick<KalBox, 'x' | 'width'>): number {
  return kalX1(box) + box.width + 10;
}

/**
 * `Kal#overlapx` (`Kal.java:188-201`). Upstream has no caller (grep of
 * `src/main/java/net/`); ported with its class, per this project's
 * whole-method discipline.
 */
export function kalOverlapX(self: Pick<KalBox, 'x' | 'width' | 'position'>, other: typeof self): number {
  if (self.position !== other.position) throw new Error('Kal#overlapx: boxes on different sides');
  const [s1, s2, o1, o2] = [kalX1(self), kalX2(self), kalX1(other), kalX2(other)];
  if (o1 >= s1 && o1 <= s2) return s2 - o1;
  if (o2 >= s1 && o2 <= s2) return s1 - o2;
  if (s1 >= o1 && s1 <= o2) return o2 - s1;
  if (s2 >= o1 && s2 <= o2) return o1 - s2;
  return 0;
}

/** One placed `Kal`: its box and the edge that owns it. */
export interface PlacedKal {
  readonly kal: Kal;
  readonly edge: EdgeGeo;
  /** `link.getEntity1() == entity` (`Kal.java:213`) — `kal1` always; `kal2`
   *  only on a self link. */
  readonly onEntity1: boolean;
}

function boxOf(p: PlacedKal): KalBox {
  const boxes = p.edge.kalBox!;
  return (p.kal.end === 1 ? boxes.start : boxes.end)!;
}

/** `Kal#moveX` (`Kal.java:210-216`). */
function kalMoveX(p: PlacedKal, dx: number): void {
  if (dx === 0) return;
  const box = boxOf(p);
  const moved = { ...box, x: box.x + dx, textX: box.textX + dx };
  p.edge.kalBox = p.kal.end === 1 ? { ...p.edge.kalBox, start: moved } : { ...p.edge.kalBox, end: moved };
  if (p.onEntity1) p.edge.points = movePointsStart(p.edge.points, dx, 0);
}

/** `SvekNode#fixHoverlap` (`SvekNode.java:453-463`). */
function fixHoverlap(list: readonly PlacedKal[]): void {
  const los = new LineOfSegments();
  for (const p of list) los.addSegment(kalX1(boxOf(p)), kalX2(boxOf(p)));
  const res = los.solveOverlaps();
  list.forEach((p, i) => kalMoveX(p, res[i]! - kalX1(boxOf(p))));
}

const SPREAD_SIDES: readonly KalPosition[] = ['DOWN', 'UP'];

/**
 * `SvekResult#computeKal`'s second loop (`SvekResult.java:107-108`):
 * `SvekNode#fixOverlap` (`SvekNode.java:445-451`) for every entity — its
 * DOWN list, then its UP list, each in `Entity#addKal` order (link order,
 * `kal1` before `kal2` — the order `placed` arrives in). Mutates each
 * edge's `kalBox` and, for an entity1 box, its `points`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekNode.java
 */
export function fixKalOverlaps(placed: readonly PlacedKal[]): void {
  const entities = [...new Set(placed.map((p) => p.kal.entityId))];
  for (const entityId of entities) {
    for (const side of SPREAD_SIDES) {
      fixHoverlap(placed.filter((p) => p.kal.entityId === entityId && p.kal.position === side));
    }
  }
}
