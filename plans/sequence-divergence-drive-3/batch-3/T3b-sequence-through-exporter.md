# T3b — sequence exported through the one core exporter (D7 route ii)

Agent: `typescript-pro` (sonnet), worktree `sdd3-T3b`. Commit:
`fix(sequence): compose chrome before the export scale`.
Read [../task-contract.md](../task-contract.md) first, then
[../diagnosis/scale-chrome.md](../diagnosis/scale-chrome.md) in full.
Depends on T3a (merged `2e654466a`). Runs in parallel with T3d
(file-disjoint; see Boundaries). **The user chose D7 Amendment 1 route (ii)
(2026-10-23, journal row 53).**

## Mechanism (T3a, confirmed against the Java)

The jar exports every `TitledDiagram` through ONE `TextBlockExporter#exportTo`
(`core/TextBlockExporter.java:159-177`): the text block it receives is
already chromed (`UgDiagram.java:128` -> `DiagramChromeFactory.create`),
`calculateFinalDimension()` adds the Builder's margin (`:198-203`,
`:510-516`), `computeScaleFactor(dim)` derives the factor from THAT
dimension (`:205-209`), and the whole document is drawn through one scaled
`UGraphic` whose `SvgGraphics#format` multiplies then rounds once
(`klimt/drawing/svg/SvgGraphics.java:466-475`). The canvas is
`ensureVisible`'s `(int)(x + 1)` (`:129-135`) times the scale (`:800-813`).

The port has three copies of that tail and sequence has none:
- `core/TextBlockExporter.ts:288` `finalizeTitledDiagramFragment` (mindmap/
  wbs/salt): margin shift + anchor/regex scale + `trunc(dim+1)*scale`;
- `core/assemble-svg-activity.ts:164-191` `finalizeActivityFragment` and
  `core/assemble-svg.ts:282-307` `finalizeDescriptionFragment`: rect splice,
  `resolveScaleFactor`, `scaleActivityBody` (the deferred-format pass),
  `scaleShadowFilterDefs`, `scaledCanvas`, `width*factor`;
- sequence (`diagrams/sequence/renderer.ts:327-332`): the factor is taken
  from the UNCHROMED body (`geo.totalWidth/Height`), the body is scaled
  by `scaleSequenceGeometry`, and `index.ts` composes chrome at 1x
  afterwards — M1. `scale WxH`/`W height`/`W width` therefore see the
  wrong dimension — M2. A scale pass over 3-decimal numbers double-rounds
  `textLength` — M3 (`renderer-document.ts:82` withholds the margin-less
  block at k ≠ 1 so chrome cannot see the true block).

## Outcome (what "done" means)

1. `core/TextBlockExporter.ts` holds the ONE `exportTo` tail. Mindmap, wbs,
   salt, activity, description AND sequence finalize through it; the three
   duplicated factor/scale/canvas blocks are gone. Each engine's finalizer
   only splices its own rects first (`paintBackcolor` / `maybeDrawBorder`
   equivalents: `finalizeSequenceBody`, `activityBackgroundRect`,
   `documentBackgroundRect`), as `SvgGraphics`'s constructor and
   `maybeDrawBorder` run before `textBlock.drawU(ug)` (`:168-176`).
2. The tail's contract, documented on the function with the Java lines:
   - `dim` = `calculateFinalDimension()`: with `exportMargin` (the producer
     handed the RAW chromed block; mindmap/wbs/salt) it is
     `width/height + margin` and the tail applies the margin shift and the
     `trunc(dim + 1)` canvas itself; without it the producer already baked
     its margin, `exportedDimension` IS `dim` when set
     (`document-margin.ts:122-136`; sequence sets it from
     `sequenceExportedDimension` when chrome did not) and `width`/`height`
     are already the `ensureVisible` integers. Exactly these two arms —
     no third.
   - `factor = resolveScaleFactor(scaleSpec, dim.w, dim.h, dpi)`
     (`:205-209`).
   - body: `drawBodyAt` -> the anchor swap (unchanged); `numbersDeferred`
     -> the single format pass with the full vocabulary
     (`scaleActivityBody`'s attrs — move it and
     `ACTIVITY_EXTRA_SCALABLE_ATTR_RE` into the exporter module so
     `assemble-svg-activity.ts` imports it back, no cycle); a formatted
     body without either -> `scaleFragmentBody` (legacy, unchanged).
   - `extraDefs` through `scaleShadowFilterDefs` on every arm, unless the
     hash gate shows a mindmap/wbs/salt row moving — then keep it keyed
     and say why in the hand-back.
   - `scaledCanvas` and `width/height * factor` exactly as each arm emits
     today (the hash gate is the definition).
3. Sequence draws at `k = 1`, deferred when the document is export-scaled
   (`geo.scale` set or `theme.dpi !== 96` — the activity precedent
   `diagrams/activity/renderer.ts:431-434`), stamps `numbersDeferred`,
   `scaleSpec: geo.scale`, `dpi: theme.dpi`, and always declares the
   margin-less block (`preChromeDims` without the `k !== 1` guard,
   `renderer-document.ts:77-83`). `resolveScaleFactor` leaves
   `renderer.ts`. `scaleSequenceGeometry`/`scaleSequenceTheme` are identity
   at k = 1 (`scale-geo.ts:373-375`) and stay (cleanup is a follow-on, not
   this task). `canvasOf`'s scaled branch and `withExporterMargin`'s `k`
   are dead at k = 1: delete what is provably unreachable, cite the
   artifact's fold-in table.
