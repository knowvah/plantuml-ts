/**
 * `ClusterHeader`'s title/stereotype/attribute-text sizing formula — split
 * out of ./state-composite-cluster.ts (G7 T11, 500-line file-cap
 * compliance; pure move of the header-measurement primitives, no behavior
 * change from the split itself). Mirrors that file's own doc note on prior
 * splits (mission A4 Phase L iter 16, state-composite-concurrent.ts).
 *
 * @see ~/git/plantuml/.../svek/ClusterHeader.java
 * @see ~/git/plantuml/.../svek/ClusterDotString.java
 */

import type { FontSpec } from '../../core/measurer.js';
import { splitCreoleLines } from './state-sizing.js';
import type { DiagramCtx } from './state-composite-pass.js';

/** Per-line max-width / summed-height text-block measurement — the shared
 *  primitive behind `measureClusterTitle` (title only) and the
 *  `titleAndAttributeWidth`/`titleAndAttributeHeight` formula below (title +
 *  stereo + attribute terms combined), matching `TextBlockVertical`'s own
 *  dimension convention (`XDimension2D.java:94-98`'s `mergeTB`: width is a
 *  max across lines/blocks, height is a sum) and mirroring
 *  `state-composite-sizing.ts`'s identically-shaped `measureLines` helper
 *  for the autonom shape's own body-text term (duplicated locally rather
 *  than imported — neither module exports it, and it is small enough that
 *  duplicating beats widening either module's public surface for one
 *  extra caller). */
export function measureLines(lines: readonly string[], font: FontSpec, ctx: DiagramCtx): { width: number; height: number } {
  let width = 0;
  let height = 0;
  for (const line of lines) {
    const m = ctx.measurer.measure(line, font);
    if (m.width > width) width = m.width;
    height += m.height;
  }
  return { width, height };
}

/** Title dims for a composite's cluster label (svek's title TABLE — matches
 *  class-dot-graph.ts's namespace-title measurement precedent). `lineCount`
 *  (G5 C3) gates `CLUSTER_TITLE_TABLE_HEIGHT`/`CLUSTER_HEADER_HEIGHT`
 *  eligibility (state-composite-cluster.ts) — jar-verified ONLY for a
 *  single-line title. */
export function measureClusterTitle(display: string, ctx: DiagramCtx): { width: number; height: number; lineCount: number } {
  const font: FontSpec = { family: ctx.theme.fontFamily, size: ctx.theme.fontSize };
  const lines = splitCreoleLines(display);
  const dim = measureLines(lines, font, ctx);
  return { width: dim.width, height: dim.height, lineCount: lines.length };
}

/**
 * `ClusterHeader`'s core height formula (jar constructor,
 * `ClusterHeader.java:73-96`) — see
 * `plans/g6-cluster-geometry/batch-3/title-height-derivation.md` (mission
 * G6 T6) for the full jar-citation derivation and oracle verification
 * table (6/6 exact: 9, 42, 37 across 5 fixture instances).
 *
 * `titleAndAttributeHeight = dimLabel.getHeight() + attributeHeight
 *   + marginForFields + suppHeightBecauseOfShape`
 *
 * `dimLabel` is `mergeTB(stereo, title)` — a vertical STACK (sum of
 * heights, not max; `XDimension2D.java:94-98`), so `(stereoLines +
 * titleLines) * fontSize` reproduces it exactly since both text blocks
 * share the same per-line `height = fontSize` convention this port already
 * uses (`WidthTableMeasurer`, `src/core/measurer.ts:186-193`).
 * `attributeHeight` is the composite's OWN `entry`/`exit`/body description
 * lines (`g.getStateDescription()`, `Entity.java:610-633` — NOT nested
 * children's own bodies), `marginForFields` is `IEntityImage.MARGIN` (5)
 * when any attribute line is present, and `suppHeightBecauseOfShape` is 0
 * for every plain (non-`USymbol`) state composite in this port's corpus
 * (`ClusterHeader.java:87-93` — no USymbol override applies here).
 *
 * `stereoLines`/`stereoWidth` (companion width-side param, below): the
 * `mergeTB(stereo, title)` stacking math cited above is jar-general
 * (`ClusterHeader.java:78-81`'s `getStereoBlock`), but G7 T11 found the
 * caller-supplied VALUE is diagram-type-specific -- for state diagrams
 * specifically, `state-composite-cluster.ts`'s own call site hardcodes both
 * to 0 (verified: `GroupMakerState.java:145` hardcodes `PortionShower.ALL`,
 * whose `getVisibleStereotypeLabels` unconditionally returns
 * `Collections.emptyList()`, `PortionShower.java:51-53`, so
 * `ClusterHeader`'s stereo `TextBlock` is always empty for this diagram
 * type regardless of `s.stereotype` content -- pesita-10-dene726's `AA`,
 * `state AA <<O-O>>`, is the corpus's first titled+stereotyped composite
 * cluster and confirms it: a nonzero `stereoLines` misses the cached
 * oracle's `cluster15ee` `HEIGHT="28"` by +14). These two PARAMETERS stay
 * general (not hardcoded INSIDE this function) for any future diagram type
 * that passes a stereotype-showing `PortionShower` to its own `ClusterHeader`
 * construction -- see `state-composite-cluster.ts`'s own call-site doc
 * comment for the full citation.
 */
const CLUSTER_HEADER_MARGIN = 5;
function titleAndAttributeHeight(titleLines: number, stereoLines: number, attrLines: number, fontSize: number): number {
  const marginForFields = attrLines > 0 ? CLUSTER_HEADER_MARGIN : 0;
  return (stereoLines + titleLines) * fontSize + attrLines * fontSize + marginForFields;
}

