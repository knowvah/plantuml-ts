# Decisions (approved by the maintainer 2026-10-12, plan-mission Phase 3)

Java paths are under `~/git/plantuml/src/main/java/net/sourceforge/plantuml/`.

## D1 — Port layout and command shape
One TS file per Java file under `src/diagrams/wbs/`, upstream names, `@see` on every symbol,
`file:line` on every constant. Commands are `<NAME>_RE` + `applyX(diagram, match)` functions
dispatched by `WBSDiagramFactory.ts` in `WBSDiagramFactory.java:6-15`'s order — the mindmap
port's convention (`src/diagrams/mindmap/CommandMindMapPlus.ts`, `MindMapDiagramFactory.ts`).
Porting `SingleLineCommand2`/`CommandMultilines2`/`RegexConcat` as classes is a separate
tooling mission. Java regexes are transcribed literally (`%pLN`, `%g`, `%s` expanded as the
mindmap port does), one unit test per alternation arm.

## D2 — WBS's own tree layout
`Fork.java`, `ITFComposed.java`, `ITFLeaf.java`, `ITF.java`, `WBSTextBlock.java` are ported
verbatim with their constants (`Fork`: `delta1x=20`, `deltay=40`; `ITFComposed`: `delta1x=10`,
`marginBottom` = style margin bottom, 0 for PSEUDO; the `Width auto` forced-min-width pass).
`planning/mission-guide.md` Phase 4e's "same twopi layout as mindmap" is wrong (journal it);
no adaptation of `Finger`/`Tetris`.

## D3 — The node box is the activity ftile
`WBSTextBlock#buildMain` (java:35-45) and `ITFLeaf` (java:6-23) call
`FtileBoxOld.createWbs` — already ported at
`src/diagrams/activity/ftile/vertical/FtileBoxOld.ts:90` — for `BOX`, `TextBlockUtils.withMargin
(text, 0, 3, 1, 1)` over `Display.create0(...)` for `NONE`, `EMPTY_TEXT_BLOCK` for `PSEUDO`.
No wbs-local box; a `createWbs` behaviour gap is stop 10 (report against the activity file).

## D4 — Style resolution duplicates `Idea`, as upstream does
`WElement.getStyle` (java:42-52) carries the same `STEP_BY_PARENT = 1000_1000` priority merge
`src/diagrams/mindmap/Idea.ts` has (upstream marks it `@DuplicateCode(reference = "Idea")`);
mirror the duplication, do not extract a helper. Style/skinparam plumbing is reused as-is:
`src/core/style/mindmap-style-builder.ts#createMindmapSkinParam` + a `wbs-skin-param.ts`
mirroring `mindmap-skin-param.ts`. Renaming the "mindmap" style modules is a follow-on.
Style names `wbsDiagram`, `rootNode`, `leafNode`, `boxless` already exist in `SName.ts`.

## D5 — Export through the shared `TitledDiagram` path
`wbsPlugin` takes mindmap's `rawTextBlock`/`drawBodyAt` shape (`src/diagrams/mindmap/index.ts`,
`src/diagrams/salt/index.ts` after sep T5a); `exportMargin` = `calculateMargin`: the merged
`{root, document}` style's `Margin` else `getDefaultMargins()` = `same(10)`
(`core/TextBlockExporter.java:510-516`, `TitledDiagram.java:274-277`), as the SALT plugin
does, not mindmap's direct read. `WBS` is routed beside `MINDMAP`/`SALT` in
`src/core/assemble-svg.ts#finalizeShellFragment`. The diagram's own `UTranslate(10,10)` and
`.delta(20)` (`WBSDiagram.java:18-23`) stay inside `WBSDiagram`. No `document-margin.ts` entry.

## D6 — Direction and link geometry in their upstream homes
`getWBSDirection` (`utils/Direction.java:44`: `<` in either `WBS_DIRECTION` group ⇒ LEFT, else
RIGHT) is added to `src/core/abel/Direction.ts` in batch 0 (T0c), pre-declared, so no command
task hits stop 10 for it. `WBSLink` uses the port's `XRectangle2D.intersect`, `XLine2D`,
`ExtremityArrow`; `WElement.setGeometry` reads `AbstractCommonUGraphic.getTranslate()` during
`drawU` (ITFComposed.java:103-106, ITFLeaf.java:46-49); `WBSDiagram.drawMe` draws links after
`ug.apply(translate.reverse())` (java:33-44).

## D7 — Harness and pins are sep's, renamed
`tests/oracle/svg-conformance/render-fixture-wbs.ts`, `wbs.golden.ratchet.test.ts` (0 pins),
`wbs.diff-baseline.ratchet.test.ts` seeded with 204 `error` rows, `oracle/goldens/svg-wbs/`;
`measurements/{pin-wbs,repin-wbs-baseline,repin-wbs-routing}.mts` copied from
`plans/salt-engine-port/measurements/` with the type substituted (a generic `--type` tool is a
follow-on). Pins are orchestrator-only; routing/refusal twin rows are cloned at every pin
because both gates walk every `oracle/goldens/svg-*/` directory.

## D8 — Error pages
The 28 stock-error rows are conformant under the 2026-10-10 rule when the port also errors:
unmatched lines refuse through the factory (mindmap's `refuse`), `addIdea`/`add`/`link`
return the Java's strings ("WBS diagram only accepts one root first declared.", "Bad tree
structure", "No such node x", "Missing label for WBS node."), and nothing swallows them. The
two `NONE -> NONE` agree rows (`tojixi-05-lusu056`, `zecavo-98-kini554`) must keep erroring.

## D9 — Draw order
`WElement` keeps children in `ArrayList`s and `WBSDiagram.codes` in a `LinkedHashMap`: no
hash-order emulation (unlike salt's `Grid`). The level-1 LEFT quirk — a LEFT child at level 1
is prepended to `childrenRight` AND appended to `childrenLeft` (`WElement.java:70-80`) — is
mirrored verbatim and pinned.

## D10 — Exit bar
wbs 204/204 conformant under `DeterministicMeasurer`; every byte-identical row pinned;
`activity/bozido-07-geze049`'s wbs slot measured (gantt slot stays blocked); 0 conformant
losses in 28 engines; four gates green with collected = on-disk.

## D11 — Execution rules
sep's: one worktree per task (`measurements/mkwt.sh`), no Serena edit tools in worktrees,
oracles only via `scripts/oracle-render.sh`, merge commits only, no push during the mission;
at exit merge into local main; the maintainer pushes main (GitHub is rebase-only).

## D12 — Out of scope
gantt; the ASCII `exportTxt` arm (`WBSDiagram.java:26-32`, no `-ttxt` in this port); the
colour-mapper residuals; renaming the mindmap-named style modules; mindmap's own
`getDefaultMargins()` read; `CommandMindMapDirection` (not in the WBS factory).
