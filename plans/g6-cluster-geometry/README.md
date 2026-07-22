# G6 — State Cluster Geometry (mechanism 16 continuation)

## Objective

Continue the still-authorized cluster queue from the closed G5 mission
(`plans/g5-measurer-calibration/README.md`, "Next iteration (C9)" section):
(0) root-cause and fix the cluster VERTICAL/height residual (~1-6px),
(1) drive gojuja/decede/cakaxu/fevida to byte-exact zero-diff pins,
(2) derive jar's real multi-line/action-text/stereotype title-table
height formula, (3) implement the entrypoint/exitpoint family's
WithLabel port-block sizing as a jar port. Target: continue mechanism 16
toward the ~112-fixture unlock. WIDTH is already jar-exact (84/84) —
the side-margin mechanism (`innerMarginLevels`/`unwrappedNodeId`) is
final; do NOT re-derive it.

## Branch

`feat/g6-cluster-geometry` off `main`. Merge back with a **merge
commit** (never squash — per-task commit IDs are referenced in the
decision journal). One commit per task: `feat(T3): ...` /
`fix(T3): ...` per `~/.claude/rules/commits.md`.

## Batches

| Batch | Scope | Tasks | Status |
|-------|-------|-------|--------|
| [1](batch-1/overview.md) | Vertical/height residual (diagnose → fix at origin) | T1, T2 | [x] |
| [2](batch-2/overview.md) | Byte-exact pins: class attr, decede style, pin sweep | T3, T4, T5 | [x] |
| [3](batch-3/overview.md) | Multi-line/action-text/stereotype title height | T6, T7 | [x] |
| [4](batch-4/overview.md) | Entrypoint/exitpoint WithLabel family | T8, T9, T10 | STOPPED (stop cond. 8 / D5 — see summary) |

Batches are strictly sequential (each gates the next). Within batch 2,
T3 ∥ T4 may run in parallel (disjoint write-sets); T5 waits for both.

## Docs

- [decisions.md](decisions.md) — D1-D5 architecture decisions (locked)
- [decision-journal.md](decision-journal.md) — append during execution
- [diagrams/component-map.md](diagrams/component-map.md)
- [diagrams/data-flow.md](diagrams/data-flow.md)
- G5 evidence (read-only): `plans/g5-measurer-calibration/ledger.md`
  §C3 (WithLabel queue item), §C5 (title queue, decede style), §C7
  ("NEW residual" — the vertical gap evidence table), §C8 (per-fixture
  mechanism attribution)

## Quality Gates (run after every batch)

```
- command: npm test
  pass: exit 0 (includes DOT gate + census floors + ratchets)
  on_fail: fix_and_rerun
- command: npm run typecheck
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0
  on_fail: fix_and_rerun
- command: git diff --name-only <batch-start>..HEAD
  pass: only files in the batch's declared write-sets
  on_fail: stop
```

Hard bars carried from G5 (non-negotiable, apply to every task):
- `oracle/goldens/state/size-backlog.json`: tighten improved entries,
  **widen NONE**. If landing a change would require widening any entry,
  revert in full (G5 protocol: `git show HEAD:<path> > <path>`, verify
  clean, re-run gates), then STOP.
- DOT gate stays frozen exact at every commit; census floors never
  shrink (state 52/271 at mission start).
- Oracle jar SVGs are the spec; measurement technique is
  `data-qualified-name`-matched box extraction (see ledger §C7/C8).
- `~/.claude/rules/diagnosis.md` discipline: no fix before a stated
  mechanism (cause, file:line, causal chain, ruled-out list).

## Stop conditions

1. Files outside the declared write-set need changes.
2. Two consecutive gate failures on the same check, or 3 consecutive
   fix attempts at one code location.
3. A change contradicts decisions D1-D5.
4. Landing would require widening any size-backlog entry (revert
   first, then stop).
5. A diagnosis task (T1/T6/T8) cannot state a mechanism within budget
   — journal ruled-out list + next instrumentation, stop the batch.
6. The fix appears to require touching either out-of-scope mechanism:
   the `ctx.insideAutonomPass` gate (bajelo/rovese/fotuje) or SvekEdge
   label placement (nimana/beguxu). Each needs its own sign-off.
7. graphviz-ts path only: the upstream fix's blast radius grows beyond
   the cluster rank-separation area of the library.
8. Batch 4 only: the jar WithLabel path cannot be cleanly isolated.
   A geometric approximation is NEVER the fallback (D5).

## Push-forward conditions (decide autonomously, journal it)

- Widening *measurement*: add fresh sample fixtures to any diagnosis
  or verification sweep (measure the guard set, not just named
  symptoms).
- Tighten backlog entries beyond plan; pin extra fixtures that
  incidentally reach zero-diff.
- File `docs/graphviz-issues/` entries (required for any verified
  library finding, before the iteration closes); delete disposable
  probes; minor seam-type additions that directly express T1's stated
  mechanism.
- A task turns out simpler than specced — journal why, proceed.

## Execution rules

- Subagents never run git mutations; the orchestrator commits after
  each task's gates pass (shared-worktree rule).
- Subagents use Serena MCP tools for symbol navigation (not LSP) and
  run `npm run typecheck` as their post-edit bar.
- Out of scope entirely: `insideAutonomPass` relaxation, SvekEdge
  placement port, any re-derivation of the side-margin mechanism.

## Mission summary (closed 2026-07-22)

**Tasks: 7 of 10 completed** (T1-T7 done; T8 done ×2 rounds but spec
incomplete; T9 stopped after 2 authorized attempts; T10 not run).

**Landed** (all gates green at every commit; branch tip 10192 tests):
- Batch 1: cluster vertical residual root-caused and fixed —
  title-table HEIGHT 3→9 (jar-exact heights on the single-line set).
- Batch 2: `class="cluster"` emission (D3); decede's full
  `<style>stateDiagram{}</style>` cascade (D4) incl. FontColor,
  RoundCorner, arrow colors; **svg-state pins 52→57** (fevida +
  gageze/lasasi/lukuma/soxene), backlog 92 entries, widened none.
- Batch 3: jar's derived title-table height formula (D2) replacing the
  constant; lineCount gate relaxed; multi-line (37), attr (28), and
  stereotype (23) cases oracle-verified.
- Batch 4 salvage: pure `FrontierCalculator` port + 9 unit tests
  (unwired, `60fe88a`).

**Stopped:** batch 4's border-point (WithLabel) geometry — two
derivation rounds + two implementation attempts; all predictions
missed; every attempt fully reverted (zero behavior change). Blocking
unknown: T8-R2 and T9 obtained CONTRADICTORY minimal-repro results
for graphviz-ts's in-cluster `rank=source/sink` handling (height
change vs width-margin-only). Resolve that contradiction first;
candidate graphviz-ts finding, not yet filed (fails the "verified"
bar).

**Decisions:** 14 journal rows; 5 flagged for review (T3 renderer.ts
write-set amendment; T4 theme.ts/style-map-theme.ts amendment; T9
corrected write-set; the batch-4 continuation ruling; the batch-4
stop + repro contradiction).

**Follow-ups carried:** cakaxu −1.5 edge-label rank-spacing;
kideju B/A nested-margin composition; `__zaent_` edge-id leak
(gojuja+cakaxu); gojuja −5px band shift + start-edge spline; decede
half-pixel bands; `skin debug` unimplemented; batch-4 repro
contradiction (all detailed in decision-journal.md / batch-2 residual
section).
