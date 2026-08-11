/**
 * `Ports` production for the class engine's `RECTANGLE_HTML_FOR_PORTS` leaves —
 * the DOT-input half of `SvekNode#appendLabelHtmlSpecialForLink`'s
 * `((WithPorts) image).getPorts(stringBounder)` call
 * (svek/SvekNode.java:269).
 *
 * Upstream reaches the bands through the live `TextBlock` tree: `TextBlockMap`
 * reports one band per data row (`cucadiagram/TextBlockMap.java:93-105`) and
 * the enclosing `TextBlockVertical`/`TextBlockMarged` wrappers translate them
 * down by the title height (`klimt/shape/TextBlockMarged.java#getPorts`). This
 * engine measures maps through `class-map-sizing.ts` rather than through that
 * block tree, so the bands are read off the numbers that sizer already
 * produced — `dividerYs[i]` IS the row top in the same box-relative frame
 * `PortGeometry#getPosition` uses, because `buildMapRowGeo` seeds its cursor
 * with `title.height` and advances it by each row's own measured height.
 *
 * The `Ports` model itself is NOT re-implemented here: ids come from the
 * ported `Ports#encodePortNameToId` (`core/svek/Ports.ts`), whose md5 output is
 * jar-verified against the oracle DOT for `method3`, `__method1__`, `method2`,
 * `USA` and `3`.
 */

import type { Classifier, ClassifierKind } from './ast.js';
import type { MeasuredClassifier } from './class-layout-helpers.js';
import type { DotInputNode, DotInputPortRow } from '../../core/graph-layout.types.js';
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

/**
 * The `tailport`/`headport` a relationship contributes when its `Class::member`
 * endpoint names a row on a `RECTANGLE_HTML_FOR_PORTS` node — `abel/Link.java
 * :219-231` threads the port name onto the endpoint and the DOT statement comes
 * out as `sh0006:p48c4…->sh0007:pcb85…`. `map key *-> dest` rows reach the same
 * place: `CommandCreateMap.java:191` sets the port from the row key, which
 * `class-map-commands.ts:362` mirrors as `fromPort`.
 *
 * `swap` is this port's own concern, not upstream's: `ranksParentFirst` may
 * emit the DOT edge parent-first, and the ports have to follow the endpoints
 * they belong to. Gated on `portRowIds` so a `::member` endpoint on an ordinary
 * box classifier (whose members are not port bands) contributes nothing.
 */
export function edgePortAttrs(
  rel: { fromPort?: string; toPort?: string },
  swap: boolean,
  from: string,
  to: string,
  portRowIds: ReadonlySet<string>,
): { tailport?: string; headport?: string } {
  const tailName = swap ? rel.toPort : rel.fromPort;
  const headName = swap ? rel.fromPort : rel.toPort;
  const out: { tailport?: string; headport?: string } = {};
  if (tailName !== undefined && portRowIds.has(from)) {
    out.tailport = Ports.encodePortNameToId(mapPortName(tailName));
  }
  if (headName !== undefined && portRowIds.has(to)) {
    out.headport = Ports.encodePortNameToId(mapPortName(headName));
  }
  return out;
}

/** Classifier kind → non-default svek node shape (everything else → rect). */
const KIND_SHAPE: Partial<Record<ClassifierKind, DotInputNode['shape']>> = {
  association: 'diamond', // `<> name` (CommandDiamondAssociation)
  'assoc-circle': 'circle', // `(A,B) .. C` connector on the A–B association
  circle: 'plaintext', // `circle Foo` / `() name` — the small circle table
  usecase: 'ellipse', // `usecase Foo` (LeafType.USECASE)
  state: 'rounded', // `state Foo` (LeafType.STATE, classdiagram-only ALL_TYPES superset)
  lollipop: 'circle', // `Name ()-- Existing` (CommandLinkLollipop)
  map: 'plaintext', // `map Name { ... }` — EntityImageMap.getShapeType is
  // ALWAYS RECTANGLE_HTML_FOR_PORTS (never a plain rect, even with zero rows).
  json: 'plaintext', // `json Name { ... }` — EntityImageJson.getShapeType is
  // the SAME RECTANGLE_HTML_FOR_PORTS shape as map, ALWAYS (even scalar/empty).
};

/**
 * A map/json's `shape=plaintext` is EntityImageMap/EntityImageJson's own
 * per-row shield table (svek's RECTANGLE_HTML_FOR_PORTS), NOT the qualifier/
 * `::member` port-shield mechanism this flag drives (svek-dot-emit.ts's
 * portTable — a single compass-point "P" cell, wrong shape for either). A map
 * row link (class-map-commands.ts) sets `fromPort` on its relationship purely
 * as row-target metadata; it must not flip this flag even though
 * shieldedClassifierIds sees the same relationship.
 */
function shouldMarkPort(shape: DotInputNode['shape'] | undefined, isShieldedPort: boolean, kind: ClassifierKind): boolean {
  return shape === 'plaintext' && isShieldedPort && kind !== 'map' && kind !== 'json';
}

/** Svek shape selection plus the two port mechanisms riding on it: the `:P`
 *  compass shield (`isPort`) and B1/M1's row bands (`portRows`). Split out of
 *  `class-dot-graph.ts#buildOneDotNode` for that function's CCN budget. */
export function applyShapeAndPorts(
  node: DotInputNode,
  classifier: Classifier,
  measured: MeasuredClassifier,
  shield: { isPort: boolean } | undefined,
): void {
  const shape = KIND_SHAPE[classifier.kind] ?? (shield !== undefined ? 'plaintext' : undefined);
  if (shape !== undefined) node.shape = shape;
  if (shouldMarkPort(shape, shield?.isPort === true, classifier.kind)) node.isPort = true;
  // A map is RECTANGLE_HTML_FOR_PORTS unconditionally (EntityImageMap
  // #getShapeType, svek/image/EntityImageMap.java:245-247) -- even with zero
  // rows, which is what makes `map map0` a row table with a lone trailer row
  // rather than a shield. `portRows` being PRESENT (not its length) is what
  // switches the emitter and the layout adapter over.
  if (classifier.kind === 'map') node.portRows = mapPortRows(classifier, measured);
}
