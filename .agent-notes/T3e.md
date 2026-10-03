## T3e (add2 batch 3) — core style fields: execution summary

- **Context**: mission `activity-divergence-drive-2`, task T3e
  (`plans/activity-divergence-drive-2/batch-3/T3e-core-style.md`),
  worktree `add2-T3e`, branch `add2/T3e`. Families G/F/K/DARK/H.
- **Confidence**: High — every number below is a fresh
  `scripts/activity-probe.ts` / `svg:survey` run against this branch's
  own commits, not copied from a prior report.

## Commits (4, each green: targeted vitest + typecheck + eslint)

1. `f73e4fc32` feat(activity): add skinparams for aspect-ratio/underline/fontname
2. `b3901936a` feat(activity): forward preserveAspectRatio to the SVG root (family G)
3. `2dadf450b` feat(activity): honor hyperlinkUnderline/svgLinkTarget on url runs
4. `6b1977109` feat(activity): add activityFontFamily resolver (family K)

## Java → ours (file:line)

- `SkinParam.java:1085-1087` (`getPreserveAspectRatio`, raw passthrough,
  default `DEFAULT_PRESERVE_ASPECT_RATIO`) + `SvgGraphics.java:813-815`
  (root attribute consumer) → `theme.preserveAspectRatio`
  (`src/core/theme-root-fields.ts`), `preserveaspectratio` key handler
  (`src/core/skinparam-key-handlers-table-c.ts`), `renderActivity`
  (`src/diagrams/activity/renderer.ts`) forwarding it onto
  `RenderFragment.preserveAspectRatio` — the exact gap add2 T2d's own
  doc comment named (no Theme field, no producer).
- `SkinParam.java:1056-1060` (`useUnderlineForHyperlink`:
  `valueIs("hyperlinkunderline","false")==false` keeps the underline) →
  `theme.hyperlinkUnderline` + `hyperlinkunderline` handler; consumed by
  `activity-renderer-text.ts#fontConfigForRun` (strips
  `FontStyle.UNDERLINE` from a **link run only**, gated on
  `run.url !== undefined`, so a user's own creole underline on
  non-link text is never touched).
- `SkinParam.java:1080-1082` (`getSvgLinkTarget`, raw passthrough,
  default `"_top"`) → `theme.svgLinkTarget` + `svglinktarget` handler;
  consumed by `drawCreoleUrlLine`'s `linkWrap(..., style.svgLinkTarget)`
  call (`core/svg.ts#linkWrap`'s own `target` param already defaulted
  to `'_top'` — only the forwarding was missing).
- `FromSkinparamToStyle.java:144` (`addConFont("activity",
  SName.activity)` registers the flat `activityFontName` key →
  `PName.FontName` on `SName.activity`) + `StyleSignatureBasic.java:
  271-273` (diamond's own signature nests `SName.activity`, so it
  inherits the same bucket for free) → `activityfontname` handler
  (`src/core/skinparam-key-handlers-table-c.ts`, same pattern as the
  pre-existing `activitydiamondfontname`) + new
  `activityFontFamily(theme, sname)` resolver
  (`src/diagrams/activity/activity-text-style.ts`), shaped exactly
  like the existing `activityFontColor` bucket tier.
- `AtomText.java:179-181` (family H, numbered-list 10px height floor):
  lives in `src/core/klimt/creole/legacy/AtomTextUtils.ts` — confirmed
  under `src/core/klimt/**`, forbidden by this mission's hard rule
  (stop 8). Not touched; re-slotted (see below).
- `TitledDiagram.java:291-294` + `SkinParam.java:114-116` (family DARK):
  confirmed the gap is NOT in `theme-dark.ts` — read the jar's own
  `@media (prefers-color-scheme:dark)` block
  (`resources/skin/plantuml.skin:674-694`): it sets NO
  `activity`/`diamond`-specific `BackgroundColor`/`BorderColor` at all
  (only `swimlane`, `note`, `activityDiagram.partition`,
  `activityDiagram.circle`, `activityDiagram.activityBar`). Action-box
  and diamond fill/stroke are meant to inherit the ALREADY-SEEDED root
  dark defaults (`DARK_MODE_DEFAULTS.background`/`.border`, applied by
  `skinparam-theme-builder.ts#applyDarkModeDefaults`, pre-existing). The
  real defect is that `activity-style-defaults.ts` never reads
  `theme.colors.background`/`.border`/`.text` at all (grep confirmed
  zero occurrences) — its resolvers return hardcoded light constants
  unconditionally regardless of `theme.mode`. That file is `T3d`'s
  write-set (`activity-style-defaults*.ts`, per the batch-3 overview),
  not mine. Not touched; re-slotted (see below).