4. `assemble-svg.ts#finalizeShellFragment` dispatches `SEQUENCE` to a
   `finalizeSequenceFragment` in `assemble-svg-sequence.ts` that splices
   the rects (`SvgGraphics.java:819-821` — before the scale), sets
   `exportedDimension` when absent, deletes `sequenceExportedDimension`'s
   unreachable third branch (`:104-108`), and calls the tail.

## Targets (15) — `ws` to 0
baketu-62-cumu838, tumuke-16-xomo243, dolefo-13-kovu702, javedu-98-pibi325,
kepuxa-88-juxu405, nabesa-52-nufu501, vikelu-53-faga789, jujigi-41-zodo151,
suzumi-85-nuzo693, bocudo-94-jode371, jesari-34-mudu065, regate-07-rore899,
mozoza-90-biru865, zavacu-31-dola792, zunile-23-zezi158.

## Write-set
`src/core/TextBlockExporter.ts` (305 lines — a 500-line split goes to
`src/core/TextBlockExporter-scale.ts`, journal it), `src/core/assemble-svg.ts`,
`src/core/assemble-svg-sequence.ts`, `src/core/assemble-svg-activity.ts`,
`src/diagrams/sequence/renderer.ts` (422 — split `renderPaginated` into a
wrapper + `drawPaginated` if the cap bites), `src/diagrams/sequence/
renderer-document.ts`, `src/core/dispatcher-types.ts` (doc comments on
`scaleSpec`/`numbersDeferred`/`exportMargin`/`exportedDimension` ONLY — no
type change: stop 10), `docs/catalog.md` (`npm run catalog` if exports
change). Tests: `tests/unit/core/TextBlockExporter.test.ts`,
`tests/unit/core/assemble-svg-activity-scale.test.ts`, the four sequence
tests the artifact lists (`command-link-anchor.test.ts:117-122`,
`else-tile.test.ts:76-86`, `sequence-layout-life-event.test.ts:232`,
`renderer-document-margin.test.ts:104-114` — re-express through
`assembleSvg(renderSequence(...))` with the SAME expected numbers), plus new
tests. **NOT in it:** `src/diagrams/sequence/sequence-warnings.ts` (T3d
owns it; its `margin === undefined` early return at `:63-71` becomes
unreachable after this task — report, do not edit), `src/index.ts`,
`core/annotations/chrome-export.ts`, `scale-geo.ts`, `core/UgDiagram.ts`,
`core/svg.ts`, any baseline or golden.

## Read-set
`diagnosis/scale-chrome.md`; `TextBlockExporter.java:159-235,505-516`;
`UgDiagram.java:123-145`; `SvgGraphics.java:129-135,466-475,800-822`;
`ScaleWidthAndHeight.java:48-55`, `ScaleHeight.java:46-48`,
`ScaleWidth.java:46-48`; `core/svg-format.ts:120-145`; `core/document-
margin.ts:95-136`; `core/annotations/chrome-export.ts:36-52`;
`diagrams/activity/renderer.ts:425-445`; `diagrams/description/index.ts:
141-156`; `tests/unit/mindmap/render-scale.test.ts`,
`tests/unit/mindmap/render-plugin.test.ts`,
`tests/unit/description/gtc-t6g-stereotype-shadowing.test.ts` (must keep
passing untouched).

## Gates (all before the commit)
- Tests first: one unit test per arm of the tail quoting
  `TextBlockExporter.java:159-177,198-209`; a sequence test: `scale`/`dpi`
  + title + sprite -> chrome and body share one factor derived from the
  chromed dimension.
- `npx tsx $T/classify.mts <wt>/cls.json` vs `$M/b3-m-T3a.json`: the 15 at
  0; the only riser allowed is `gepuce-64-pivu656` (its banner, A1 — T3d
  fixes it in parallel; report its number, do not touch it).
- Golden ratchet `sequence.golden.ratchet.test.ts`: all 1083 pins
  byte-equal (stop 6).
- `tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.test.ts`:
  two failures are EXPECTED and not yours (gepuce A1; the real-rise probe
  at `:385-391` uses baketu, now 0) — report them, no baseline write.
- **All-engine hash gate:** `npx tsx $T/svg-hashes.mts` on the base tip
  and on your tree; the only rows whose hash may change are the 15
  targets and gepuce. Any other row = stop 4 territory: name the mechanism
  or revert the change that moved it. Never `pkill -f svg-parity-survey`.
- `npm run typecheck`, eslint on your files, `vitest run tests/unit/core
  tests/unit/sequence tests/unit/mindmap tests/unit/activity
  tests/unit/description tests/unit/salt tests/unit/wbs
  tests/oracle/svg-conformance/sequence.*`.

## Acceptance
- Given a `scale`/`skinparam dpi` sequence with title and sprite, when
  rendered, then chrome and body share one factor derived from the chromed
  dimension (unit test quoting `TextBlockExporter.java:205-209`).
- Given the 15 targets, then each is zero-diff in classify.
- Given every other engine's rows, then render hashes are byte-identical.
- Given the 1083 pins, then all stay byte-equal.
- Given the three former scale/canvas blocks, then one remains, in
  `core/TextBlockExporter.ts`.

Observability: N/A — no new observable operations. Rollback: Reversible
(revert the task commit).
