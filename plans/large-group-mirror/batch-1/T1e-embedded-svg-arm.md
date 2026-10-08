# T1e — embedded `{{ }}` diagrams sized by the jar's SVG arm (user-ordered)

**Agent:** typescript-pro (sonnet, high). Added by the orchestrator after the
user ordered option 1 (journal rows 13, 16). Worktree `measurements/mkwt.sh T1e`.

## Why
The oracle seam reported `matchesProperty("SVG") = false`, so
`EmbeddedDiagram#calculateDimensionSlow` (`EmbeddedDiagram.java:126-152`) took
the PNG arm, threw, and reserved 42x42. Seam #3 (fork `37c07dce45a`, committed
here as b92305594) fixed the oracle: the jar now takes the SVG arm
(`java:129-133`: `UImageSvg(getImageSvg(fileFormat), 1)` width/height) as the
stock jar does. The port had FITTED the artefact in the description family:
`src/core/svek/image/EntityImageDescriptionEmbed.ts:65` throws on purpose to
reach the 42x42 catch (and `console.error`s a stack each time —
`src/core/EmbeddedDiagram.ts:428`). Other `{{ }}` paths take the TeaVM arm
(`java:142-146`, the inner TextBlock's dimension), which may differ from the
SVG arm's exported-document size.

## Do
1. Read `EmbeddedDiagram.java` whole (sizing AND `drawU`), `UImageSvg.java`
   (width/height source), and how `getImageSvg` exports the nested diagram
   (document margins, `TextBlockExporter`). Quote each.
2. Measure on the re-captured fixtures (orchestrator lists the movers from
   `measurements/b1o-eng` vs `b1-eng`): our embed slot vs the jar's, per path.
3. Port the SVG arm once in `EmbeddedDiagram.ts` so every `{{ }}` consumer
   (description, class, activity, sequence, state, creole) sizes the slot as
   the jar does; delete the description throw-to-42x42 path and its comment.
   No `console.error` remains on the normal path.
4. Rule 11 survey (b1o is the before); element counts.

## Write-set
`src/core/EmbeddedDiagram.ts`, `src/core/svek/image/EntityImageDescriptionEmbed.ts`,
`src/core/svek/image/leaf-sizing-folder.ts`, `src/core/svek/image/EntityImageDescriptionDelegates.ts`,
`src/core/klimt/shape/UImageSvg.ts`, any nested-renderer registration in `src/index.ts`
(name it), `tests/fixtures/lgm-T1e/`, its tests.

## Exit
Every re-captured fixture's embed slot equals the jar's; no stack traces on
the normal path; 0 conformant losses; the 4 non-deterministic fixtures
(kovaxi-11, zidebi-71, runima-82, pixisi-38) excluded from equality claims.
Exact DIVERGENCES.md text retiring "Embedded `{{ }}` diagram slots: the
deterministic-text oracle reserves 42×42".

## Measured (orchestrator, b1 → b1o: new oracle, port unchanged)
Became conformant (port already sized by the real nested size): activity
fikuki-99, gufuma-85, mufixi-71, pufuzi-99; unknown semutu-45-zeno907.
Lost conformance (port reproduced the 42x42 artefact): class gadufu-56-votu808,
moxobo-16-tipo829, zikabo-17-gugi332; unknown josebu-55-seje426,
kelefe-72-cefi192, komuvi-52-vave599, rojida-14-fuli428, rozugu-82-pera583,
tefeco-12-rato895. Sequence scores and element counts unchanged. Exit adds:
all 9 back to conformant, the 5 stay conformant.
