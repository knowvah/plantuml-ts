# sdd2 execution observations (orchestrator)

## Observation: core MeasurerStringBounder drops BOLD for weight-aware measurers
- **Context**: sdd2 T6a parity probe (sequence labels through core DisplayCreole).
- **Finding**: `src/core/measurer-bounder.ts:27-30` hands the measurer a font whose BOLD lives in `styles`, not `weight`; `measurer-jar.ts:60-62` `metricsFor` then measures bold atoms with regular metrics. With the JarMeasurer, 137 of 687 pinned sequence rows render differently through it. A bounder mapping BOLD/ITALIC to weight/style gives 0/687.
- **Impact**: no gate can see it — the ratchet and the survey both use DeterministicMeasurer, which ignores weight. Any engine that routes a FontConfiguration through MeasurerStringBounder to a weight-aware measurer mis-measures bold text (other engines not checked).
- **Confidence**: High (probe on all pins).

## Observation: the sequence ratchet harness lacks nested-diagram renderers
- **Context**: sdd2 T6a.
- **Finding**: `tests/oracle/svg-conformance/render-fixture-sequence.ts` never calls `registerNestedDiagramRenderers` (activity's harness does, `render-fixture-activity.ts:121`; production does, `src/index.ts:317`). `{{ }}` rows (cusete, dasutu, lezonu) therefore disagree between classify and the survey. `classify.mts` also passes no emoji asset store (gacemo).
- **Impact**: classify under-counts conformant rows that embed diagrams or emoji.
- **Confidence**: High.

## Observation: `!pragma svgparser sax` sprites are unported
- **Context**: sdd2 T6a cluster A.
- **Finding**: ~30 sequence rows use `svg/parser/SvgSpriteParserFactory.java`'s sax parser; 11 also lack `<linearGradient>` defs (class engine too).
- **Impact**: core sprite work, outside the sequence creole seam.
- **Confidence**: Medium (counted from the probe residuals).

## Observation: worktree agents saturate the box
- **Context**: sdd2 Batch 4–5, five agents + vitest in parallel.
- **Finding**: load 20–70; `chain.sh` (waits for load < 12) stalls for the whole run, and survey wall-clock readings are confounded.
- **Impact**: schedule all-engine chains when agents are idle, or accept the wait.
- **Confidence**: High.

## Observation: theme-merge drops unlisted Theme scalars
- **Context**: sdd2 T5c tried to carry `BoxPadding` on the Theme.
- **Finding**: `src/core/theme-merge.ts` copies only `OPTIONAL_SCALAR_KEYS`; any other Theme scalar set by `resolveSkinparam` is dropped. Probe: `resolveSkinparam({footbox:'hide'}).theme.footbox === undefined`.
- **Impact**: `skinparam footbox` (and any future raw Theme scalar) is silently ignored. No sequence corpus row uses it today. Read sequence legacy skinparams through `SequenceLegacyParams` (`SkinParam#getValue`) instead.
- **Confidence**: High.

## Observation: the jar scales the canvas AFTER ensureVisible
- **Context**: sdd2 T7f, scaled sequence diagrams.
- **Finding**: `SvgGraphics` runs ensureVisible on unscaled coordinates and applies the scale only on output (`SvgGraphics.java:129-143,468-475,800-822`): the canvas is `(int)(dim + 1) * scale`, not `(int)(dim * scale + 1)`. 13 scaled sequence rows reached zero on this alone.
- **Impact**: any engine computing a scaled canvas as `(int)(dim*scale+1)` is off for fractional scales; check other engines' scale rows.
- **Confidence**: High (oracle renders at scale 2 and 1.2).

## Observation: sequence handwritten mode needs a renderer rewrite
- **Context**: sdd2 T7f, cluster E (jefoke, gepuce, menoke, pafene).
- **Finding**: `TextBlockExporter.java:175` wraps the whole graphic in `UGraphicHandwritten`, whose RNG reseeds on every `apply` (`UGraphicHandwritten.java:54,114-116`). Sequence emits component shapes as SVG strings from 14 renderer modules, so none reaches the decorator; T6b's creole seam only routes label text (which the decorator leaves alone) through a UGraphic.
- **Impact**: handwritten sequence is a separate mission — every component must draw through a UGraphic with upstream's apply-chain topology for the jiggle points to match.
- **Confidence**: High (measured element counts per row).

## Observation: pre-existing over-cap core file
- **Context**: sdd2 B7 close, splitting `theme-graph-colors-b.ts`.
- **Finding**: `src/core/theme-graph-colors-a.ts` is 525 lines (already 525 at main `b34120ea9`, before sdd2); the PostToolUse cap is 500. sdd2 did not touch it. `sequence-parse-helpers.ts` (540) and `theme-graph-colors-b.ts` (508) were split during sdd2 because the drive grew them.
- **Impact**: a dedicated cleanup PR should split `-a` the same way (type-only move into a new slice).
- **Confidence**: High.

## Observation: the ratchet harness's missing asset store hides engine residuals
- **Context**: sdd2 T-exit diagnosis of the 109 open rows.
- **Finding**: `render-fixture-sequence.ts:121` and `classify.mts`/`diff-one.mts` pass no emoji/sprite/utility asset store. Four rows (gacemo, rapoto, savebe, tugonu) read diverged on the fallback glyph alone. With the survey's store wired in, gacemo is zero, and the other three show small real residuals (`AtomSprite.java:77` sprite font colour; to255 rounding).
- **Impact**: classify both over-counts these rows and hides their real mechanisms. Wire the store in before the next drive measures.
- **Confidence**: High (agent re-render with the survey store, verified against the cited code).

## Observation: `to255` rounds in two places where Java truncates
- **Context**: sdd2 T-exit, rows davipu, fixecu, losilu, naliba, dekapo, rapoto, savebe, tugonu.
- **Finding**: `ColorUtils.to255` is `(int)(255 * v)` (`ColorUtils.java:169-170`); `src/core/tim/builtin/color-utils.ts:296` and `src/core/klimt/sprite/ColorResolver.ts:230` both use `Math.round`, so a channel lands one step high when its fraction is ≥ .5.
- **Impact**: two copies of one primitive; fix both together (and consider sharing one).
- **Confidence**: High (both files read; Java read).

## Observation: Pattern2 is case-insensitive; most creole ports are not
- **Context**: fix/sequence-harness-prereqs, dekapo-15-vama907 rose 328 -> 1051 once the harness drew real emoji.
- **Finding**: `Pattern2.cmpile` compiles every pattern with `Pattern.CASE_INSENSITIVE` (`regex/Pattern2.java:114`). `CommandCreoleEmoji.ts` lacked `'i'`, so `<:1F607:>` stayed literal text; with the fallback glyph gone, the comparator's per-tag index alignment shifted every later `path[n]`, which is why the score ROSE on a correct harness change. Adding `'i'` took dekapo to 0. Most other creole command regexes also lack `'i'`.
- **Impact**: audit every TS port of a `Pattern2` pattern; filed in `planning/next-missions.md` sdd2 follow-ons.
- **Confidence**: High (Java read; dekapo measured 328 -> 0).

## Observation: sequence rows newly conformant after the prereqs
- **Context**: fix/sequence-harness-prereqs re-measure.
- **Finding**: davipu, dekapo, fixecu, gacemo, losilu, naliba, savebe, tugonu -> 0 (pinned, source `sdd3-prereqs`); rapoto 122 -> 2. 0 rises. 101 rows Σ 3800 open.
- **Impact**: sdd3 starts from 1042 pins.
- **Confidence**: High.
