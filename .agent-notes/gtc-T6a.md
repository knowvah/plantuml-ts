# gtc-T6a — deroxu family census (2026-10-18)

Fixture: `unknown/deroxu-29-gude369`, 687 structural / 1237 numeric = 1924 paths at
b46586585. Families: `plans/graphviz-tracker-consume/measurements/deroxu-families.json`.

## Observation: one hidden link misaligns 1814 of 1924 diffs
- **Context**: classifying the deroxu render-diff.
- **Finding**: we draw `EEI_BULK -[hidden]-- EEI_PS` (lnk63), so the root `<g>` has
  221 children against the jar's 220. compareSvg LCS-aligns by tag, and every child keys
  `g`. The backtrack leaves OUR first child unmatched, so jar group n is compared with
  our n+1 for n = 1..130. With lnk63 removed (scratch realign), compareSvg gives
  212/43 = 255.
  Java: `SvekResult.java:98` `final UGraphic ug2 = svekEdge.isHidden() ? ug.apply(UHidden.HIDDEN) : ug;`
  and `Link.java:459` `return hidden || cl1.isHidden() || cl2.isHidden();`.
- **Impact**: render-diff counts on any description fixture with a `[hidden]` link are
  dominated by misalignment. Realign before you trust a count. The fix has to keep the
  edge's ink extent (see `layout-helpers-types.ts:223-243`, the reverted attempt).
- **Confidence**: High (measured).

## Observation: `skinparam <<Stereo>> { ... }` block is never collected
- **Context**: <<Public>>/<<Protected>> colours missing.
- **Finding**: `CommandSkinParamMultilines.java:50`
  `^skinparam[%s]*(?:[%s]+([\w.]*(?:\<\<.*\>\>)?[\w.]*))?[%s]*\{$` allows an empty
  name. `SkinLoader.java:101` `final String key = this.getFullParam() + m.group(1);`.
  Our `src/core/preprocessor-collector.ts:73` requires `(\w+)` before `<<`. Probe:
  the flat `ArrowColor<<Public>>` works, the block spelling does not.
- **Impact**: any diagram that uses a stereotype-only skinparam block loses all of it.
- **Confidence**: High (probe c7 vs c8 against the jar).

## Observation: `hide stereotype` drops stereotype-scoped STYLE, not just labels
- **Context**: <<V3>>/<<external>> backgrounds all #FFF.
- **Finding**: `EntityImageDescription.java:151-152`
  `final Stereotype stereotype = entity.getStereotype(); final Style styleTitle = signatureTitle.withTOBECHANGED(stereotype)`,
  while labels use `portionShower.getVisibleStereotypeLabels(entity)` (`:193`). Ours
  stores only the visible labels in `geo.stereotype` (`layout-dot-tree.ts:535-536,578-579`).
- **Impact**: any description fixture with `hide stereotype` plus stereotype skinparams.
- **Confidence**: High (probe c3 vs c5).

## Observation: description dpi/scale rounds twice
- **Context**: textLength diffs of ±0.001 at dpi 60.
- **Finding**: `SvgGraphics.java:468-469` `final double x = xx * option.getScale();` then
  one `%.3f`. The description body is formatted at 1x and then string-rescaled
  (`TextBlockExporter.ts#formatScaledFragmentBody`): 33.5125 → "33.513" → 20.945625 →
  20.946, where the jar prints 20.945. Activity already uses `numbersDeferred`.
- **Impact**: every scaled description fixture can carry ±0.001 textLength diffs.
- **Confidence**: High (arithmetic reproduced with DeterministicMeasurer).

## Observation: trailing link `#color` is captured but ignored
- **Context**: `OS ...> BUS #aaa` draws #181818.
- **Finding**: `CommandLinkElement.java:329`
  `link.setColors(color().getColor(arg, diagram.getSkinParam().getIHtmlColorSet()));`.
  `LINK_LINE_RE` captures `color`, but `parseLinkLine` (link-grammar.ts:428) reads colour only
  from the bracket style.
- **Confidence**: High (probe c1).

## Observation: stereotype tie-break is first-defined upstream
- **Finding**: `StyleStorage.java:49` uses a LinkedHashMap; `Style.java:132`
  `both.put(key, ((ValueImpl) ent.getValue()).mergeWith(previous));`; `DarkString.java:55-57`
  keeps `other` (previous) unless the new value is strictly bigger. Ours: last label wins
  (`theme-element-resolve.ts:51`). Probe c3 cannot separate definition order from label order.
- **Confidence**: Medium (mechanism read; one more jar probe needed).

## Observation: port-cluster min width measures raw display
- **Finding**: `Cluster.java:427-428`
  `frontierCalculator.ensureMinWidth(getTitleAndAttributeWidth() + 10);` and
  `ClusterHeader.java:92` takes the width of the merged multi-line block. Our
  `layout-cluster-boxes.ts:41` calls `measureTitleLabel(c.display, ...)`, which measures
  the literal `\n` title as one line (299 vs the jar's 261).
- **Confidence**: High (numbers match: 188.9+100.4 unscaled + 10).

## Observation: nothing traces into dot-engine
- **Finding**: survey row dotEqual=true, layoutEqual=true. After realignment there are
  0 numeric diffs on any path or polygon; all 43 numerics are canvas, title/legend
  centring, or the ent0174 cluster box. No `dot -Tdot` run was needed.
- **Confidence**: High.