## Per-row / per-family status

| family | row(s) | before → after | status |
|---|---|---|---|
| G | setecu-78-cuko533 | ws 1 → 0 | **CLOSED** (conformant) |
| F | pekuxe-00-bovi270, gaxezi-48-zesa921, nisexe-68-vabu320 | unchanged | re-slotted — mechanism complete at the text/svg layer, blocked on `activity-renderer-shapes.ts#renderAction` (outside write-set) |
| K | dozaxu-98-xetu961 (K component of K+I+L) | unchanged | re-slotted — resolver ready, blocked on `activity-renderer-shapes.ts`/`activity-renderer-if-shapes.ts` (outside write-set) |
| DARK | levuma-67-cego489 (DARK component of DARK>RNOOUT) | unchanged | re-slotted — root dark defaults already seed correctly; the consuming file (`activity-style-defaults.ts`) is outside write-set |
| H | letare-59-gore448 (H component) | unchanged | re-slotted — owning file is under `src/core/klimt/**`, forbidden (stop 8) |

Rows reaching 0: **setecu-78-cuko533** only (family G, fully closed).

## Probe Σ (full corpus, `scripts/activity-probe.ts`)

- Baseline (branch head before T3e, commit `9a6efd52a`): **Σ 27577**.
- After commit 2 (preserveAspectRatio wired): **Σ 27576** (−1,
  setecu-78-cuko533 falls to 0; `risers (0)`, `fallers (1)`).
- After commits 3 and 4 (F/K consumption, both inert by design — no
  caller outside this task's write-set populates the new fields yet):
  **Σ 27576** (unchanged), confirmed by a fresh probe run after each.
- **Final Σ: 27576. 0 risers at every step.**

## Per-engine survey verdict changes (shared-core touch)

Ran a true before/after on THIS branch: a detached worktree at this
branch's own parent commit (`9a6efd52a`, no T3e edits) vs this working
tree (`9a6efd52a` + all T3e edits, pre-commit), via
`npm run svg:survey -- <engine>`, SEQUENTIALLY (memory:
`confounded-wall-clock-readings`/parallel-survey-false-timeouts)
for `class`/`state`/`sequence`/`component`/`usecase`/`mindmap`/`object`:

- **class**: 709/2/12 both sides. Diffed per-slug verdict: **0 moves**.
- **state**: 73/12/188 both sides. **0 moves**.
- **sequence**: 0/0/1141 both sides. **0 moves**.
- **component**: 65/67/134 both sides. **0 moves**.
- **usecase**: 28/19/46 (1 oracle-error) both sides. **0 moves**.
- **mindmap**: 137/1/4 both sides. **0 moves**.
- **object**: 63/8/9 both sides. **0 moves**.

`NO_CONFORMANT_LOSS` confirmed on every engine — in fact zero verdict
movement of ANY kind, consistent with the change being purely additive
(new optional fields/keys nothing previously read).

One methodology note for future tasks: an EARLIER comparison against
the repo's *committed* `tests/oracle/svg-conformance/parity-class.json`
(generated 2026-09-30, now stale relative to this branch's HEAD)
showed a spurious 1-row "move" (`gadufu-56-votu808`:
`structural-match` → `conformant`). Re-measuring against a true
same-commit before/after (detached worktree) showed this fixture was
identical on both sides — the apparent move was entirely due to
unrelated commits landed on `main` between the committed snapshot's
generation date and this branch's HEAD, not anything in T3e. Matches
memory `measurement-artifacts-outnumber-defects`: always diff against
a same-commit baseline, never a stale committed snapshot, when the
claim is "my change didn't move X".

## Risers

**None.** `risers (0)` at every probe run, both before and after each
commit.

## Re-slots (mechanism + owning file, per acceptance criterion's
second branch)

- **F** (`pekuxe-00-bovi270`/`gaxezi-48-zesa921`/`nisexe-68-vabu320`):
  `theme.hyperlinkUnderline`/`theme.svgLinkTarget` exist and are fully
  consumed by `activity-renderer-text.ts` when present on
  `ActivityTextStyle`. The ONE remaining step: the action-node label
  builder (`activity-renderer-shapes.ts#renderAction`) must forward
  `theme.hyperlinkUnderline`/`theme.svgLinkTarget` into the
  `ActivityTextStyle` literal it builds — that file is outside this
  task's write-set (owned by T3d per the batch-3 overview).
- **K** (`dozaxu-98-xetu961`): `activityFontFamily(theme, sname)`
  exists (`activity-text-style.ts`) and the `activityfontname`
  skinparam already populates `theme.colors.elements['activity']
  .fontFamily`. The two remaining call sites that hardcode
  `theme.fontFamily` instead of calling this resolver —
  `activity-renderer-shapes.ts:135,155` and
  `activity-renderer-if-shapes.ts:128,142,144` — are outside this
  task's write-set (T3d's).
