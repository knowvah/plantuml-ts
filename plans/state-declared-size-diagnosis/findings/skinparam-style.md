# skinparam-style findings (T5)

## Group A — inline `[[...]]` link markup measured raw, not resolved

### feziva-71-gufo538

- **bucketLabel:** skinparam-style
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | width | 0 | 0.729861 | 0.694444 | +2.550 |
- **status:** resolved
- **mechanism:** `state "[[S1]]" as S1`'s DISPLAY text keeps the raw `[[S1]]`
  markup (brackets included) all the way into text measurement — nothing in
  the state-sizing path ever runs `resolveInlineLinks` on `state.display`, so
  the box is sized for the 6-char literal `[[S1]]` instead of the 2-char
  visible label `S1`. The differing `<style>`/`skinparam` hyperlink-underline
  directives in this fixture (thickness 0) are coincidental context, not the
  cause — verified below.
- **originFileLine:** src/diagrams/state/state-sizing.ts:207 (`measureNormalState`: `measureLines(splitStateDisplayLines(state.display), font, measurer)` — `state.display` never passed through `resolveInlineLinks`)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageStateCommon.java:80 (`entity.getDisplay().create8(...)` — jar's `Display` parses `[[...]]` as creole at construction, so `create8` renders a `TextLink` atom); ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/command/TextLink.java:50-51 (`getText()` returns `url.getLabel()`, i.e. the resolved "S1", never the raw brackets)
- **causalChain:** Probe via `measureState({display:'[[S1]]'}, false, defaultTheme, WidthTableMeasurer, 'TB')` → `{width:52.55}`; same call with `display:'S1'` → `{width:50}` (matches jar exactly). `52.55 = nameWidth('[[S1]]') + STATE_MARGIN_DELTA(20)`; jar's `nameWidth('S1') + 20 < STATE_MIN_WIDTH(50)` so jar clamps to 50. Δpx = (0.729861 − 0.694444) × 72 = 2.550.
- **ruledOut:** The three hyperlink-skinparam fixtures (thickness 0 / `HyperlinkUnderline false` / thickness 2 + color) all reproduce the IDENTICAL 52.55/50 pair when only the display text and theme (not the skinparam-style directive) are varied in the probe above — the underline/color skinparam values play no role. Also ruled out: the `2.6`-rounded entry in `mosigo-88-rove013`/`rijoki-89-teno556` (repeated-|Δpx| table) as a match — their exact delta is **−2.575** (opposite sign) and neither fixture contains `[[...]]` markup at all (both use `<<O-O>>` stereotype); coincidental rounding collision only, see cross-bucket note below.
- **pairingRisk:** none — single node in the scope.
- **sharedCauseWith:** mujipe-99-fume794, nixoja-06-guxe431 (identical mechanism, identical Δpx, verified via the same probe pair above)
- **proposedWriteSet:** src/diagrams/state/state-sizing.ts (`measureNormalState`, `measureEmptyDescription`, `measureSdlReceive`, `buildStateGeoTextFields`) — resolve `state.display` (and body lines) through `resolveInlineLinks` (already exported from `src/diagrams/description/parse-helpers.ts`) before splitting/measuring; verify `renderer-box.ts` already resolves links for the drawn `<text>` so sizer and renderer don't diverge (leaf-sizing-text.ts documents this exact sizer/renderer-divergence risk class).
- **sizeEstimate:** small — 1-2 files, isolated to state entities whose display embeds an inline `[[...]]` token; verification: re-run `measure-composite-declared-size.ts` + a render diff on this trio.
- **confidence:** high
- **nextStep:** n/a (resolved)

### mujipe-99-fume794

- **bucketLabel:** skinparam-style
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | width | 0 | 0.729861 | 0.694444 | +2.550 |
- **status:** resolved
- **mechanism:** identical to feziva-71-gufo538 — raw `[[S1]]` measured instead of resolved `S1`; `skinparam HyperlinkUnderline false` is inert to this delta.
- **originFileLine:** src/diagrams/state/state-sizing.ts:207
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageStateCommon.java:80; ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/command/TextLink.java:50-51
- **causalChain:** Same as feziva-71-gufo538: Δpx = (0.729861 − 0.694444) × 72 = 2.550.
- **ruledOut:** Same probe as feziva-71-gufo538, `display:'[[S1]]'` vs `'S1'` — `HyperlinkUnderline` is a render-time stroke attribute (`FontConfiguration.ts`), never read by `state-sizing.ts`, confirmed by grep (no `hyperlink` hits in `src/diagrams/state/`).
- **pairingRisk:** none
- **sharedCauseWith:** feziva-71-gufo538, nixoja-06-guxe431
- **proposedWriteSet:** same as feziva-71-gufo538 (one fix closes all three)
- **sizeEstimate:** see feziva-71-gufo538
- **confidence:** high
- **nextStep:** n/a (resolved)

### nixoja-06-guxe431

- **bucketLabel:** skinparam-style
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | width | 0 | 0.729861 | 0.694444 | +2.550 |
- **status:** resolved
- **mechanism:** identical to feziva-71-gufo538 — raw `[[S1]]` measured instead of resolved `S1`; the `<style>` block's `hyperlinkUnderlineThickness 2`/`hyperlinkUnderlineStyle 5-1`/`hyperlinkColor Red` are inert to this delta.
- **originFileLine:** src/diagrams/state/state-sizing.ts:207
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageStateCommon.java:80; ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/command/TextLink.java:50-51
- **causalChain:** Same as feziva-71-gufo538: Δpx = (0.729861 − 0.694444) × 72 = 2.550.
- **ruledOut:** Same probe as feziva-71-gufo538; the `<style>` block's three hyperlink properties are all render/stroke attributes with no sizing consumer in `state-sizing.ts`.
- **pairingRisk:** none
- **sharedCauseWith:** feziva-71-gufo538, mujipe-99-fume794
- **proposedWriteSet:** same as feziva-71-gufo538 (one fix closes all three)
- **sizeEstimate:** see feziva-71-gufo538
- **confidence:** high
- **nextStep:** n/a (resolved)

## Group B — `skinparam wrapWidth` not implemented for state labels

### jafazu-60-leca675

- **bucketLabel:** skinparam-style
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | width | 1 | 8.344444 | 2.161111 | +445.200 |
  | 1 | height | 1 | 0.555556 | 1.111111 | -40.000 |
- **status:** resolved
- **mechanism:** `skinparam wrapWidth 150` is read into `theme.wrapWidth` but
  never consumed anywhere in the state pipeline — `theme.wrapWidth` has zero
  references under `src/diagrams/state/` (confirmed by search). State "b"'s
  long label is measured as one unwrapped line at full width; jar word-wraps
  it at 150px into 2 lines, both narrower and taller.
- **originFileLine:** src/diagrams/state/state-sizing.ts:199 (`measureEmptyDescription` — this fixture has `hide empty description`, so `measureNormalKind` routes here) — `measureLines(splitStateDisplayLines(state.display), font, measurer)` takes no wrap-width parameter at all.
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageStateCommon.java:80-81 (`entity.getDisplay().create8(nameFc, horizontalAlignment, getSkinParam(), CreoleMode.FULL, getStyleState().wrapWidth())` — wrap width IS threaded into the name TextBlock); ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/Style.java:292 (`wrapWidth()` resolves `PName.MaximumWidth`, fed by `skinparam wrapWidth`)
- **causalChain:** width Δpx = (8.344444 − 2.161111) × 72 = 445.200 (one unwrapped line vs. jar's two-line wrap at 150px). height Δpx = (0.555556 − 1.111111) × 72 = −40.000 — exactly one line-height short (jar has 2 lines, ours has 1).
- **ruledOut:** Not a one-off arithmetic bug in a single function — the identical 445.200/−40.000 pair recurs in rejike-58-rote606, which goes through a DIFFERENT function (`measureNormalState`, not `measureEmptyDescription`, since it lacks `hide empty description`) with different absolute base values (50pt vs 40pt height, 165.6pt vs 155.6pt jar width) yet the SAME exact deltas — consistent with "wrapping never runs" rather than a per-function sizing error.
- **pairingRisk:** none — "a" (50pt) and "b" (600pt+) are far apart in both ports.
- **sharedCauseWith:** rejike-58-rote606 (same missing-wrapWidth mechanism; identical Δpx on both axes despite different absolute values and different call site)
- **proposedWriteSet:** src/diagrams/state/state-sizing.ts (thread `theme.wrapWidth` into `measureNormalState`/`measureEmptyDescription`/`measureSdlReceive`, extend `splitStateDisplayLines`/`measureLines` to word-wrap); src/diagrams/state/renderer-box.ts (render-time line breaking must match the sizer, mirroring the `Fission.ts#getSplitted` wrap machinery already used by `EntityImageDescriptionTextBlock.ts` for class/note diagrams — reuse candidate).
- **sizeEstimate:** medium — new word-wrap feature port (not present anywhere in state/), touches sizer + renderer in lockstep; verify against jar on a wrapWidth state corpus, not just this pair.
- **confidence:** high
- **nextStep:** n/a (resolved diagnosis; fix itself is out of scope per ADR-2/ADR-5)

### rejike-58-rote606

- **bucketLabel:** skinparam-style
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | width | 1 | 8.483333 | 2.3 | +445.200 |
  | 1 | height | 1 | 0.694444 | 1.25 | -40.000 |
- **status:** resolved
- **mechanism:** same as jafazu-60-leca675 — `skinparam wrapWidth 150` never
  consumed by the state pipeline; unlike jafazu, this fixture has no `hide
  empty description`, so "b" routes through `measureNormalState` instead of
  `measureEmptyDescription`, but the missing-wrap mechanism is identical.
- **originFileLine:** src/diagrams/state/state-sizing.ts:207 (`measureNormalState`)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageStateCommon.java:80-81; ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/Style.java:292
- **causalChain:** width Δpx = (8.483333 − 2.3) × 72 = 445.200. height Δpx = (0.694444 − 1.25) × 72 = −40.000 — same one-line-height shortfall as jafazu-60-leca675.
- **ruledOut:** See jafazu-60-leca675's ruledOut — the cross-function, cross-base-value identical delta is the evidence this is one systemic gap, not two coincidentally equal bugs.
- **pairingRisk:** none
- **sharedCauseWith:** jafazu-60-leca675
- **proposedWriteSet:** same as jafazu-60-leca675
- **sizeEstimate:** see jafazu-60-leca675
- **confidence:** high
- **nextStep:** n/a (resolved diagnosis; fix itself is out of scope per ADR-2/ADR-5)

## Group C — composite ink-box sensitivity to inner dot-engine routing under `linetype`

### kejabo-83-vinu490

- **bucketLabel:** skinparam-style
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | width | 2 | 2.14434 | 2.133924 | +0.750 |
  | 2 | height | 2 | 3.555555 | 3.555556 | -0.000 |
- **status:** unresolved
- **mechanism:** `skinparam linetype polyline` — the composite "NotShooting"
  cluster's own declared size (fed to the OUTER dot pass as a fixed node) is
  computed from the INNER scope's own dot-engine layout result
  (`state-composite-autonom.ts` → `runPass` → `computeSvekResultGeometry` →
  `buildInkBox`), which folds each labeled transition's routed points into
  the ink box (`attachTransitionLabel(t, geo.points, edgeResult, ...)`).
  The inner leaf states (Idle/Configuring, scope 1 in this table — no delta
  reported) size byte-identically to jar, so the divergence is not a
  state-sizing defect; it traces to dot-engine's own spline-routing
  arithmetic under `splines=polyline` not being bit-identical to real
  graphviz's, shifting the transition-label anchor point (and hence the ink
  box) by a small amount. UNRESOLVED at the precision needed for a
  `file:line` fix — see nextStep.
- **originFileLine:** src/diagrams/state/state-composite-pass.ts:250 (`attachTransitionLabel(t, geo.points, edgeResult, acc.labelFont, acc.measurer)` — `geo.points` come straight from dot-engine's routed edge, `layout-ink-extent.ts:528`'s `buildInkBox` then folds the resulting label box into the composite's declared size)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:433-437 (dotSplines branch selecting `label=` for non-ortho — confirms jar's own label placement is spline-routing-dependent, same family of sensitivity); `state-composite-autonom.ts:196-205`'s own comment on `SvekResult#calculateDimension` (re-verified per ADR-4, still faithful — the DIVERGENCE is upstream of this call, in the routed points it consumes, not in the dimension formula itself)
- **causalChain:** Δpx = (2.14434 − 2.133924) × 72 = 0.750. Scope 1 (Idle/Configuring/`__init_NotShooting`) has zero reported delta rows, confirming leaf sizing is exact and the divergence is composite-geometry-only.
- **ruledOut:** Not a leaf-state sizing bug (scope-1 rows match exactly, per above). Not the SAME mechanism as pavuzo-79-zodu430 despite topical proximity: `linetype polyline` keeps the transition label on `label=` (confirmed in `svek-2.dot`'s own emitted `label=<<TABLE...>>`), while `linetype ortho` (pavuzo) reroutes it through `xlabel=` entirely (`state-dot-graph.ts:238`, `SvekEdge.java:433-437`) — a different code fork, not a numeric coincidence, so NOT folded into one `sharedCauseWith` group despite both landing on "composite ink-box + linetype".
- **pairingRisk:** none — scope-2 values (20 / 75.3 / 154.4pt) are widely separated; idx2 unambiguously pairs to "NotShooting" on both sides.
- **sharedCauseWith:** none (see ruledOut — related family to pavuzo-79-zodu430, not the same mechanism)
- **proposedWriteSet:** unresolved — candidate root is `node_modules/@knowvah/dot-engine` (spline routing under `splines=polyline`), external to this repo; if the divergence turns out to be in OUR ink-box aggregation instead, candidates are `src/diagrams/state/layout-ink-extent.ts` (`buildInkBox`) and `state-composite-pass.ts` (`attachTransitionLabel`).
- **sizeEstimate:** unknown until isolated — could be a `docs/graphviz-issues/` filing (no src/ change) or a small ink-box fix; verification cost is high (needs coordinate-level diffing against real graphviz).
- **confidence:** medium
- **nextStep:** Extract the inner scope's DOT input in isolation (`svek-1.dot`'s content for this fixture) and run it through both dot-engine (`layoutGraph`) and real graphviz (`scripts/oracle-render.sh` or a raw `dot -Tsvg`/`-Txdot` on the extracted fragment) to diff node/edge/label point coordinates directly — this pins whether the divergence is spline-point placement or ink-box aggregation, which a size-only harness (this mission's oracle) cannot distinguish.

### pavuzo-79-zodu430

- **bucketLabel:** skinparam-style
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | width | 2 | 1.954201 | 1.988368 | -2.460 |
- **status:** unresolved
- **mechanism:** `skinparam linetype ortho` — same composite ink-box family
  as kejabo-83-vinu490, but this fixture's transitions route their label
  through `xlabel=` instead of `label=` (`state-dot-graph.ts:238`:
  `if (ctx.theme.linetype === 'ortho') moveLabelToXlabel(attrs)`, mirroring
  jar's `SvekEdge.java:433-437`). The composite's declared width is again
  downstream of the inner dot-engine pass's own xlabel-placement arithmetic
  (`node_modules/@knowvah/dot-engine/src/label/xlabels.ts` +
  `src/common/xlabels-place.ts`), which is a distinct algorithm from
  `linetype polyline`'s inline-label path and evidently not bit-identical to
  real graphviz's xlabel placement either. UNRESOLVED — see nextStep.
- **originFileLine:** src/diagrams/state/state-dot-graph.ts:238 (`moveLabelToXlabel` — the fork point that puts this fixture on the xlabel path) feeding src/diagrams/state/state-composite-pass.ts:250 / src/diagrams/state/layout-ink-extent.ts:528 (same ink-box aggregation as kejabo-83-vinu490)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:433-437 (`dotSplines == DotSplines.ORTHO` → `xlabel=<`); `state-composite-autonom.ts:196-205` (re-verified per ADR-4, unchanged)
- **causalChain:** Δpx = (1.954201 − 1.988368) × 72 = −2.460. Scope 1 (Idle/Configuring) again reports zero delta, so this is composite-geometry-only, same as kejabo-83-vinu490.
- **ruledOut:** See kejabo-83-vinu490's ruledOut — explicitly NOT the same mechanism as kejabo despite the shared "linetype + composite ink-box" family: opposite sign, different magnitude, and a genuinely different code fork (`xlabel=` vs `label=`) confirmed by reading both `state-dot-graph.ts:238` and the fixtures' own `svek-2.dot` emission.
- **pairingRisk:** none — same well-separated scope-2 values as kejabo-83-vinu490.
- **sharedCauseWith:** none (related family to kejabo-83-vinu490 — composite ink-box sensitive to inner-pass routing under `linetype` — but a different mechanism; see ruledOut)
- **proposedWriteSet:** unresolved — candidate root is dot-engine's xlabel placement (`node_modules/@knowvah/dot-engine/src/label/xlabels.ts`, `src/common/xlabels-place.ts`), external to this repo; alternatively `src/diagrams/state/layout-ink-extent.ts` if OUR xlabel ink-box folding is the divergent step.
- **sizeEstimate:** unknown until isolated — same class of cost as kejabo-83-vinu490, likely a separate `docs/graphviz-issues/` filing since it is a different algorithm (xlabel force-placement, not spline routing).
- **confidence:** medium
- **nextStep:** Same isolation approach as kejabo-83-vinu490, but extract with `linetype ortho` set so the fragment reaches dot-engine's xlabel placement path; diff xlabel anchor coordinates against real graphviz's `xlabelnum`/`xlabels.c` placement on the identical fragment.

## Cross-bucket notes

- **Not shared:** `mosigo-88-rove013`/`rijoki-89-teno556` (bucket: stereotype,
  T7) round to the same `2.6` bucket in the repeated-|Δpx| table as Group A's
  `2.550`, but their exact value is **−2.575** (opposite sign) and neither
  fixture contains `[[...]]` inline-link markup — both use `<<O-O>>`
  stereotype syntax instead. Confirmed by reading both `.puml` files. This is
  a rounding collision in the 0.1px-bucketed table, not a shared cause; T7
  owns the real mechanism for those two.
- Group A (3 fixtures), Group B (2 fixtures), Group C (2 fixtures) are three
  independent mechanisms sharing the `skinparam-style` bucket label only
  because T0's first-match classifier keyed on the fixture containing any
  `skinparam`/`<style>`/`!theme` token (ADR-3) — none of the three groups
  cross-reconciles with either of the others.

## Unresolved summary

- kejabo-83-vinu490 — nextStep: isolate inner-scope DOT fragment, diff
  dot-engine vs real graphviz spline routing under `splines=polyline`.
- pavuzo-79-zodu430 — nextStep: isolate inner-scope DOT fragment, diff
  dot-engine vs real graphviz xlabel placement under `splines=ortho`.
  Both are dot-engine-arithmetic candidates (external package), consistent
  with the project's `docs/graphviz-issues/` filing path rather than a
  `src/diagrams/state` fix — not >10% of this 7-fixture slice (2/7 ≈ 29%,
  flagged here rather than silently accepted since it exceeds the mission's
  10% unresolved-cluster stop threshold in README stop condition 6, but the
  two nextSteps are DIFFERENT instrumentation, not one missing tool, so stop
  condition 6 — "same nextStep" — does not apply).

## Judgment calls

- Split the 7-fixture slice into three groups by TRUE mechanism (ADR-3)
  rather than keeping one `skinparam-style` narrative; each group's records
  cross-reference only within the group.
- Kept kejabo-83-vinu490/pavuzo-79-zodu430 as two separate unresolved
  records rather than one `#a`/`#b` pair on a shared slug, since they are
  different fixtures (not rows within one fixture) — SCHEMA's `#a`/`#b`
  split is for distinct causes WITHIN one fixture's rows, which doesn't
  apply here; used prose + `sharedCauseWith: none` instead to reconcile the
  table's implied proximity.
