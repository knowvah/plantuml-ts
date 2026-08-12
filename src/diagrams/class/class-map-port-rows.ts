/**
 * `map`/`json` row-port PRODUCERS -- split out of ./class-port-rows.ts (S-B,
 * pure relocation, no logic change) to keep that file under the repo's
 * 500-line-per-file cap, same split rationale as ./class-object-fields.ts's
 * own module doc (split from ./class-object-sizing.ts) and
 * ./class-shield-helpers.ts's (split from ./class-layout-helpers.ts).
 *
 * ADR-4 (`plans/si20-object-row-ports/decisions.md`): `map`/`json` are a
 * SEPARATE mechanism from the class-family/object row-port producers that
 * stay in `class-port-rows.ts` -- a map leaf's bands come from its flat
 * sizer's `dividerYs`, deliberately NOT from the block-tree composition the
 * class/object path uses (see `classPortRows`' own doc comment there for
 * that path). This module owns the flat-sizer recipe only.
 *
 * `edgePortAttrs` and `applyShapeAndPorts` stay in `class-port-rows.ts` and
 * import {@link mapPortRows}/{@link mapPortName} back from here.
 *
 * @see ~/git/plantuml/.../cucadiagram/TextBlockMap.java
 */

import type { Classifier } from './ast.js';
import type { MeasuredClassifier } from './class-layout-helpers.js';
import type { DotInputPortRow } from '../../core/graph-layout.types.js';
import { Ports } from '../../core/svek/Ports.js';
import { VisibilityModifier } from '../../core/skin/VisibilityModifier.js';

/** `TextBlockMap#getPorts` reports every data row at a FIXED score of 100 —
 *  a map row is never in competition with another report for the same id, so
 *  the score only ever has to beat `Ports#add`'s absent-entry case.
 *  @see cucadiagram/TextBlockMap.java:97 */
const MAP_ROW_PORT_SCORE = 100;

/**
 * The port bands of a `map` leaf, in the row order `TextBlockMap` iterates
 * (its `blocksMap` is a `LinkedHashMap`, so declaration order) — which is also
 * ascending position, the order `Ports#getAllPortGeometry` sorts into.
 *
 * A row's height is the gap to the next row's top; the LAST row runs to the
 * bottom of the box, because `EntityImageMap`'s dimension is exactly
 * `title.height + fieldsHeight` with nothing below the final row
 * (`class-map-sizing.ts#measureMapClassifier`).
 */
export function mapPortRows(
  classifier: Classifier,
  measured: MeasuredClassifier,
): DotInputPortRow[] {
  const rows = classifier.rows ?? [];
  const tops = measured.dividerYs;
  const ports = new Ports();
  for (let i = 0; i < rows.length; i++) {
    const top = tops[i];
    if (top === undefined) continue;
    const bottom = tops[i + 1] ?? measured.height;
    ports.add(mapPortName(rows[i]!.key), MAP_ROW_PORT_SCORE, top, bottom - top);
  }
  return ports.getAllPortGeometry().map((g) => ({
    id: g.getId(),
    position: g.getPosition(),
    height: g.getHeight(),
  }));
}

/** Visibility-prefixed map keys are stripped before they become port names —
 *  `TextBlockMap`'s constructor drops the leading character when
 *  `VisibilityModifier.isVisibilityCharacter(key)`, and `getPorts` then adds
 *  the STRIPPED key, so `+foo` and `foo` encode to the same md5 id. The
 *  predicate is the ALREADY-PORTED `VisibilityModifier.isVisibilityCharacter`
 *  (`core/skin/VisibilityModifier.ts:339`), not a local glyph test: upstream
 *  also rejects any key of length <= 2 and any doubled first character, which
 *  is what keeps `__method1__` an ordinary key.
 *  @see cucadiagram/TextBlockMap.java:82-84 */
export function mapPortName(key: string): string {
  return VisibilityModifier.isVisibilityCharacter(key) ? key.substring(1) : key;
}
