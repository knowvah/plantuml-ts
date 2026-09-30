# Plan Mission Progress — class-divergence-drive-6

## Phase 1: done
- Stack: TypeScript 6 ESM library, pure synchronous SVG pipeline
  (preprocess -> theme -> extractBlocks -> registry.resolve -> parse ->
  layoutSync (graph-layout.ts -> @knowvah/dot-engine) -> render). No DOM,
  no async in src/. Java spec at ~/git/plantuml (dot-output = 97a5992 + 2
  seam commits); oracle jar 1.2026.8beta1 (cdd5 re-pin).
- Gates: `npm test` (vitest + 90/90/90; run with `--maxWorkers=6` under
  load, check JSON-reporter collected = on-disk), `npm run typecheck`,
  `npm run lint`, `npm run build`. Catalog drift gate: `npm run catalog`.
- Measurement: `npm run svg:survey -- <e> --out <path>`; census
  `npx jiti scripts/svg-conformance-census.ts class --json <path>`;
  tools `plans/class-divergence-drive/tools/` (render-all `--tree`,
  render-diff `tree/slug`, pin-diff, pin-goldens `--tree`).
- Starting state (main 0f3998f57, pushed): class 708/3/12 (15 non-conformant,
  all accepted); unknown-tree CLASS (288) 225/26/37; ratchet 930;
  routing/refusal manifests 5924. cdd5 ledger: 62 rows open -> cdd6,
  4 accept-candidates (plans/class-divergence-drive-5/fixtures.md).
- Map: src/diagrams/class/ (engine), src/core/ (style-map, creole, svek,
  tim, graph-layout), tests/oracle/svg-conformance/ (gates),
  oracle/goldens/svg-class/{,unknown/} (ratchet).

## Phase 2: confirmed
Scope (user: "go with your recommendations on all five"):
- IN: A style-map -> class Theme (13 rows), B canvas ink (12), C embedded
  {{ }} skinparam hoist/leak + nested-render gaps (2 + secondaries),
  D creole/text incl. hyperlinkColor on UText FontConfiguration (9),
  E class parsing/relationships incl. '>>' head + C4 $bl() split (6),
  F layout items needing verification first (9), I harness (dotEqual nested
  embeds, pragma regex, newpage page count, error-page minute guard).
- G smetana-pragma-ignored (4): IN, structure only (never chase numbers).
- H embedded mindmap/salt engines: OUT (own missions).
- Non-class: IN as one task — forward ParseOptions.assetStore in the
  state/sequence/activity/json(+yaml/hcl) plugins; state-json duplicate
  refusal (kokofa) with it; non-class mover budget applies.
- Accept-candidates (vakovo, rubebe, sapofa, petiku): left unsigned.
- No data model / public API change; internal Theme/ElementColors and
  UText FontConfiguration gain optional fields; dot-engine off limits.

## Phase 3: confirmed ("approve all twelve")
D1 verify-first batch only for doubtful rows (json 1px, zasuxe order, rojida
shift, circle ink, empty-usymbol containers, C4 $bl(), mainframe); real dot
before dot-engine blame; unresolved -> open -> cdd7.
D2 style values via existing ElementColors buckets + style-cascade-class-*,
keyed by upstream SName signature, Java cite per field; no second style path.
D3 optional hyperlinkColor on UText FontConfiguration + ISkinSimple
getHyperlinkColor, populated by the 3 skin-simple builders.
D4 separate ensureVisible extent for degenerateClassifierDims only.
D5 ink walk reuses the draw-time EntityImageDescription; folder/package gets
its own walk (measureFolderLeaf geometry).
D6 state/sequence/activity/json(+yaml/hcl) plugins forward assetStore like
class/description (class/parser.ts:317-318); fixture renderers then forward.
D7 shared-code changes: all 28 engines surveyed at each close vs previous;
>30 non-class movers or any conformant loss = stop; every mover needs a mechanism.
D8 smetana: structure only; numeric residue = accepted delta.
D9 harness fixes in batch 0 (observer scoped by EmbeddedDiagram depth, pragma
regex ignores comments, newpage page-1 DOT only, minute guard in rebaseline +
capture scripts).
D10 exit bar: every in-scope row mechanism + final; 0 losses; 0 unexplained
rises; gates green, collected = on-disk; target = b0 CLASS conformant +
scheduled rows, miss allowed when journaled.
D11 cdd5 execution rules (worktrees, targeted tests, no Serena edits / git
stash, git diff HEAD before merge, catalog regen, --maxWorkers=6, no push).
D12 dot-engine off limits (file issues); acceptances unsigned; mindmap/salt out.

## Phase 4: confirmed ("looks right, continue")
- Observability = harness: CLASS conformant count, class verdicts, per-engine
  conformant losses (0), non-class movers per close (budget 30, D7), class DOT
  parity, collected = on-disk. Dashboard docs/parity-report.md per close.
- Rollback: every task Reversible (git revert); merge revertible; no push.
- Scale: suite runtime; --maxWorkers=6; >25% runtime growth vs b0 journaled.
- Failure modes: shared-code regression (D7 survey -> stop, revert task);
  agent writes main checkout (git diff HEAD before merge); oracle artifact
  mistaken for defect (batch 0 instruments; plain-minute re-render).
