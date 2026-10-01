# Batch 2 — drive round 1 (D6)

Written at the b1b close (2026-10-01, journal row 21). Every open cohort row
(ws <= 100 at `measurements/b1b-classify.json`, 88 rows) is assigned to one
family below with a named next mechanism (`fixtures.md` `task`/`mechanism`).
T2e and T2f are push-forward families (mechanisms no planned family owned).
Every family task runs in its own worktree; SOURCE write-sets are disjoint.
A row needing two families is re-slotted to the later one. Close per
[close-procedure.md](../close-procedure.md) (`b2`) — pin round 1.

| ID | Rows | Description | Agent | Writes (source) | Depends On | Done |
|---|---|---|---|---|---|---|
| [T2a](T2a-draw-order.md) | 16 | draw order: if branch-label / connector order; repeat connectors | typescript-pro | `layout/{tile-coordinates,walk-repeat,edge-draw-order,walk-if-down,walk-if-long-horizontal,diamond-labels,conditional-builder}.ts` | T1c | [ ] |
| [T2b](T2b-walker-childcount.md) | 2 | `kill`/`detach` as mutation | typescript-pro | `layout/tile-layout.ts`, `tiles/{gtile-top-down,gtile-kill}.ts`, `node-dispatch.ts`, `dispatch-support.ts` | T1c | [ ] |
| [T2c](T2c-renderer-order.md) | 17 | edge/text/style: arrow colour, arrow font colour, arrow thickness, preserveAspectRatio, diamond FontSize, creole url/table/`%n()`/`____`, multiline label count | typescript-pro | `{renderer,activity-renderer-text,activity-renderer-bars,activity-style-defaults,activity-text-style,activity-text-placement,arrows-regular,parser}.ts` | T1c | [ ] |
| [T2d](T2d-tile-geometry.md) | 14 | tile geometry: if-with-links, split with long branch, `end` inside an if branch | typescript-pro | `tiles/gtile-*.ts` except `gtile-{top-down,kill,note,partition}`, `layout/{walk-if-with-links,walk-while-branch,walk-fork-branches}.ts`, `activity-layout-constants.ts`, `if-dispatch.ts`, `parallel-dispatch.ts` | T1c | [ ] |
| [T2e](T2e-canvas-lanes-chrome.md) | 14 | canvas residuals: far-corner +1/+2, arrowhead polygon ink, LaneDivider `UEmpty` ink + lane title band, title/legend chrome | typescript-pro | `layout/{canvas-origin,assign-coordinates-full,swimlane-placement,swimlane-lanes,swimlane-lane-origins,swimlane-context}.ts`, `activity-renderer-swimlanes.ts`, `index.ts` | T1c | [ ] |
| [T2f](T2f-node-shapes.md) | 23 | node shapes: closed diamond/hexagon polygons, end-cross diagonal, note path/fill, rect stroke + gradient, `ConditionEndStyle hline`, partitions, start/stop colour cascade | typescript-pro | `activity-renderer-{shapes,if-shapes,signal-shapes,terminals}.ts`, `tiles/{gtile-note,gtile-partition}.ts`, `group-dispatch.ts` | T1c | [ ] |
| T2-close | — | b2, all-engine diff, re-pins, pin round 1, re-cut cohort, write batch-3 | orchestrator | per close-procedure | T2a–T2f | [ ] |

All source paths are under `src/diagrams/activity/`. `open -> add2` at b1b:
`gufuma-85-zoce945`, `fikuki-99-kulu790` (embedded `{{ }}`: the deterministic
oracle reserves a 42x42 slot, memory `oracle-seam-embedded-42x42` — an
instrument artefact, never a port target).

## Rules every family task carries (D11 + b1/b1b lessons)

- Worktree only (`measurements/mkwt.sh <Tn>`); absolute worktree paths.
  **No Serena edit tools** (they write the main checkout — journal row 7) and
  no Serena project activation in `plans/` (row 20); no `git stash`; no push.
- Tests: edit only the existing test files that exercise your own source
  files; new test files get names that cannot collide with another family's.
- Never write `oracle/**` baseline JSON — run `scripts/repin-activity-
  baselines.ts` WITHOUT `--write` and report its counts. The orchestrator
  re-pins and pins at the close.
- The 39 pinned goldens must stay byte-equal (`activity.golden.ratchet`);
  if your change moves one, stop and report.
- Every riser is reported with its mechanism shown from the diff (`--dump`,
  per-family weight before/after), not asserted. Known reveal class: a
  correct attribute added inside an already short-circuited subtree costs
  +1 per attribute (`compare.ts:189-193`, journal rows 12, 21).
- Every number carries an upstream `file:line`; a mechanism not reachable
  in your write-set is re-slotted (report it), never forced.
- One commit per mechanism, `fix(activity): <mechanism>`.
