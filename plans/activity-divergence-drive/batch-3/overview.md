# Batch 3 — drive round 2 (D6)

Written at the b2 close (2026-10-01, journal row 35). Cohort at b2: 73 rows
(un-pinned `baseline`, ws <= 100), every one assigned below with its named
mechanism (`fixtures.md` `task`/`mechanism`); 6 reveal-risen rows that left
the cohort stay with their family. Mechanisms come from the batch-2 agents'
re-slots, each verified by the orchestrator (journal rows 24-34). Source
write-sets are disjoint. Close per [close-procedure.md](../close-procedure.md)
(`b3`) — pin round 2.

| ID | Rows | Description | Agent | Writes (source) | Depends On | Done |
|---|---|---|---|---|---|---|
| [T3a](T3a-edge-order.md) | 10 | edge emission order and bars | typescript-pro | `src/diagrams/activity/{renderer,activity-renderer-bars}.ts`, `src/diagrams/activity/layout/edge-draw-order.ts` | T2-close | [x] |
| [T3b](T3b-walker-edges.md) | 12 | walker edges: hasPointOut gate, Snake merge, partition title, note spike | typescript-pro | `src/diagrams/activity/layout/{tile-coordinates,edge-point-dedupe,walk-fork-branches}.ts` | T2-close | [x] |
| [T3c](T3c-assembly-gap.md) | 4 | assembly gap 35 then compression | typescript-pro | `src/diagrams/activity/layout/tile-layout.ts`, `src/diagrams/activity/tiles/gtile-top-down.ts`, `src/diagrams/activity/activity-layout-constants.ts`, `src/diagrams/activity/layout/compress/**`, `src/diagrams/activity/layout/assign-coordinates-full.ts` | T2-close | [x] |
| [T3d](T3d-core-style.md) | 10 | shared-core style handlers and theme fields | typescript-pro | `src/core/skinparam-key-handlers-table-{a,b}.ts`, the `src/core/theme*.ts` field/default modules the handlers need, `src/diagrams/activity/{activity-style-defaults,activity-text-style}.ts` | T2-close | [x] |
| [T3e](T3e-creole-text.md) | 9 | creole and alignment in activity text | typescript-pro | `src/diagrams/activity/{activity-renderer-text,activity-text-placement}.ts`, `src/diagrams/activity/tiles/{gtile-action,gtile-label}.ts` | T2-close | [x] |
| [T3f](T3f-diamonds.md) | 19 | diamonds and conditions | typescript-pro | `src/diagrams/activity/{activity-renderer-shapes,activity-renderer-if-shapes,activity-renderer-terminals,parser,if-dispatch}.ts`, `src/diagrams/activity/layout/{diamond-labels,conditional-builder}.ts`, `src/diagrams/activity/tiles/gtile-diamond*.ts` | T2-close | [x] |
| [T3g](T3g-chrome.md) | 3 | document title / legend chrome | typescript-pro | `src/core/annotations/{chrome,blocks}.ts`, `src/index.ts` (only the chrome call) | T2-close | [x] |
| [T3h](T3h-backward.md) | 2 | backward: in repeat/while | typescript-pro | `src/diagrams/activity/tiles/{gtile-repeat,gtile-while}.ts`, `src/diagrams/activity/layout/{walk-repeat,walk-while-branch}.ts`, `src/diagrams/activity/list-backward-dispatch.ts` | T2-close | [x] |
| [T3i](T3i-swimlanes.md) | 7 | swimlane residuals | typescript-pro | `src/diagrams/activity/layout/{swimlane-placement,swimlane-lanes,swimlane-lane-origins,swimlane-context,canvas-origin}.ts`, `src/diagrams/activity/{activity-renderer-swimlanes,activity-style-defaults-swimlane}.ts` | T2-close | [x] |
| T3-close | — | b3, all-engine diff, re-pins, pin round 2, re-cut cohort | orchestrator | per close-procedure | T3a–T3k | [x] |

`open -> add2` at b2: `setecu-78-cuko533` (`preserveAspectRatio` hardcoded in
`src/core/klimt/document-shell.ts:197`, stop 8), `gufuma-85-zoce945`,
`fikuki-99-kulu790` (embedded `{{ }}` 42x42 oracle slot).

## Rules every family carries (D11 + batch-2 lessons, rows 7, 20, 27, 32)

- Worktree only (`measurements/mkwt.sh <Tn>`); absolute worktree paths.
  **No Serena MCP tools at all** — read tools included (three agents wrote
  the main checkout through Serena edits; one reported 'main untouched'
  falsely). Use Read/Edit/Write/Bash/ast-grep. No `git stash`; no push.
- Scratch files carry your task ID in the name (parallel agents share the
  session scratchpad; T2e overwrote T2c's script).
- Tests: edit only test files exercising your own source files; new test
  files get names unique to your task.
- Never write `oracle/**` JSON — `scripts/repin-activity-baselines.ts`
  WITHOUT `--write`, report its counts. Orchestrator re-pins and pins.
- The 55 pinned goldens must stay byte-equal; if one moves, stop and report.
- Every riser reported with its mechanism shown from the diff. Known reveal
  classes (journal 12, 21, 34): an attribute added inside a short-circuited
  subtree; a `points`/`d` list whose length now equals the jar's
  (`compare.ts:426-439` goes per-index); a corrected draw order pairing our
  element with its true counterpart.
- Every number carries an upstream `file:line`; a mechanism outside your
  write-set is re-slotted (report it), never forced. `src/core/klimt/**` is
  forbidden (stop 8); other shared `src/core/` modules only where your
  write-set names them.
- One commit per mechanism, `fix(activity): <mechanism>`.
