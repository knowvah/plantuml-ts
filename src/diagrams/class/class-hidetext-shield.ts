/**
 * cdd-T22b: `SvekNode.java:220-267`'s `shield()`/`appendLabelHtml` --
 * reserves DOT-node margins around a `hideText` leaf's icon cell (jar:
 * `EntityImageDescription#getShield`, `EntityImageDescription.java:239-262`)
 * so graphviz ranks around the padded shield table rather than the bare
 * icon cell. Reads the symbol position back from the padded table
 * (`DotStringFactory#solve`). Wires
 * `class-layout-leaf-shapes.ts#measureCircleInterfaceShield` into
 * `DotInputNode.shieldMargins`, reusing T15's generic `graph-layout.ts
 * #portNodeSize`/`shieldCorner` reconciliation unchanged (built for
 * `class-kal.ts`'s qualifier margins; this is its second consumer).
 *
 * Split into its own module rather than folded into `class-dot-graph.ts`
 * (already over this project's 500-line cap) or `class-shield-helpers.ts`
 * (needs `class-dot-edges.ts#EDGE_DECORATION_MAP` for the decor-default
 * fallback below, and `class-dot-edges.ts` -> `class-port-rows.ts` ->
 * `class-shield-helpers.ts` is already a real edge — importing
 * `EDGE_DECORATION_MAP` back into `class-shield-helpers.ts` would cycle).
 */

import type { ClassDiagramAST } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { DotInputNode } from '../../core/graph-layout.js';
import type { EntityImageDescriptionLinkInfo } from '../../core/svek/image/EntityImageDescription.js';
import { measureCircleInterfaceShield } from './class-layout-leaf-shapes.js';
import { EDGE_DECORATION_MAP } from './class-dot-edges.js';
import { spriteDimsLookupFor } from '../../core/sprite-commands.js';

type ShieldMargins = NonNullable<DotInputNode['shieldMargins']>;

/**
 * `EntityImageDescription`'s `Collection<Link> links` ctor param -- upstream
 * passes every link touching this leaf UNFILTERED and filters with
 * `link.contains(leaf)` inside each of the three scan helpers
 * (`EntityImageDescription.java:264-292`); this port's
 * `EntityImageDescriptionLinkInfo[]` is pre-filtered (that interface's own
 * doc comment), so the filter happens here, once, per leaf.
 *
 * `sourceDecor`/`targetDecor` fall back to `EDGE_DECORATION_MAP[rel.type]`
 * (the type-derived default) when a relationship carries neither, mirroring
 * `class-edge-group-inheritance.ts`'s identical `rel.sourceDecor ?? decor
 * .sourceDecor` pattern -- `LinkType#isDoubleDecorated` (`decoration/
 * LinkType.java:51-53`) always reads a FULLY resolved decor pair upstream.
 * `length` defaults to 2 (`rel.length ?? 2`, matching every other reader of
 * this optional field -- `class-dot-edges.ts`/`class-kal.ts`/
 * `class-namespace-resolve.ts#effectiveLength`).
 */
/** One relationship's `EntityImageDescriptionLinkInfo`, from `id`'s own
 *  side -- split out of {@link linksTouching} purely to keep that loop's
 *  own CCN under the project's per-function cap. */
function toLinkInfo(rel: ClassDiagramAST['relationships'][number], isFrom: boolean): EntityImageDescriptionLinkInfo {
  const decor = EDGE_DECORATION_MAP[rel.type];
  const sourceDecor = rel.sourceDecor ?? decor.sourceDecor;
  const targetDecor = rel.targetDecor ?? decor.targetDecor;
  return {
    length: rel.length ?? 2,
    otherEntityId: isFrom ? rel.to : rel.from,
    isInvis: rel.invis === true,
    isDoubleDecorated: sourceDecor !== 'none' && targetDecor !== 'none',
  };
}

function linksTouching(ast: ClassDiagramAST, id: string): EntityImageDescriptionLinkInfo[] {
  const links: EntityImageDescriptionLinkInfo[] = [];
  for (const rel of ast.relationships) {
    if (rel.from === id) links.push(toLinkInfo(rel, true));
    else if (rel.to === id) links.push(toLinkInfo(rel, false));
  }
  return links;
}

/**
 * `hideText`-eligible leaf ids -> the DOT `shieldMargins` upstream reserves
 * around their icon cell. Scoped to `kind: 'circle'` -- the only classifier
 * kind this port routes to `EntityImageDescription` with `USymbols
 * .INTERFACE` (`hideText = true`, `EntityImageDescription.java:137`; see
 * `class-layout-leaf-shapes.ts#measureCircleInterface`'s own doc comment).
 *
 * A node is omitted (stays a plain `fixedsize` box) unless its margins are
 * non-zero OR `skinparam fixCircleLabelOverlapping` is set --
 * `SvekNode#appendShape` (`svek/SvekNode.java:132-155`) only ever draws the
 * HTML shield table for `RECTANGLE_WITH_CIRCLE_INSIDE` (that skinparam,
 * unconditional) or `RECTANGLE && isShielded()` (`shield().isZero() ==
 * false`, `svek/SvekNode.java:383-393`); the plain `RECTANGLE` branch never
 * emits one.
 */
export function hideTextShieldMarginsByEntity(
  ast: ClassDiagramAST,
  theme: Theme,
  measurer: StringMeasurer,
): ReadonlyMap<string, ShieldMargins> {
  const out = new Map<string, ShieldMargins>();
  const forceTable = theme.fixCircleLabelOverlapping === true;
  const spriteDims = ast.sprites !== undefined ? spriteDimsLookupFor(ast.sprites) : undefined;
  for (const classifier of ast.classifiers) {
    if (classifier.kind !== 'circle') continue;
    const links = linksTouching(ast, classifier.id);
    const shield = measureCircleInterfaceShield(classifier.display, theme, measurer, spriteDims, links);
    if (shield.isZero() && !forceTable) continue;
    out.set(classifier.id, { x1: shield.getX1(), x2: shield.getX2(), y1: shield.getY1(), y2: shield.getY2() });
  }
  return out;
}
