/**
 * Edge-label anchoring for the class engine: converting the CENTER points
 * `core/graph-layout.ts` extracts into the left/baseline anchors jar's
 * `<text>` elements carry, and applying the port-label collision pass that
 * sits between the two.
 *
 * Split out of `class-edge-geo.ts` when adding `manageCollision` pushed
 * that file past the 500-line limit; the four functions here were already
 * one cluster (`multiLineLabelAnchor` and `attachPortLabels` are both
 * documented in terms of `portLabelAnchor`'s formula).
 */
import type { Relationship } from './ast.js';
import type { DotLayoutResult } from '../../core/graph-layout.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { CARDINALITY_FONT_SIZE } from './class-layout-helpers.js';
import type { EdgeGeo } from './layout.js';
import type { Positionable } from '../../core/klimt/geom/Positionable.js';
import { PositionableImpl } from '../../core/klimt/geom/PositionableImpl.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import { addMargin, intersect, moveAwayFrom } from '../../core/klimt/geom/PositionableUtils.js';

/**
 * G2 item 43: lay out a `\n`/`\l`/`\r`-split edge label as one `<text>`
 * per line, generalizing `portLabelAnchor`'s single-line CENTER-to-left/
 * baseline conversion (reduces to the EXACT SAME formula when `lines.length
 * === 1`, verified algebraically below). Jar draws every line via ONE
 * `TextBlock` translated as a whole to `labelXY`'s top-left corner
 * (`SvekEdge.java:953`, `Display#create0`) -- each line is then
 * individually positioned WITHIN that block's own max-line-width per the
 * block's resolved `HorizontalAlignment` (default CENTER, or LEFT/RIGHT
 * when the label carried a trailing `\l`/`\r` -- {@link
 * splitEdgeLabelLines}). Jar-verified byte-exact SHAPE against
 * `sicile-99-pefa679`'s 3 sibling edges (identical 3-line text, one
 * alignment mode each): the block's LEFT edge sits at the SAME x for every
 * mode (`center.x - maxWidth/2`), and each line offsets from that left
 * edge by `0` (LEFT), `maxWidth-lineWidth` (RIGHT), or
 * `(maxWidth-lineWidth)/2` (CENTER) -- exactly `portLabelAnchor`'s own
 * `center.x - width/2` formula generalized from a single `width` to the
 * block's `maxWidth`. Line spacing is `CARDINALITY_FONT_SIZE` (13) exactly
 * -- jar's real per-line `y` delta on every sampled fixture. `totalHeight`
 * folds the extra `(lines.length-1)` rows into the SAME single-line
 * `m.height`/`baselineOffset` formula `portLabelAnchor` already uses, so at
 * `lines.length === 1` this function's `x`/`y` are algebraically identical
 * to `portLabelAnchor`'s. Still bound by the SAME gvts-genuine
 * label-placement residual N25/N62 already named (@knowvah/dot-engine's own
 * box-center doesn't match jar's sub-pixel placement) -- structurally
 * correct, not guaranteed byte-exact.
 */
export function multiLineLabelAnchor(
  lines: string[],
  align: 'center' | 'left' | 'right',
  center: { x: number; y: number },
  measurer: StringMeasurer,
  fontFamily: string,
): Array<{ text: string; x: number; y: number; width: number }> {
  const font = { family: fontFamily, size: CARDINALITY_FONT_SIZE };
  const widths = lines.map((l) => measurer.measure(l, font).width);
  const maxWidth = Math.max(...widths);
  const blockLeft = center.x - maxWidth / 2;
  const firstLine = lines[0] ?? '';
  const m0 = measurer.measure(firstLine, font);
  const baselineOffset = CARDINALITY_FONT_SIZE - measurer.getDescent(font, firstLine);
  const totalHeight = (lines.length - 1) * CARDINALITY_FONT_SIZE + m0.height;
  const blockTop = center.y - totalHeight / 2;
  return lines.map((text, i) => {
    const width = widths[i]!;
    const offset = align === 'left' ? 0 : align === 'right' ? maxWidth - width : (maxWidth - width) / 2;
    return {
      text,
      x: blockLeft + offset,
      y: blockTop + baselineOffset + i * CARDINALITY_FONT_SIZE,
      width,
    };
  });
}

/** Every node grows by this much on each side before the port-label
 *  overlap test -- upstream inlines it as `addMargin(sh, 8, 8)`
 *  (`svek/SvekEdge.java:1207`). */
const PORT_LABEL_COLLISION_MARGIN = 8;

/**
 * `SvekEdge#manageCollision` (`svek/SvekEdge.java:1205-1216`): push a port
 * label clear of every node it overlaps, each node first grown by
 * `PORT_LABEL_COLLISION_MARGIN` on all sides.
 *
 * This is what makes port-label placement PER-END despite both ends
 * sharing one assignment path (`:750-767`, differing only in the colour
 * key handed to `getXY`) and one draw path (`:956-980`). The per-end
 * difference is not a formula: `moveAwayFrom` slides the label along the
 * node-centre -> label-centre ray, so a tail label sitting BELOW its node
 * is pushed further down and a head label sitting ABOVE its node is
 * pushed further up. Opposite-signed y corrections, one rule. It also
 * produces the large, non-constant x corrections that come along for the
 * ride whenever that ray is far from vertical.
 *
 * Upstream runs this as a separate pass over all lines x all nodes AFTER
 * every line is solved (`DotStringFactory.java:466`). Running it inline
 * per-edge here is equivalent, not a shortcut: the pass only READS node
 * geometry, which no edge mutates, and each label is moved independently
 * of every other label.
 *
 * Node ORDER is load-bearing and must stay the layout result's own: the
 * loop reassigns the label as it goes, so a label pushed clear of one node
 * can be pushed again by a later one, and a different order can reach a
 * different fixed point.
 */
