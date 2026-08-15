/**
 * `ClusterHeader`'s title/stereotype/attribute-text-height formula — moved
 * out of `../diagrams/state/state-composite-header.ts` (namespace-cluster-box
 * mission T3: the class engine needs the same formula for its own cluster
 * title table, and no other seam in this codebase makes one diagram engine
 * import from another — CLAUDE.md). Pure move, no behavior change.
 *
 * @see ~/git/plantuml/.../svek/ClusterHeader.java
 * @see ~/git/plantuml/.../svek/ClusterDotString.java
 */

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
