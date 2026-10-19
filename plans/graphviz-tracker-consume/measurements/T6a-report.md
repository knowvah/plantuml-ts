# T6a — deroxu family census

No commit (orchestrator commits). Files written:
- `plans/graphviz-tracker-consume/measurements/deroxu-families.json` (new)
- `.agent-notes/gtc-T6a.md` (new)
No `src/` edits. Scratch scripts are only in `/private/tmp/claude-501/gtc-T6a/`.

## Measurement
- `render-diff unknown/deroxu-29-gude369` at b46586585: **687 structural / 1237 numeric = 1924 paths** (same as the orchestrator's count).
- Realigned compare (our SVG with the extra hidden link lnk63 removed, then compareSvg): **212 / 43 = 255** (`latentCount`). This is the residual after the hidden-link fix, and it is the better order for T6b.
- Survey row: dotEqual=true, layoutEqual=true. After realignment, no path or polygon has a numeric diff, so **nothing traces into dot-engine** and no `dot -Tdot` was needed.
- The planned "title/legend order" family is gone: both sides draw title then legend. The first diffs only looked that way because of the LCS shift.

## Families (non-cascade first, by count desc; latent = after the lnk63 realign)

| family | count | latent | cascadeOf | javaRef | touchesCore | est. write-set |
|---|---|---|---|---|---|---|
| stereo-only-skinparam-block | 66 | 78 | — | CommandSkinParamMultilines.java:50; SkinLoader.java:78-80,101; SkinParam.java:292-297 | yes | src/core/preprocessor-collector.ts (:73 opener regex) + test |
| inline-link-colour-dropped | 18 | 18 | — | descdiagram/command/CommandLinkElement.java:118,329 | no | src/diagrams/description/link-grammar.ts (parseLinkLine ignores `g.color`) |
| dpi-scale-double-rounding | 11 | 30 | — | SvgGraphics.java:468-475; DriverTextSvg.java:126-127 | likely | src/diagrams/description/{index,renderer}.ts (opt into `numbersDeferred`, as activity does); maybe src/core/assemble-svg.ts |
| stereo-font-and-interface-border-keys | 9 | 16 | — | FromSkinparamToStyle.java:149,213,215,270-283,292-302 | yes | src/core/skinparam-stereo-keys.ts, theme-element-resolve.ts, theme types; description renderer-entity.ts, renderer-edge.ts |
| cluster-stereo-shadowing | 1 | 18 | — | Cluster.java:314-315,384-390; FromSkinparamToStyle.java:282,306-310 | yes | src/core/skinparam-stereo-keys.ts, theme-element-resolve.ts (:167 has no stereo); description renderer-cluster.ts:218 |
| hidden-link-drawn | 1 | 0 | — | WithLinkType.java:100-101,149-150; Link.java:458-459; SvekResult.java:97-100; UGraphicSvg.java:102-109 | no (maybe SvekEdge.ts) | description layout-geo-post.ts, layout-helpers-types.ts, renderer-draw-sequence.ts, renderer-ink-extent.ts |
| hide-stereotype-drops-stereo-style | 0 | 48 | — | EntityImageDescription.java:151-159,193; Cluster.java:364,389; net/atmp/CucaDiagram.java:574-598 | no | description layout-dot-tree.ts (:275,535,578), layout-helpers-types.ts, renderer-entity.ts, renderer-cluster.ts |
| port-cluster-title-min-width | 0 | 5 | — | Cluster.java:261-263,427-428; ClusterHeader.java:79-92 | no | description layout-cluster-boxes.ts (:41), layout.ts |
| multi-stereotype-tie-order | 0 | 4 | — | StyleStorage.java:49,102-115; Style.java:121-134; DarkString.java:50-57 | yes | src/core/theme-element-resolve.ts (:51) |
| root-misalign-cascade | 1814 | 0 | hidden-link-drawn | — | — | — |
| canvas-shadow-extent | 4 | 38 | cluster-stereo-shadowing | LimitFinder.java:186-187 | — | — |

**Total: 1924 paths** (1814 cascade + 110 direct). Each path is in exactly one family; the script asserts the sum. Latent total: 255.

## Mechanisms (diagnosis artifacts)

**1. hidden-link-drawn** (and its 1814-path cascade)
- What happens: `EEI_BULK -[hidden]-- EEI_PS` (in.puml:136) sets Link.hidden through goHidden. SvekResult then draws that edge through `ug.apply(UHidden.HIDDEN)`: no paint, but the ink extent is kept. We draw a full `<g class="link" id="lnk63">`.
- Port origin: the bracket disjunct is deliberately left out of `DescriptionEdgeGeo.hidden` (layout-helpers-types.ts:223-243, layout-geo-post.ts:114-117). That attempt was reverted because skipping the draw also lost the extent.
- Causal chain: root `g` has 221 children vs the jar's 220. The LCS (all children key `g`) leaves our first child unmatched. Jar groups 1..130 are then compared with our n+1.
- Ruled out: title/legend order, since both sides are in the same order.

**2. stereo-only-skinparam-block**
- What happens: upstream's opener accepts an empty name, pushes `<<Public>>`, and `<<public>>arrowcolor` is cleaned to `arrowcolor<<public>>`. Our opener at src/core/preprocessor-collector.ts:73 requires `\w+`, so the block is never collected.
- Ruled out (probes against the jar): the flat `ArrowColor<<Public>>`, `ComponentBorderColor<<Public>>` and `InterfaceBackgroundColor<<Public>>` already match the jar (c7); the block form fails (c8).

**3. inline-link-colour-dropped**
- LINK_LINE_RE captures `color`, but parseLinkLine takes colour only from the bracket style. Probe c1: the jar draws #AAA/#000 and we draw #181818.

**4. dpi-scale-double-rounding**
- The jar formats `width*0.625` once. We format at 1x and then string-rescale: `Color` 33.5125 → "33.513" → 20.945625, printed 20.946. The jar prints 20.945.
- Activity already defers number formatting; description does not.

**5. stereo-font-and-interface-border-keys**
- `<sname>FontColor<<X>>`, `InterfaceBorderColor<<X>>` and `ArrowFontColor<<X>>` are not consumed even in flat form (probe c9). These diffs stay after #2 is fixed.

**6. cluster-stereo-shadowing**
- `Shadowing<<package>> true` → Shadowing 3 on component+package. Cluster#getStyle signs it with the group's stereotype, and drawU reads getShadowing.
- Our `resolveElementShadowing(theme, symbol)` has no stereotype argument (probe c3, no hide stereotype needed). Its cascade `canvas-shadow-extent`: the canvas is 3.75 short in W and H = 2*deltaShadow at scale 0.625. The extreme rects are the shadowed clusters ent0083/ent0077. Title and legend are centred, so they shift by 1.875.

**7. hide-stereotype-drops-stereo-style**
- Upstream styles from the full stereotype and filters only the printed labels. We store only the visible labels in `geo.stereotype`, and the renderers style from that.
- Probes: c3 matches the jar; c5 (+hide stereotype) is all #FFF.

**8. port-cluster-title-min-width**
- ent0174 (which has port SIH) is drawn 38px (unscaled) wider, with the same centre. ensureMinWidth uses the merged multi-line title width.
- Our layout-cluster-boxes.ts:41 measures the raw display, with a literal `\n`, as a single line. The DOT path already uses the D5 dims (dotEqual).

**9. multi-stereotype-tie-order**
- On an equal-priority tie, upstream keeps the first-defined style (LinkedHashMap order; DarkString keeps `previous`). Ours keeps the last label.
- c3 cannot separate definition order from label order. T6b needs one reversed-order jar probe (MEDIUM).

## Dependencies for T6b ordering
- #4 and #5 entity rows, #6, and #9 also need #7 under `hide stereotype`.
- #5 needs #2.
- Fixing #1 first makes the render-diff readable: 1924 → about 255.

## Stop-8 flags
None proven large AND separable.
- Nearest candidate: **dpi-scale-double-rounding**. It is cross-engine (any non-activity engine with scale/dpi), but the mechanism already exists in core (`numbersDeferred`, activity), so for description it is an opt-in, not a new port.
- **multi-stereotype-tie-order** touches the shared core stereotype resolver (all engines). It is small in code, but its blast radius should be measured (all-engine survey) under the D5 core rules.

## Residuals / write-set extensions
- None in T6a.
- Probe fixtures and jar oracles are in `/private/tmp/claude-501/gtc-T6a/{p,o}/` (c1–c9).
