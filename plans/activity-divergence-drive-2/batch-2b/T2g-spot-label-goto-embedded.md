# T2g — circle spot, label/goto, embedded diagram (D6 follow-on)

Agent: typescript-pro, worktree `add2-T2g`. Added after T2e (journal row 31).

## Context
T2e made 34 refused rows parse (`.agent-notes/T2e-parser-gaps.md`), but three
constructs are consumed without a node — swallowing, which D6 forbids:
- `(A)` / `#blue:(B)`: `CommandCircleSpot3.java:82-86` -> `diagram.addSpot` ->
  `InstructionSpot` -> `FtileCircleSpot` (read them). `tiles/gtile-spot.ts`
  is a half-port ("Local until ast.ts is extended"). Rows: nipuxu-11-tefa314,
  vilecu-41-tete416, zaloze-31-jibo311.
- `label NAME` / `goto NAME`: `ActivityDiagram3.java:139-151` add
  `InstructionGoto`/`InstructionLabel` (`ftile/FtileGoto.java`,
  `ftile/FtileLabel.java`, `ftile/GotoInterceptor.java`), and set
  `LinkRendering.none()` for the next link. Rows: getene-72-dido571,
  kiceze-91-luke737.
- `{{ ... }}` inside a multi-line action: the embedded diagram renders as an
  image in the jar (`EmbeddedDiagram.java`); ours prints it as literal text.
  Rows: mufixi-71-koma752, pufuzi-99-vone170. Check how other engines in this
  repo render `{{ }}` (grep `EmbeddedDiagram`/`embedded` under `src/`) and
  reuse that path; memory: deterministic-text oracles reserve 42x42 for every
  embedded diagram (an instrument artefact — never fit it).

## Task
Port each construct 1:1 (AST node kind, tile, walker, renderer), quoting the
Java. Measure each row against its `in.svg`.

## Write-set
`src/diagrams/activity/{ast,list-backward-dispatch,node-dispatch,renderer,activity-renderer-shapes,activity-renderer-terminals}.ts`,
`src/diagrams/activity/layout/tile-layout*.ts`, `src/diagrams/activity/tiles/{gtile-spot,tile,index}.ts`,
new tile/walker files; NOT `layout/tile-coordinates.ts` (T2h) — dispatch a new
kind via a new walker file and a one-line `walkTile` arm only if unavoidable;
report it. Not T2c's files (`conditional-builder`, `walk-if-down`,
`gtile-diamond*`, `activity-renderer-if-shapes`, style/text files).

## Acceptance
- Each row's construct is drawn as the jar draws it (or the residual is named).
- 0 unexplained risers; pinned goldens byte-equal.
