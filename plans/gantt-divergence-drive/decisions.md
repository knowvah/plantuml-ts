# gdd decisions (D1–D9, user-approved 2026-10-27)

Every decision carries the Java it rests on. Evidence not in the Java (the
probes) is from the planning session, 2026-10-27, scratchpad renders through
`renderFixtureGantt` + `ganttRenderOptions` with `DeterministicMeasurer`.

## D1 — none/transparent equality (xureco-57-lene839): option B, the equality seam

Java: `AbstractCommonUGraphic.java:61-62` seed `backColor` and `color` with
`HColors.none()`; `HColors.java:133-135` returns the `TRANSPARENT` field, an
`HColorSimple` whose `XColor` is `(0,0,0,0)`. `DriverPathSvg.java:64-68` takes
the fast path when `color.equals(back)` (and neither is a gradient): fill =
`color.toSvg`, stroke colour `""`, stroke width 0 — no `style` attribute.
Ours: `AbstractCommonUGraphic.ts:53,106-107` seed both with the string
`'none'` (`Paint`), so a link `with transparent link` (an `HColorSimple`
transparent) never equals the back and `driver-path-svg.ts:41-44`
`paintsEqual` returns false → `style="stroke:none;"` on three paths.

**Decision.** `paintsEqual` treats the string `'none'` and a transparent
`HColorSimple` as equal in both orders (they are the same `HColors.none()`
upstream; `HColorSimple.equals` compares the `XColor`, `XColor.java:91-98`).
Gradients stay unequal (java:64-65). One file, one caller. The all-engine chain
runs after the commit (stop 4/15): any `<path>` drawn with a transparent colour
over the default back in any engine moves TOWARD the jar; nothing else moves.

**Not chosen.** Option A (seed the transparent singleton and retire
`NONE_PAINT`, 10 consumer files: `EmbeddedDiagram.ts`, `SymbolContext.ts`,
`USymbolStack.ts`, `AbstractCommonUGraphic.ts`, `StripeTree.ts`,
`driver-dot-path-svg.ts`, `TextBlockLineBefore.ts`, `ActorStickMan.ts`,
`Cluster.ts`, `Control.ts`) is the full mirror of the representation and goes
to `planning/next-missions.md` as its own measured mission (exit batch).
Option C (a gantt-only branch) is forbidden by the porting rules.

## D2 — hidden footer under top chrome (xikovo-87-rosu902): diagnose, fix at the origin

Probe (jar via `scripts/oracle-render.sh`, ours via the harness), canvas
heights: title+hide footbox jar 90 / ours 82; header+hide 51 / 43;
title-only 98 / 98; hide-only 55 / 55; caption+hide 49 / 49; order of the
two lines irrelevant. The body is byte-identical. The jar is additive
(`GanttLayout.java:103` total = rows + footer(0) = 55, title 35 on top); ours
loses exactly the 8 px `getTimeFooterHeight` would have added, only when a top
chrome block is present. `GanttLayout.ts` and `GanttDiagramMainBlock.ts`
mirror the Java line for line (`calculateDimensionSlow`, java:152-158), so the
origin is in the chrome composition: gantt `index.ts:254-281` (`rawTextBlock`
hands `dim`, `drawBodyAt`, `exportMargin`) → `chrome-export.ts` →
`chrome.ts:375-386` (`height: fragment.preChromeHeight ?? fragment.height`,
`frameInkOf` = `inkOfBody` when no `frameInk`) → `TextBlockExporter.ts:395`.
Java: `DiagramChromeFactory.java:125-135` (`addTitle` 363, `addCaption` 382,
`addHeaderAndFooter` 402), `TextBlockExporter.java:159-209`,
`UgDiagram.java:123-131`.

**Decision.** T1b produces the artifact (mechanism, origin `file:line`,
causal chain, ruled out, proposed write-set) with no code change; T2a fixes
at the origin. If the origin is `src/core/annotations/`,
`src/core/TextBlockExporter.ts` or `src/core/document-margin.ts`, the fix is
core: no gantt-only branch, all-engine chain after the commit. If it is
`src/diagrams/gantt/index.ts`, it mirrors what the other exporting engines
(wbs/salt/mindmap `rawTextBlock`) hand over. Three authored fixtures pin it.

## D3 — emoji in separator names and note bodies: fixtures first, then the store

