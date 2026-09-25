# Mission: `class-divergence-drive-3`

**Branch:** `feat/class-divergence-drive-3` off `origin/main` (`e3afcd4a0`) ·
**Planned:** 2026-09-25 · **Task prefix:** `cdd3` · **Merge:** merge commit
(per-task commit ids are cited in the journal).

Read `~/.claude/docs/reference/autonomous-execution.md` in full at mission
start and after every compaction. Then this file, then
[`decisions.md`](decisions.md). Everything else is linked from here.

## Objective

Drive the class SVG parity survey (`parity-class.json`, 723 fixtures) to
full compliance: conformant = 723 − 11 accepted divergences = **712**. It
stands at **607 / 55 / 61** (`measurements/b-plan.json` = the prior
mission's `final.json`), so **105 fixtures** remain, in five workstreams
([`fixtures.md`](fixtures.md)): **A** ready — fully diagnosed, blocked last
mission only by write-sets (~20); **B** dot-engine owned (~17, verify
only, D2); **C** named but unfixed (~16); **D** layout-precision policy
(gatula, ririlu — D3); **E** undiagnosed (~45). Batch 0 diagnoses C + E
and verifies B; batch 1 lands A; batches 2–4 are written by T6 from the
diagnoses; batch 5 runs the D3 measured task and the exit close.

The Java at `~/git/plantuml/src/main/java/net/` is the spec. Every task
re-reads the cited method bodies before editing and ports the WHOLE
method it touches.

## Exit bar (D1)

- conformant ≥ **670** (floor); target 712 (realistic ceiling ~695
  until a dot-engine release, D2)
- every one of the 105 fixtures conformant, OR carrying mechanism + owner
  in `fixtures.md` `final`, OR an evidence-backed acceptance proposal
  (D6)
- zero conformant losses, zero unexplained rises at every re-pin
- class DOT parity green (`tests/oracle/class-dot-parity.test.ts`)
- other-engine verdict movers vs the T0 baseline survey journaled
- four gates green with JSON-reporter collected count = on-disk count

## Quality gates — all four before every commit

```sh
npm test              # vitest + 90/90/90 coverage; never a path filter
npm run typecheck     # both tsconfigs
npm run lint
npm run build
```

Batch closes add survey, census, render-all, pin-diff, pins —
[`close-procedure.md`](close-procedure.md). Render oracles only with
`scripts/oracle-render.sh`; never rebuild the cache.

## Batches

| Batch | Group | Tasks | Parallel | Done |
|---|---|---|---|---|
| [0](batch-0/overview.md) | pre-flight + diagnosis (C, E) + B verify | T0 · T1–T5 · T6 | T1–T5 ∥ | [x] |
| [1](batch-1/overview.md) | A — ready fixes | T7 · T9 · T11 · T8 · T10 · T12 · T13 | T7 ∥ T9 ∥ T11, then serial | [x] |
| [2](batch-2/overview.md) | structure (from T6) | written by T6 | per T6 | [ ] |
| [3](batch-3/overview.md) | paint / text / glyph (from T6) | written by T6 | per T6 | [ ] |
| [4](batch-4/overview.md) | geometry / scale / canvas (from T6) | written by T6 | per T6 | [ ] |
| [5](batch-5/overview.md) | D3 measured task + exit close | T-D3 · T-exit | — | [ ] |
| [final](final/T-close-out.md) | close-out | T-close-out | — | [ ] |

Every batch ends with its close task (one residual round first), then
[`close-procedure.md`](close-procedure.md).

## Stop conditions

1. A task needs a file a CONCURRENTLY RUNNING task owns (D4)
2. The same gate fails on two consecutive fix attempts, or the same code
   location changes 3 times without resolving the same failing check
3. A finding contradicts D1–D7 — amend `decisions.md` and halt
4. A conformant class fixture leaves conformant, or a `dotEqual` flips
   true→false, without a stated mechanism
5. A diff-count rise the batch cannot mechanise (a structural fall with a
   numeric rise is a reveal, not a stop)
6. Class DOT parity goes red
7. Any survey timeout, or JSON-reporter collected ≠ on-disk count
8. Anything that would change the pinned oracle (jar symlink, `pin.json`,
   cache `--rebuild`)
9. More than 20 non-class verdict movers vs the T0 baseline survey
10. A fix needs an epsilon, rounding tie-break or fitted value (the D3
    task is the only sanctioned rounding change, on its criterion)
11. A dot-engine mechanism confirmed by a real-`dot` probe — file/update
    `docs/graphviz-issues/`, halt that task only
12. An accepted-divergence proposal (D6) — pause that fixture only, record
    the proposal for maintainer sign-off, continue
13. A batch-0 mechanism disproved by measurement — journal the
    measurement before a new approach; the fix counter does not reset

Push-forward conditions: [`decisions.md#push-forward`](decisions.md#push-forward).

## Documents

- [`decisions.md`](decisions.md) — D1–D7, push-forward
- [`fixtures.md`](fixtures.md) — 105 rows: workstream, task, mechanism, final
- [`close-procedure.md`](close-procedure.md) · [`diagnosis-task.md`](diagnosis-task.md) ·
  [`fix-task.md`](fix-task.md) — shared skeletons
- [`diagnosis/`](diagnosis/) — batch-0 reports (T1–T5)
- [`diagrams/component-map.md`](diagrams/component-map.md),
  [`diagrams/data-flow.md`](diagrams/data-flow.md)
- [`decision-journal.md`](decision-journal.md) — append-only
- `measurements/` — `b-plan.json`, then `b0.json` … one per close
- Tools (reused in place): `plans/class-divergence-drive/tools/`
  (`render-diff.mts`, `render-all.mts`, `pin-diff.mts`; T0 adds
  `pin-goldens.mts`)
- Prior missions, for mechanism history: `plans/class-divergence-drive-2/`
  (journal rows 1–48, `diagnosis/`, `.agent-notes/cdd2-T*.md`),
  `plans/class-divergence-drive/`; open owners in
  `planning/next-missions.md` (`class-divergence-drive-2` and
  `class-divergence-drive` sections)