- Back-compat: public API unchanged; optional internal fields only; no consumers.

## Phase 5: confirmed ("looks right, continue")
B0: T0a branch+seed ledger (orch); T0b survey harness (observer nestedDepth,
pragma comment, newpage page-1) [graph-layout.ts, EmbeddedDiagram.ts,
svg-parity-workers.ts / new scripts/lib/survey-dot-equal.ts, svg-parity-survey.ts];
T0c minute guard [new scripts/lib/oracle-minute-guard.ts, rebaseline-svg-goldens.ts,
capture-oracle-cache.ts]; T0d verify doubtful rows (debugger opus, read-only)
[diagnosis/verify.md]; T0e close b0 (orch, target, re-slot).
B1: T1a style-map core (opus) [style-map-element.ts, theme-graph-colors*.ts,
skinparam-stereo-keys.ts, skinparam-key-handlers-table-{a,b}.ts,
skinparam-accumulator.ts]; T1b hyperlinkColor [UText.ts, core/style/ISkinSimple.ts,
CommandCreoleUrl.ts, EntityImageDescriptionDelegates.ts, EntityImageDescriptionName.ts,
blocks-creole.ts]; T1c assetStore non-class + state-json dup [state/sequence/
activity/json/yaml/hcl index+parser, sequence-parse-helpers.ts, state-json-commands.ts,
render-fixture-{state,sequence,activity,json}.ts, svg-conformance-census.ts];
T1d '>>' head [class-relationship-parser.ts, class-arrow-grammar.ts,
class-arrow-decor-map.ts]; T1e preprocessor $bl split + embedded skinparam
[preprocessor.ts, preprocessor-collector.ts].
B2: T2a class style consumers (opus) [class-cluster-header.ts, class-package-style.ts,
class-namespace-usymbol-shape.ts, class-empty-package.ts, renderer.ts,
renderer-usymbol-entity.ts, renderer-empty-package-leaf.ts]; T2b ink walk reuse
[leaf-sizing-entity.ts, class-layout-description-leaf-ink.ts, class-ink-box.ts,
leaf-sizing-folder.ts]; T2c degenerate ensureVisible + empty-usymbol ink
[class-geo-builders.ts, class-layout-leaf-shapes.ts, class-container.ts];
T2d class text [class-edge-label-measure.ts, renderer-edge-label.ts,
class-edge-label-attach.ts, renderer-note.ts, renderer-note-lines.ts,
note-layout-measure*.ts]; T2e singles [class-json-sizing.ts,
EntityImageDescriptionTextBlock.ts, UHorizontalLine.ts, theme.ts, class-monochrome.ts].
B3: T3a empty graph 21x21 + json 1px + zasuxe per T0d [graph-layout.ts + T0d-named];
T3b mainframe (opus) [big-frame.ts, chrome.ts, layout-ink-extent.ts, src/index.ts];
T3c smetana structure [class-command-directives.ts, ast.ts, renderer-edge.ts,
renderer-group.ts]; T3d portin + package-visibility DOT title (opus)
[class-dot-clusters.ts, class-dot-graph.ts, class-port-rows.ts,
class-namespace-title-table.ts, class-command-containers.ts]; T3e link-middle-decor +
nested-render gaps [class-layout-edge-labels.ts, class-edge-note-box.ts,
renderer-arrowhead-middle.ts, sequence/renderer-participant-symbol.ts,
description/parse-state.ts].
B4: T-exit, T-close-out (orch). Deps: T0e gates B1; T1a -> T2a; T0d may
rewrite T2c/T3a/T3e rows+write-sets at b0 close (journaled).

## Phase 6: confirmed ("looks right, continue")
Stops 1-13 and push-forward list as presented (write-set collision; 2 gate
failures / 3 edits; D contradiction; unexplained conformant loss or dotEqual
true->false; unexplained rise; class DOT parity red; collected != on-disk after
--maxWorkers=6 or survey timeout at load<8; >30 non-class movers; dot-engine/fork
edit or push; oracle change except plain-minute error-page re-render; signed
acceptance; public API change; D2 escape hatch).

## Phase 7: done
Brief written to plans/class-divergence-drive-6/ (README, decisions D1-D12,
close-procedure, batch-0..4 overviews + 20 task specs, diagrams (3 PlantUML
blocks, oracle-render verified), decision-journal, settings.autonomous.json ->
.claude/settings.autonomous.json). Two families missed in Phase 5 slotted:
sprite-ambient-stroke -> T1b, descriptive-leaf-with-members -> T2e;
embedded-engine-unported -> open -> cdd7 at T0a (scope H). 58 rows scheduled.

## Phase 8: FLAGGED (not passed)
- write-set paths: all exist (new files' parents exist) — pass
- observability + rollback in every spec — pass
- branch feat/class-divergence-drive-6 absent — pass
- working tree NOT clean: 18 files modified by someone else (dependency bumps
  in package.json/package-lock.json/.github/dependabot.yml + ~320 lines in
  src/ and tests/, apparently a prettier 3.9.9 pass) — must be committed or
  stashed by their owner before T0a branches
- test/lint baseline: last verified green on committed main 0f3998f57 (cdd5
  close: 893/893, lint/typecheck/build green); not re-run on the dirty tree
