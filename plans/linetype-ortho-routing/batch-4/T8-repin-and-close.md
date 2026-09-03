# T8 — Re-measure all 8, re-pin, name every mover

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/linetype-ortho-routing`. T0–T7 have landed. T0's pin is the pre-change
evidence; this task converts the gap into a recorded result.

**Orchestrator-executed** — baseline JSON writes are reserved to the
orchestrator (`scripts/repin-sequence-baselines.ts:3-8`).

## Task
1. **Re-measure all 8** through the same seams T0 used. Record the same
   eight fields, plus the delta against T0.
2. **Name every mover with a mechanism.** A moved fixture with no stated
   mechanism is an adopted regression — stop condition 1's whole point.
3. **Re-pin** what actually moved, and only that:
   - `tests/oracle/svg-conformance/parity-{class,state}.json`, `parity.json`
   - `oracle/goldens/state/size-backlog.json` — **tighten only.** A loosened
     entry is stop condition 4; that file's own header demands a jar-verified
     account for any loosening.
   - `tests/visual/data/*.json` — only if it moved.
   - `oracle/goldens/svg-conformance/splines-baseline.json` — the post-change
     state.
4. **Restate the headline**: `pavuzo-79-zodu430` scope 2 width idx 2, from
   `-1.579968 px` to its measured value. Expected ~0.002 px.
5. **Close the tracker**: `docs/graphviz-issues/TRACKER.md` — check 03, and
   move 17 from `[~]` to `[x]` if `pavuzo` re-measures clean. Both entries'
   comment blocks already predict this mission; update them with the result
   rather than rewriting them.

## Write-set
- `oracle/goldens/svg-conformance/splines-baseline.json`
- `tests/oracle/svg-conformance/parity-class.json`, `parity-state.json`,
  `parity.json`
- `oracle/goldens/state/size-backlog.json`
- `tests/visual/data/*.json` (only if measured to have moved)
- `docs/graphviz-issues/TRACKER.md`
- `.agent-notes/lor-T8.md`

**Nothing under `src/`.** If the re-measurement suggests a source change,
that is a finding for the note, not an edit.

## Read-set
- `plans/linetype-ortho-routing/decisions.md` — all six
- `oracle/goldens/svg-conformance/splines-baseline.json` — T0's pin
- `plans/linetype-ortho-routing/decision-journal.md` — what T4–T6 recorded
- `docs/graphviz-issues/TRACKER.md` — entries 03, 16, 17
- `.agent-notes/gvi17-splines-never-emitted.md` — the original diagnosis

## Architecture decisions
[D5] `splinesOk` gates `dotEqual` — verify it did not flip anything outside
the 8 · [D6] the assertion was proven in T7; cite that here.

## Interface contracts
Consumes T0's pin shape verbatim. Produces the same shape, post-change, plus
a `deltaVsT0` per fixture.

## Acceptance criteria
- Given each of the 8, then its delta vs T0 is recorded **and named with a
  mechanism** — no silent adoption.
- Given `pavuzo-79-zodu430`, then the residual is ~0.002 px, or the
  deviation is explained rather than accepted (stop condition 5).
- Given `size-backlog.json`, then every touched entry **tightened**; a
  loosened entry halts (stop condition 4).
- Given any fixture **outside the 8** that moved, then STOP (stop condition 1).
- Given `TRACKER.md`, then 03 is checked (its consumption finally happened)
  and 17 is resolved, each citing this mission.
- Given all four gates, then green with `Test Files` == **685**.

## Observability
This task produces the mission's headline number. Report it.

## Rollback
**Reversible.** All JSON + docs, regenerable by re-running against the tree.
Note the whole-mission caveat: reverting source while keeping tightened pins
leaves the shrink-only ratchets unsatisfiable.

## Quality bar
All four gates green. The activity mission's own lesson applies here: its
incremental re-pin scripts only wrote fixtures whose score ROSE, leaving most
pins stale between commits. **Re-pin unconditionally**, every fixture, from a
fresh measurement — not just the movers.

## Commit
`test(lor-T8): re-pin the splines fixtures and close graphviz-issues 03/17`

Body: the headline delta, every named mover, confirmation that nothing
outside the 8 moved, and that `splinesOk` was proven to discriminate in T7.
