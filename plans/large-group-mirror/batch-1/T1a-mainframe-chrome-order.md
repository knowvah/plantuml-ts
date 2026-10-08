# T1a — A2: mainframe sized as `DiagramChromeFactory` sizes it, every engine

**Agent:** typescript-pro (sonnet, high). Prompt = `common-rules.md` + this file.
**Worktree:** `measurements/mkwt.sh T1a`.

## Why
`DIVERGENCES.md` "`mainframe <label>` — rendered via a ported `BigFrame`
(CDD T34); non-class engines carry a sizing residual". Class is byte-exact
(`jakaja-15-faze022`) because `src/index.ts` re-applies
`applyClassDocumentMargin` after `applyChrome` (G2 N46), matching
`TextBlockExporter#calculateFinalDimension` running after
`DiagramChromeFactory.create`. The entry says the other engines' fragments lack
the ink-corrected `preChromeWidth`/`preChromeHeight`. At b0 the three
unknown-bucket fixtures it names are conformant; the five sequence fixtures
(decace-28, futaxe-10, gunecu-53, jutomu-49, zidova-39) diverge (ws 32-44).

## Do
1. **Measure first.** For each of the five sequence fixtures, list the diffs on
   the frame rect, the tab path and the title text, and the canvas
   width/height diffs, ours vs jar. Separate them from unrelated sequence diffs
   (render the same source without `mainframe` through both; the delta of
   deltas is the frame's).
2. **Read upstream.** The shared call is `TitledDiagram.java:476`
   (`DiagramChromeFactory.create(result, this, …)`, frame at
   `core/DiagramChromeFactory.java:126-133,275-336`). For sequence, find which
   `FileMaker` builds `result` on the default (puma) path and on teoz
   (`sequencediagram/teoz/SequenceDiagramFileMakerTeoz.java`): what box it hands
   the chrome (ink? `calculateDimension`? a margin-added box?), and where
   `calculateFinalDimension` / the document margin apply. Do the same for
   activity, state, description, mindmap, timing and json. Quote each.
3. **Author** a `mainframe` fixture per engine in that list (plus title,
   legend, caption, header/footer combinations on one sequence and one
   activity) and render the jar.
4. **Port** the jar's order once, in the shared chrome path, so each engine
   hands the frame the box upstream does. Delete class's special case if the
   shared path subsumes it (keep `jakaja-15-faze022` byte-exact). Mirror the
   change in every `render-fixture-*.ts` harness that duplicates `index.ts`
   chrome composition.
5. Survey all engines before/after (rule 11). Report every sequence ratchet
   row that moves.

## Exit
The frame rect, tab and title of all five sequence fixtures and every authored
fixture equal the jar's; the three unknown fixtures and jakaja stay conformant.
Exact DIVERGENCES.md text to retire the entry.