function manageCollision(box: Positionable, nodes: DotLayoutResult['nodes']): Positionable {
  let current = box;
  for (const n of nodes) {
    const sh = new PositionableImpl(n.x, n.y, new XDimension2D(n.width, n.height));
    const cl = addMargin(sh, PORT_LABEL_COLLISION_MARGIN, PORT_LABEL_COLLISION_MARGIN);
    if (intersect(cl, current)) current = moveAwayFrom(cl, current);
  }
  return current;
}

/**
 * Convert a `graph-layout.ts#extractPortLabelPositions` CENTER point into
 * the left/baseline anchor jar's own `<text>` emits (no `text-anchor`/
 * `dominant-baseline` attribute at all -- unlike the pre-existing `label`
 * center-label render, which uses `dominant-baseline:middle`, this mirrors
 * every OTHER text element in this engine's own established convention,
 * `class-member-rows.ts`'s doc comment: "un-centered `<text>`... `y =
 * lineTop + baselineOffset`"). `measurer`/`CARDINALITY_FONT_SIZE` give the
 * SAME box @knowvah/dot-engine itself measured the text with (`core/graph-layout.ts
 * #addEdges`'s `labelfontsize`), so the conversion is self-consistent.
 *
 * The CENTER -> box top-left step is upstream's `getXY` (`SvekEdge.java:
 * 808-815`), which takes the MINIMUM x/y of the reserved marker polygon;
 * `PositionableImpl.create(pt, dim)` then stores that corner verbatim with
 * no re-centring (`PositionableImpl.java:44-52`), and the draw adds the
 * ascent (`SvekEdge.java:956-980`).
 */
export function portLabelAnchor(
  text: string,
  center: { x: number; y: number },
  measurer: StringMeasurer,
  fontFamily: string,
  // Tail/head labels ONLY -- `manageCollision` tests `startTailText`/
  // `endHeadText` and never `labelXY`, so the CENTRE label is deliberately
  // left un-pushed even when it overlaps a node. Omitted at those call
  // sites, which is what keeps that upstream asymmetry visible here.
  collisionNodes?: DotLayoutResult['nodes'],
): { text: string; x: number; y: number; width: number } {
  const font = { family: fontFamily, size: CARDINALITY_FONT_SIZE };
  const m = measurer.measure(text, font);
  const baselineOffset = CARDINALITY_FONT_SIZE - measurer.getDescent(font, text);
  // G2 N35 (superseded by ADR-1): the `19.418750000000003` vs jar's
  // `19.4188` mismatch that once motivated pre-rounding this width is now
  // resolved at emission -- `core/svg.ts` formats every numeric attribute
  // through `formatDecimal(value, 3)` (T5), so this raw float reaches the
  // same jar-matching output without a class-engine-local round-trip.
  const width = m.width;
  // The box is a HYBRID, and deliberately so: its CORNER comes from the
  // reservation graphviz laid out, whose dims jar TRUNCATED to whole pixels
  // (`appendTable`'s `(int)` cast, SvekEdge.java:505-506 — mirrored in
  // `graph-layout-build-edges.ts#fixedSizeTable`), while its SIZE is the
  // untruncated text measurement, because that is what
  // `TextBlockUtils.asPositionable(forSize, ...)` stores alongside
  // `getXY`'s corner (`SvekEdge.java:750-767`). Using `width` for both
  // would offset every port label by half the truncation remainder.
  const box = new PositionableImpl(
    center.x - Math.trunc(width) / 2,
    center.y - Math.trunc(m.height) / 2,
    new XDimension2D(width, m.height),
  );
  const placed = collisionNodes === undefined ? box : manageCollision(box, collisionNodes);
  const pos = placed.getPosition();
  return {
    text,
    x: pos.getX(),
    y: pos.getY() + baselineOffset,
    width,
  };
}

/** Text metrics plus the node set port labels are pushed clear of. */
export interface PortLabelContext {
  readonly measurer: StringMeasurer;
  readonly fontFamily: string;
  /** The collision set -- see `portLabelAnchor`'s `collisionNodes`. */
  readonly nodes: DotLayoutResult['nodes'];
}

/** Attach `tailLabel`/`headLabel` (G2/N25) if `graph-layout.ts` computed a
 *  position for them -- absent when the relationship carries no
 *  `fromMultiplicity`/`toMultiplicity` (`edgeLabelAttrs` then never set
 *  `tailLabel`/`headLabel` on the DOT input, so `extractPortLabelPositions`
 *  never ran for this edge). */
export function attachPortLabels(
  edgeGeo: EdgeGeo,
  rel: Relationship,
  edgeResult: DotLayoutResult['edges'][number],
  ctx: PortLabelContext,
): void {
  const { measurer, fontFamily, nodes } = ctx;
  if (rel.fromMultiplicity !== undefined && edgeResult.tailLabelX !== undefined && edgeResult.tailLabelY !== undefined) {
    edgeGeo.tailLabel = portLabelAnchor(
      rel.fromMultiplicity, { x: edgeResult.tailLabelX, y: edgeResult.tailLabelY }, measurer, fontFamily, nodes,
    );
  }
  if (rel.toMultiplicity !== undefined && edgeResult.headLabelX !== undefined && edgeResult.headLabelY !== undefined) {
    edgeGeo.headLabel = portLabelAnchor(
      rel.toMultiplicity, { x: edgeResult.headLabelX, y: edgeResult.headLabelY }, measurer, fontFamily, nodes,
    );
  }
}