- **DARK** (`levuma-67-cego489`'s DARK component): no file in this
  task's write-set needs a change — `theme-dark.ts`'s existing
  `background`/`border`/`text` root defaults are already the correct
  jar-faithful fallback (confirmed against the `.skin` file's own
  `@media` block, which gives `activity`/`diamond` no override of
  their own). The defect is that `activity-style-defaults.ts` never
  reads those three fields at all — owning file `activity-style-
  defaults.ts` (T3d's write-set per the overview). The row's other
  component, RNOOUT (`FtileRepeat.java:136-137` zero-width hexagon vs
  jar's `FtileEmpty`), is explicitly T3b's family, unrelated to this
  re-slot.
- **H** (`letare-59-gore448`'s H component): mechanism confirmed
  (`AtomText.java:179-181`'s 10px height floor, missing from
  `ListNumberAtom.calculateDimension` in
  `src/core/klimt/creole/legacy/AtomTextUtils.ts`); file is under
  `src/core/klimt/**`, forbidden by this mission's hard rule (stop 8).
  No action possible from this write-set.

## Quality gates

- `npx tsc --noEmit -p tsconfig.json` and `npx tsc --project
  tsconfig.node.json --noEmit`: clean.
- `npx eslint` on every touched/new file: clean.
- Targeted vitest: `tests/diagrams/activity`, `tests/unit/activity`,
  `tests/unit/core` (covers the new skinparam/theme tests),
  `activity.golden.ratchet.test.ts`, `activity.diff-baseline.ratchet
  .test.ts`, `activity.harness-parity.test.ts`: **410 files, 7360
  passed, 1 pre-existing skip, 0 failed.** No pinned golden moved (the
  ratchet test's own byte-equality assertion is part of that green
  run) — none was touched (`oracle/goldens/**`/`oracle/pin.json`
  untouched, confirmed by `git status`).
- No `npm test` / full-suite run (forbidden by task rules); all runs
  targeted vitest invocations. No Serena MCP tool used (hard rule); no
  `git stash`; no raw `&` background jobs (the one long-running
  7-engine survey auto-backgrounded by the tool harness itself, waited
  on via its own notification, not a manual `&`).

## Not done / why

- **Pinning** (`oracle/goldens/svg-activity/**`, `oracle/pin.json`):
  explicitly the orchestrator's job at batch close per
  `close-procedure.md` step 8 — not this task's. setecu-78-cuko533 is
  now zero-diff and ready for that step.
- **F/K/DARK/H consumption**: all four re-slotted above with an exact
  owning file and, for F/K, an exact line range — nothing further is
  achievable from this task's write-set (`src/core/{theme*,
  skinparam-*}.ts`, `src/core/svg.ts`, `src/core/dispatcher.ts`,
  `activity-{text-style,renderer-text}.ts`, `renderer.ts`).
- `src/core/dispatcher.ts`/`src/core/svg.ts` were read but not edited:
  `dispatcher.ts`'s `RenderFragment.preserveAspectRatio` field already
  existed (T2d); `svg.ts`'s `linkWrap` already took an optional
  `target` parameter defaulting to `'_top'` — both needed zero changes,
  only a caller that now supplies the resolved values.