/**
 * DOT emission: `HEIGHT = cluster.getTitleAndAttributeHeight() - 5`
 * (`ClusterDotString.java:124`) — the SAME `label` value jar builds ONCE and
 * reuses verbatim whether it lands on the cluster's own `label=` attribute or
 * moves onto the `${id}ee` wrapper (`ClusterDotString.java:121-141` — see
 * `titleAndAttributeWidth`'s own doc comment for the full width-side citation
 * of this reuse). Fed to BOTH `DotInputCluster.labelHeight` (unconditional,
 * every cluster with a title — matches jar's unconditional `ClusterHeader`
 * construction) and `titleTableHeight` (gated by `titleTableEligible`, the
 * port's own FIXEDSIZE-table real-layout subset — state-composite-cluster.ts).
 * Reduces to the pre-G6-T7 pinned constant `9` exactly for the plain
 * single-line-no-attribute case (`titleLines=1, stereoLines=0, attrLines=0,
 * fontSize=14`): `(0+1)*14 - 5 = 9`.
 */
const DOT_TITLE_TABLE_HEIGHT_OFFSET = 5;
export function computeTitleTableHeight(titleLines: number, stereoLines: number, attrLines: number, fontSize: number): number {
  return titleAndAttributeHeight(titleLines, stereoLines, attrLines, fontSize) - DOT_TITLE_TABLE_HEIGHT_OFFSET;
}

/**
 * `ClusterHeader`'s companion WIDTH formula (jar constructor,
 * `ClusterHeader.java:91`, alongside `titleAndAttributeHeight` above):
 *
 * `titleAndAttributeWidth = max(dimLabel.getWidth(), attributeWidth)
 *   + suppWidthBecauseOfShape`
 *
 * `dimLabel.getWidth()` is `mergeTB(stereo, title)`'s width — a HORIZONTAL
 * max, not a sum (`XDimension2D.java:94-98`'s own `mergeTB`: `width =
 * Math.max(...)`, `height = a + b`), i.e. `max(stereoWidth, titleWidth)`,
 * matching `titleAndAttributeHeight`'s own `dimLabel` term one line up.
 * `attributeWidth` is `g.getStateDescription()`'s own text block width — the
 * SAME `s.description` lines `attrLines` above counts, measured with the
 * SAME max-per-line convention as title/stereo (this module's own
 * `measureLines`, identical formula to `state-composite-sizing.ts`'s own
 * body-text width term for the autonom shape). `suppWidthBecauseOfShape` is
 * 0 for every plain (non-`USymbol`) state composite in this port's corpus
 * (`ClusterHeader.java:87-91` — same shape-suppression note
 * `titleAndAttributeHeight`'s own doc comment cites).
 *
 * Jar builds ONE `label` string from this pair
 * (`ClusterDotString.java:121-133`, `SvekEdge.appendTable(sblabel,
 * cluster.getTitleAndAttributeWidth(), cluster.getTitleAndAttributeHeight()
 * - 5, ...)`) and reuses it VERBATIM regardless of routing — whether it
 * lands on the cluster's own `label=` attribute (no border-point children,
 * `ClusterDotString.java:144`) or moves onto the `${id}ee` wrapper's
 * `label=` (border-point children present, state diagrams' own WithLabel
 * branch, `ClusterDotString.java:141` — see `applyBorderPointRanks`'s own
 * doc comment, state-composite-cluster.ts, for why state diagrams never take
 * the NoLabel/`hasPort()` branch). So `labelWidth`/`labelHeight`
 * (state-composite-cluster.ts, fed to BOTH `clusterBlock`'s and
 * `portClusterBlock`'s `label=` emission, `svek-dot-emit.ts`) carry this
 * formula UNCONDITIONALLY, matching jar's own unconditional `ClusterHeader`
 * construction (every group with a title gets one, regardless of
 * border-point routing). `titleTableWidth`/`titleTableHeight` (gated by
 * `titleTableEligible`) are the IDENTICAL values, restricted to the port's
 * own FIXEDSIZE-table real-layout mechanism — a port implementation detail
 * with no jar counterpart (jar computes `ClusterHeader` the same way for
 * every cluster; `titleTable*`'s gating exists only because the real-layout
 * `setHtmlAttr` seam, `graph-layout-build.ts#addClusters`, is not yet wired
 * for border-point composites — deferred to the border-point/frontier
 * wiring effort,
 * `docs/graphviz-issues/08-cluster-scoped-rank-subgraph-bbox.md`).
 *
 * Verified: pesita-10-dene726's `AA` (title "AA" 18.72px, one attribute line
 * "entry / set_timeout()" 116.46px, stereo term forced to 0 per this
 * function's own `stereoLines`/`stereoWidth` doc comment above — `s
 * .stereotype` IS genuinely `"O-O"` for `state AA <<O-O>>`, but state
 * diagrams' `PortionShower.ALL` suppresses it unconditionally) —
 * `max(18.72, 0, 116.46) = 116.46`, truncating (jar's `(int)` cast,
 * `ClusterHeader.java:91`) to 116, matching the cached oracle's
 * `cluster15ee` `WIDTH="116"` exactly; height side —
 * `computeTitleTableHeight(1, 0, 1, 14) = (0+1)*14 + 1*14 + 5 - 5 = 28`,
 * matching the SAME oracle's `cluster15ee` `HEIGHT="28"` exactly
 * (`test-results/dot-cache/state/pesita-10-dene726/svek-3.dot`).
 */
export function titleAndAttributeWidth(titleWidth: number, stereoWidth: number, attrWidth: number): number {
  return Math.max(titleWidth, stereoWidth, attrWidth);
}
