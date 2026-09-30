# Architecture decisions (locked; user: "approve all twelve", 2026-09-29)

| # | Decision (one line) |
|---|---|
| D1 | Port the upstream style engine subset into `src/core/style/`; mindmap only; other engines keep the flat `StyleMap` |
| D2 | Style sources: jar `plantuml.skin` (or the `skin` named) first, then skinparams and `<style>` blocks muted in **source order** |
| D3 | Draw on the klimt substrate (`TextBlock.drawU` → `UGraphicSvg`, `LimitFinder`/`TextBlockExporter` canvas) |
| D4 | `FtileBoxOld` at its upstream path, `createMindMap` + `createWbs` slices |
| D5 | `MindMapDiagram extends TitledDiagram`: chrome via `assemble-svg.ts`, root `data-diagram-type="MINDMAP"`, `+10` width |
| D6 | All five commands + `getSmartLevel`, both directions, multiple roots, boxless, stereotypes, `[#color]`; upstream throws → jar error page |
| D7 | Mindmap golden ratchet + weighted diff-baseline; routing/refusal re-pin is one orchestrator commit at the b5 close; no DOT gate |
| D8 | Every coordinate is a target; never fit; `file:line` or jar probe per constant; instrument before blaming |
| D9 | Exit: 142 measured, every non-conformant row has mechanism + owner, 0 losses in any engine, semutu re-measured; numeric target set at the b5 close |
| D10 | cdd6 execution rules (worktrees with the hook linked, targeted agent tests, four gates per close, no push) |
| D11 | All 28 engines surveyed per close vs the previous close; a non-mindmap mover without a mechanism stops the mission |
| D12 | OUT: WBS, migrating other engines to the style engine, embedded mindmap beyond `semutu` |

## D1 — faithful style engine, mindmap-only consumer

**Context.** `Idea.getStyle()` (`Idea.java:96-104`) is `StyleBuilder.getMergedStyleSpecial` with
`addLevel` (`:depth(n)`), `addStar` (`*`) and a `STEP_BY_PARENT` priority walk up the parents
(`WElement.java:110`, `1000_1000`). The port's `StyleMap` is flat: `skinparam-style-block.ts`
drops `:depth(n)`/`*` selectors and throws past 2 levels of nesting.
**Decision.** Port `style/` faithfully (`StyleParser`, `Context`, `StyleStorage`, `StyleBuilder`,
`Style`, `StyleKey`, `StyleSignatureBasic`, `PName`, `SName`, `Value*`, `MergeStrategy`,
`DarkString`, `StyleLoader`, `FromSkinparamToStyle` subset), upstream names preserved.
**Consequences.** Two style paths coexist until other engines migrate; recorded in
`DIVERGENCES.md` at close-out. WBS and teoz can reuse the engine. The existing
`src/core/style/StyleSignatureBasic.ts` stub is widened, and `VisibilityModifier` must keep compiling.

## D2 — style sources and order (corrected while writing the brief)

**Context.** `SkinParam.java:155-265`: `getCurrentStyleBuilder()` lazily runs
`StyleLoader.loadSkin(getDefaultSkin())`. After that, every `setParam` converts the skinparam
through `FromSkinparamToStyle.convertNow` + `muteStyle`, and every `<style>` block is parsed and
muted, **as its command executes, in source order**. `skinparam style strictuml` mutes with
`strictuml.skin`. `!theme` expands inline to skinparam/style lines during preprocessing.
The Phase-3 wording ("skin → theme → style → skinparams") was imprecise; this is the corrected
form, journaled at brief time.
**Decision.** Embed the oracle jar's skin text verbatim (T0d, drift-gated). Build the mindmap's
`StyleBuilder` in the mindmap plugin via `buildMindmapStyleBuilder`, which walks the port's
existing declaration-order seam `style-skinparam-segments.ts` (read-only). `buildTheme` is not
touched.
**Consequences.** No other engine's style path changes (stop 11).

## D3 — klimt drawing substrate

Upstream mindmap is `UDrawable`/`TextBlock` end to end (`FingerImpl.drawU`, `MindMap.drawU`,
`FtileBoxOld.drawU`). Mirror that on the ported klimt `UGraphicSvg`; size the canvas the way
`TextBlockExporter` does. Precedent: the description and json engines.

## D4 — FtileBoxOld

`src/diagrams/activity/ftile/vertical/FtileBoxOld.ts` ports the constructor
(`FtileBoxOld.java:148-176`), `drawU` (`:185-221`), `tbWidth`, `calculateDimensionFtile`
(`:230-236`) and both factories (`:139-146`). It uses the ported `SheetBlock1`/`SheetBlock2`.
`SkinParamColors` carries `[#color]`.

## D5 — chrome

`MindMapDiagram.getTextBlock` (`MindMapDiagram.java:81-102`) stacks the `MindMap`s vertically,
width = max + 10. Title/caption/legend/header/footer/scale/mainframe come from the existing
`assemble-svg.ts` path. The root carries `data-diagram-type="MINDMAP"`
(`TextBlockExporter.java:292-294`).

## D6 — parsing

`CommandMindMap{Root,Plus,Orgmode,OrgmodeMultiline,Direction}`, `MindMapDiagram.addIdea`
(`:106-134`), `getSmartLevel` (`:136-159`, throws `UnsupportedOperationException` → jar error
page), `MindMap.isFull` (`:148`) → a new `MindMap`, `Branch` regular/reverse.

## D7 — harness

`tests/oracle/svg-conformance/mindmap.golden.ratchet.test.ts` holds the conformant pins in
`oracle/goldens/svg-mindmap/`; `mindmap.diff-baseline.ratchet.test.ts` holds the weighted-score
baseline. The routing gate's 139 `MINDMAP -> NONE` rows flip when the plugin registers: the
orchestrator re-pins them from a fresh measurement at the b5 close ([[new-corpus-tree-trips-two-gates]]).

## D8 — fidelity

No Graphviz, so no accepted-delta class exists. Values come from the Java or from a jar probe
(T0c); a constant that shrinks an error without a citation is forbidden (CLAUDE.md "never fit").

## D9 — exit bar

All 142 fixtures measured; each non-conformant row carries a mechanism and an owner (a batch-6
task, an accepted divergence with a reason, or `open -> <next mission>`); 0 conformant losses
in any engine; `unknown/semutu-45-zeno907` re-measured. The numeric conformant target is set at
the b5 close from the first real measurement and journaled.

## D10 — execution rules

As cdd6: `mkwt.sh` worktrees (dependencies, `test-results` children and `.husky/_` linked);
agents run targeted tests + typecheck + eslint; the orchestrator merges `--no-ff`, runs the four
gates, regenerates the catalog and runs `prettier --check`; `--maxWorkers=6`; surveys at load < 8;
never push.

## D11 — all-engine survey

Every close surveys all 28 engines into `measurements/bN-eng/` and diffs verdicts and `dotEqual`
against the previous close (`b0-eng/` for b1). Existing engines share no code with the new style
engine, so any non-mindmap mover needs a mechanism or stops the mission.

## D12 — out of scope

WBS (it shares `IdeaShape`/`FtileBoxOld`; `createWbs` is ported for it); migrating any existing
engine onto the new style engine; embedded mindmap in engines other than the `semutu` check.
