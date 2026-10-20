# Family-task contract (batches 2, 3)

Every family task's spec includes this file by reference. Read it first.

## Context shared by every family
plantuml-ts is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml/src/main/java/net/` is the spec. Read the method body that
draws your element and the constructor that built its inputs, and cite
`file:line` for every value. Never fit a number (stop 12). Mirror the jar's
output exactly — every element it draws and nothing it doesn't.

Before sdd1 the sequence engine resolved style from constants and
`theme.colors` / `theme.sequence`. Batches 1/1b landed the seam:
- `src/diagrams/sequence/sequence-skin-param.ts` (T1a): `componentStyle`,
  `messageStyle`, `participantStyle`, `noteStyle`, `groupingStyle`, …,
  `paintOf(style, colorSet): SequencePaint`.
- Every `Participant`, `SequenceEvent` and `BoxGroup` carries the
  `styleBuilder` captured at its command line (T1b).
- Every geo node has `readonly paint?: SequencePaint` (T1c; `FrameGeo` also
  has `headerPaint`). **Do not edit `scale-geo.ts` or any `geo*.ts`.**
- `paint` is NOT scaled in `scale-geo.ts` (journal row 19): the jar scales
  every number at emission (`SvgGraphics.java:466-468` `format`, `:555-561`
  `setStrokeWidth` for widths and dashes). The port's renderers already
  multiply by `theme.scaleK` at emission, so YOU multiply `paint.thickness`,
  the dash lengths and every other length you emit from `paint` by
  `theme.scaleK` in the renderer.
- `paintOf(style, colorSet)` returns LAZY getters: read only the fields your
  component reads (a lifeline's dark-only `BackGroundColor` throws on read).
  `paint.stroke`/`paint.fill` are `Paint` (a gradient survives).

Real export names differ from earlier drafts (journal rows 10, 18):
`messageStyle(b, stereotype?, arrowColor?)` (no url; `AbstractMessage.java:
66-77`); `participantStyle(b, kind, stereotype?, url?, colors?) → {style,
stereo}`; `groupingStyle(b, type, header, backColor?)` with `GroupingType =
'START'|'START_PARTITION'|'ELSE'|'END'`; `referenceStyle(b, header)` (the
header's `BackGroundColor` override from `Reference.java:99-101` is the
caller's); `dollStyle(b, stereotype?, boxColor?)` is the box (englober)
style. `BoxGroup.styleBuilder` is the builder at the END of the parse
(`Doll.java:81-83`). `SpaceEvent` has no builder (`HSpace.java:42`). A
frame's `else` branches carry `FrameEvent.branchStyleBuilders`, aligned with
`branchLabels` (`ElseTile.java:98`). A `skinparam` takes effect from its
own line onward (T1e).

## What a family task does
1. Read the `ComponentRose*` class(es) for the family and the event class
   that resolves its `Style` (constructor-time vs use-time — D2). Write the
   list of every `Style` read the component makes in the commit body.
2. Layout: where the family's geo node is built, resolve the `Style` from
   the node's `styleBuilder` exactly where upstream does and set `paint`.
3. Renderer: draw from `geo.paint` — stroke color, `stroke-width`, dash,
   fill, `rx`/`ry` (= RoundCorner / 2, as `SvgGraphics` emits it — quote the
   line), font. Emit attributes in the form and order the jar emits them
   (compare against a golden `in.svg`).
4. Delete the family's `theme.colors.*` / `theme.sequence.*` reads for every
   style-owned property in the same commit (D5). That includes
   `theme.colors.graph.sequenceShadowing` (today resolved ONCE per document
   by `src/core/sequence-shadowing.ts` through `build-theme.ts:84-86` — its
   own head comment says per-event capture is "Not modelled"): read
   `paint.shadowing` instead in your files. `sequence-shadow.ts` /
   `sequence-layout-note-shadow.ts` are T3b's; the core module, the
   `build-theme` hook and the field are T3c's. A theme field left with no
   reader: delete it if it is in your write-set, otherwise journal it for
   T3c.
5. Tests first: a default-skin unit test per element (expected values cite
   `plantuml.skin:N`); one test per family skinparam the old theme path
   honoured (e.g. `participantBorderThickness`, `lifelineBorderColor`),
   proving it now arrives through the Style path; one `<style>` test.
6. Measure: `npx tsx plans/sequence-divergence-drive/tools/classify.mts
   <worktree>/cls.json`, and list per-row `ws` movement for the rows whose
   diffs touch your family. Report every riser with its mechanism.

## Boundaries (all families)
- Write only your write-set. A needed file outside it is stop 1: report,
  do not edit.
- No edit under `src/core/style/**`, `src/core/klimt/**` (stop 8). If you
  need an upstream `core/style` member the port lacks, STOP and report it
  (class, method, `Java file:line`): the orchestrator ports it under D4
  Amendment 2 and resumes you.
- No Serena edit tools (they write the MAIN checkout); no `git stash`.
- No baseline or golden writes — the orchestrator re-pins and pins at close.
- Quality bar: targeted vitest (`tests/unit/sequence/**` for your files +
  `tests/oracle/svg-conformance/sequence.*`), `npm run typecheck`, eslint on
  your files. Coverage 90/90/90 on what you touch.
- Observability: N/A — no new observable operations. Rollback: Reversible.

## Hand-back (one block, no prose)
commit SHA · files changed · Style reads ported (`file:line` each) · theme
fields deleted / left for T3c · classify movement (fell / rose with
mechanism) · open questions.
