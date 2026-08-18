/**
 * EntityPosition classification (border-point leafs) — a property orthogonal
 * to `StateKind`, faithfully mirroring upstream's TWO independent
 * classification systems that both read the SAME `<<stereotype>>` text:
 *   - `Stereogroup#getLeafType` picks a pseudostate `StateKind`
 *     (choice/fork/join/…) — see `./state-parse-state.ts`'s
 *     `stereotypeToKind`.
 *   - `Entity#getEntityPosition` (Entity.java:327-347) independently derives
 *     an `EntityPosition` (NORMAL/ENTRY_POINT/EXIT_POINT/…) via
 *     `EntityPosition.fromStereotype`, regardless of what Stereogroup says.
 *     `Stereogroup.java` in this checkout recognizes only
 *     choice/fork/join/start/end/history/history* — it has NO
 *     `entrypoint`/`exitpoint` case, so a `state d <<entrypoint>>`
 *     declaration keeps `StateKind:'normal'` (mission A4/T4 fact-4:
 *     resolved the T1/T2 contradiction — entry/exit points are created by
 *     the ORDINARY state-declaration path, not a dedicated command; only
 *     the EntityPosition read of the same stereotype text distinguishes
 *     them at layout time).
 * @see ~/git/plantuml/.../abel/EntityPosition.java
 * @see ~/git/plantuml/.../abel/Entity.java#getEntityPosition (:327-347)
 */

import type { State } from './ast.js';

export type EntityPositionKind =
  | 'normal'
  | 'entrypoint'
  | 'exitpoint'
  | 'inputpin'
  | 'outputpin'
  | 'expansioninput'
  | 'expansionoutput';

/** EntityPosition.fromStereotype (case-insensitive `<<label>>` match) —
 *  reads the stereotype TEXT, so it serves both the AST (`getEntityPosition`)
 *  and the geometry, which carries the same string on `StateNodeGeo
 *  .stereotype` and never the `State` it came from. */
export function positionFromStereotype(stereotype: string | undefined): EntityPositionKind {
  const key = stereotype?.toLowerCase();
  switch (key) {
    case 'entrypoint':
      return 'entrypoint';
    case 'exitpoint':
      return 'exitpoint';
    case 'inputpin':
      return 'inputpin';
    case 'outputpin':
      return 'outputpin';
    case 'expansioninput':
      return 'expansioninput';
    case 'expansionoutput':
      return 'expansionoutput';
    default:
      return 'normal';
  }
}

export function getEntityPosition(state: State): EntityPositionKind {
  return positionFromStereotype(state.stereotype);
}

export function isBorderPoint(state: State): boolean {
  return getEntityPosition(state) !== 'normal';
}

/** EntityPosition.getShapeType() (EntityPosition.java) — `RECTANGLE_PORT`
 *  only for ENTRY_POINT/EXIT_POINT; INPUT_PIN/OUTPUT_PIN/EXPANSION_* stay
 *  plain `RECTANGLE` (`SvekNode#appendShape` only special-cases
 *  `RECTANGLE_PORT`, so those kinds never get the `:P` HTML-port
 *  treatment — and `usePortP()` is false for them too, since state
 *  diagrams never produce PORTIN/PORTOUT via `<<stereotype>>`, only via
 *  the description-diagram's own dedicated port syntax). */
export function usesPortShape(pos: EntityPositionKind): boolean {
  return pos === 'entrypoint' || pos === 'exitpoint';
}

/** `SvekNode#appendLabelHtmlSpecialForPort`'s `width2 > 40` gate — the
 *  border-point's OWN display-text width (`EntityImageStateBorder
 *  #getMaxWidthFromLabelForEntryExit`) decides `shape=plaintext` HTML port
 *  table vs a plain small `shape=rect` square. */
export const PORT_LABEL_WIDE_THRESHOLD = 40;

/** `appendLabelHtmlSpecialForPortHtml`'s `fullWidth < 10` floor — the
 *  blank padding cell width flanking the `PORT="P"` cell. */
export const PORT_TABLE_PAD_FLOOR = 10;

/** EntityPosition.getInputs() — rank=source in the enclosing cluster's port
 *  chain (ClusterDotString.printRanks). */
const INPUT_POSITIONS: ReadonlySet<EntityPositionKind> = new Set([
  'entrypoint',
  'inputpin',
  'expansioninput',
]);

/** EntityPosition.getOutputs() — rank=sink. */
const OUTPUT_POSITIONS: ReadonlySet<EntityPositionKind> = new Set([
  'exitpoint',
  'outputpin',
  'expansionoutput',
]);

export function isInputPosition(pos: EntityPositionKind): boolean {
  return INPUT_POSITIONS.has(pos);
}

export function isOutputPosition(pos: EntityPositionKind): boolean {
  return OUTPUT_POSITIONS.has(pos);
}

/** EntityPosition.RADIUS*2 (RADIUS=6, EntityPosition.java:56) — border-point
 *  box, both axes for ENTRY_POINT/EXIT_POINT/INPUT_PIN/OUTPUT_PIN. Also the
 *  SHORT axis of EXPANSION_INPUT/EXPANSION_OUTPUT's rankdir-swapped box —
 *  see `getBorderPointDimension` below. */
export const BORDER_POINT_SIZE = 12;

/** EntityPosition.RADIUS*2*4 (EntityPosition.java:123,125) — the LONG axis
 *  of EXPANSION_INPUT/EXPANSION_OUTPUT's box only. */
export const EXPANSION_POINT_LONG = 48;

/** `EntityPosition.getDimension(Rankdir)` (EntityPosition.java:120-128) —
 *  every border-point kind is a fixed `BORDER_POINT_SIZE` square EXCEPT
 *  EXPANSION_INPUT/EXPANSION_OUTPUT, which swap wide/tall by rankdir: wide
 *  (48x12) under `TOP_TO_BOTTOM`, tall (12x48) otherwise. SI28
 *  `findings/pseudo-state.md` (bujuta-44-rovo666/mimaga-15-doze740/
 *  nijugi-19-jazi166/rinisi-79-peko570): this port previously stood in
 *  RADIUS*2 for every kind — false, four corpus fixtures exercise the
 *  EXPANSION_* branch. */
export function getBorderPointDimension(
  pos: EntityPositionKind,
  rankdir: 'TB' | 'LR',
): { width: number; height: number } {
  if (pos === 'expansioninput' || pos === 'expansionoutput') {
    return rankdir === 'TB'
      ? { width: EXPANSION_POINT_LONG, height: BORDER_POINT_SIZE }
      : { width: BORDER_POINT_SIZE, height: EXPANSION_POINT_LONG };
  }
  return { width: BORDER_POINT_SIZE, height: BORDER_POINT_SIZE };
}