Java: `TaskDrawSeparator.java:123-129` builds the title with
`new SpriteContainerEmpty()` — the same empty container as ours — and still
draws artwork because `Emoji.java:175-181` reads the Twemoji from a static
registry. `AbstractTaskDraw.java:215-226` builds the note sheet from
`skinParam.sheet(...)`. Ours draws emoji only from the injected store that gep
T8c threaded (`AbstractTaskDraw.ts:255` `getEmojiStore()` →
`emojiStoreOf(skinParam)`); `TaskDrawSeparator.ts:124` and
`AbstractTaskDraw.ts:279` still construct `new SpriteContainerEmpty()` with
no store, so an emoji there is dropped (`AtomEmoji.ts:113-127` null-colour
fallback, `driver-text-svg.ts:142`).

**Decision.** T0c authors `emoji-separator` and `emoji-note` with jar oracles
(stop 13 if the jar errors). T1c passes the store into both sites
(`new SpriteContainerEmpty(undefined, this.getEmojiStore())` or the
separator's equivalent through its skin param), adds no text fallback (Java
has none), leaves header/day/load numbers alone (they cannot carry emoji,
gep journal row 90). Output without a store stays byte-identical.

## D4 — nakude-77-suji787 and mogafu-27-jeci360: no code

nakude: the jar's oracle prints the same `Gantt diagrams cannot last more than
20 years (Assumed diagram type: gantt)` under the Welcome block
(`GanttDiagram.java:172-181` `checkFinalError`; `PSystemError.java:217-218`
adds the Welcome block to sources under 5 lines). Ours prints the same
message at the same line; element census and canvas (532×284) match; the
remaining diffs are attribute order and the ruled classes. mogafu: an error
page on both sides (`Bad argument for resource`, line 5), canvas 384 vs 376
only through the version-string line (ruled). **Decision.** Close both in
`fixtures.md` at the batch-1 close with these quotes; no accepted-divergence
entry, no `DIVERGENCES.md` line, no pin (rule-conformant rows are not pinned,
gep journal row 86).

## D5 — pin tooling

`pin-gantt.mts` (gep T7p) pins whatever slugs it is given; the gep b7 close
pinned 11 rule-conformant rows by mistake (`.agent-notes/gep-execution.md`).
**Decision.** T1d copies it to `$M/pin-gantt.mts` and refuses a slug listed in
`oracle/accepted-divergences.json` or whose `in.svg` is a stock error page
(`oracle/goldens/stock-error-pages.json`), naming the reason; dry-run stays
the default. T1d's test pins the three refusals and one accepted pin.

## D6 — gates and measurement (inherited from gep)

Four gates before every close (`gates.sh`, `--maxWorkers=4`, collected =
on-disk); all-engine chain at every close and after every core commit; 0
conformant losses in 28 engines vs b0; `dist/plantuml-ts.d.ts` byte-identical
to `$M/b0-plantuml-ts.d.ts`; every constant cites its Java `file:line`; a
pin only when every changed row moved toward the jar.

## D7 — branch and commits

`feat/gantt-divergence-drive` off origin/main `01fe0c79b` (PR #94 merged
2026-10-27; local main is behind — T0a `git checkout main && git pull
--ff-only`, then `npm ci` for the dependabot bump of typescript-eslint and
vite). One unsigned commit per task, Conventional Commits, no attribution;
`--no-ff` task merges; never push; main never merged in. The squash batch
rebuilds one commit per batch with `git commit-tree` from the close trees,
tags `gdd/pre-squash`, and hands the user `git rebase --force-rebase -S
01fe0c79b`.

## D8 — target

Gantt 265/265 conformant; xureco and xikovo byte-pinned (252 → 254 goldens);
the five authored fixtures byte-equal to their oracles in the authored
baseline; 0 conformant losses in the other 27 engines; 0 unexplained rises. A
miss needs a named mechanism and an owner in `fixtures.md`.

## D9 — out of scope, filed

Our title/header `<g>` lacks `data-source-line` (`DiagramChromeFactory.java:
373-374, 409-410` put the command's `LineLocation` on the `UGroup`);
`tests/oracle/svg-conformance/normalize.ts:16` strips every `data-*`
attribute before comparison, for every engine. A comparator-wide blind spot:
the exit batch files it in `planning/next-missions.md`; this drive does not
chase it.
