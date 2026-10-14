# Mission: description-svek-wrappers (dsw)

Follow-ons 1–3 of the dot-engine 2.4.0 bump (`planning/next-missions.md`, "dot-engine 2.4.0 bump").

**Read at start and after every compaction:** `~/.claude/docs/reference/autonomous-execution.md`
(brief structure, compaction sequence, gates, commit discipline), then this file,
[decisions.md](decisions.md), [task-preamble.md](task-preamble.md), [close-procedure.md](close-procedure.md),
the tail of [decision-journal.md](decision-journal.md), and `.agent-notes/dot-engine-2.4.0-bump.md`.

## Objective

The description engine lays every group out without the jar's svek protection wrappers. The jar wraps
each non-swimlane group as `cluster<N>p0 > cluster<N>` (title `<TABLE>` sized by `ClusterHeader`)
`> cluster<N>p1` (`ClusterDotString.java:107-155,299-314`). Our `buildDotClusters`
(`src/diagrams/description/layout-dot-tree.ts:242`) sets only a plain-text `label`. The jar DOT has
`p0` wrappers in 85 component, 18 usecase, 169 unknown and 4 c4 fixtures. **None of the 51 description
ratchet pins has one.** `dotEqual` reports these rows equal because `compareStructural` compares
cluster membership sizes only (component shows "DOT equal 259/263" at 0/13/253 conformant).

The mission does three things:
1. Builds a **layout-parity gate**. It lays out our builder graph and the jar's `svek-1.dot` with
   dot-engine 2.4.0 in-process and compares bb, node sizes, positions, edge `pos` and the cluster tree.
2. **Tightens `dotEqual`** to see the wrapper chain and title-table size.
3. **Ports the wrappers and the DOT-side `ClusterHeader` sizing** into the description engine, then
   diagnoses deroxu's port-table node sizes.

Follow-on 4 (xenusu/pavuzo/rubebe/zuduxu post-layout) is **out of scope**; T11 files it.

## Branch

`feat/description-svek-wrappers` from main `650f08bcc`. One worktree branch per code task (`dsw/Tn`),
merged `--no-ff` at each batch close; merged to main as a merge commit at exit. **Never push.**

## Quality gates (all four before any merge to the mission branch or main)

`npm test` · `npm run typecheck` · `npm run lint` · `npm run build`; plus `npx prettier --check`
on every changed file (worktrees skip the husky hook).

## Stop conditions (halt, journal, report)

1. A task needs a file outside its write-set (beyond a pure type move or a complexity-hook split).
2. The same gate check fails on 2 consecutive fix attempts, or one code location changes 3 times
   without resolving it.
3. A Java reading contradicts a D-decision, or a fix would need a non-library-forced divergence.
4. A conformant fixture in **any** engine stops being conformant, or a layout-parity pin goes
   unequal, with no stated mechanism.
5. Tightened `dotEqual` flips true→false on any **class/object/state** row. Description/unknown/c4
   flips are expected and each must carry a `clusterTree`/`titleTable` reason.
6. A diff-baseline score rises with no mechanism, or a census attr moves away from the jar with no reason.
7. A change is needed in a **shared core builder** (`src/core/graph-layout-build*.ts`,
   `svek-dot-wrappers.ts`, `svek-dot-emit*.ts`) to make description wrappers work. This needs a ruling.
8. layoutParity disagrees with native `dot -Tdot` on a fixture where both were run.
9. Any edit to dot-engine, the plantuml fork, the oracle jar or cached oracle bytes; any push.
10. Signing an acceptance or accepted-divergence entry. Retiring a now-conformant one is fine.
11. T8 finds deroxu's mechanism outside description's write-set: file it, do not fix.
12. Collected ≠ on-disk after a `--maxWorkers=4` rerun, or a survey row times out under the gate.

## Push-forward (decide, journal, continue)

- A pure type move or complexity-hook split; journal its consumers.
- A unit-test pin update explained by a measured mechanism and a Java quote.
- A residual fix in a description file no other task owns: stated mechanism, one commit with a test.
- A write-set the spec under-estimated for work the approved task covers: extend, journal, resume.
- Re-slotting a residual to a later batch, or filing it, once its mechanism is stated.
- `npm run catalog` when exports change; dashboard regen at each re-pin.
- Brief corrections found in the Java: journal, flag for review.
- Starting a batch before the previous close finishes when its dependencies are code-only.
- A survey chain starved by foreign load: raise the gate in a scratch copy; journal it.

## Execution

| Batch | Tasks | Parallel | Done |
|---|---|---|---|
| [0](batch-0/overview.md) branch + b0 | T0 | — | [x] |
| [1](batch-1/overview.md) gate, tightened dotEqual, header sizing | T1a ∥ T1b ∥ T1c (+T1d) | all ∥ | [x] |
| [2](batch-2/overview.md) survey column + ratchet; wrappers (plain) | T2 ∥ T3 | ∥ | [x] |
| [3](batch-3/overview.md) wrappers (port + kermor); dashboard regen | T4 ∥ T5 (+T4b/c, T4d) | ∥ | [x] |
| [4](batch-4/overview.md) measure b4 + re-pin; residual triage | T6 → T7 | — | [x] |
| [5](batch-5/overview.md) deroxu | T8 → T9 (cond.) → T10 | — | [x] |
| [6](batch-6/overview.md) exit | T11 | — | [x] |

## Index

- [decisions.md](decisions.md): D1–D8 (pre-made; do not re-argue)
- [task-preamble.md](task-preamble.md): prepend to every agent prompt
- [close-procedure.md](close-procedure.md): standard batch close
- [fixtures.md](fixtures.md): named fixtures, jar facts, per-batch ledger
- [diagrams/component-map.md](diagrams/component-map.md) · [diagrams/data-flow.md](diagrams/data-flow.md)
- [decision-journal.md](decision-journal.md): append-only
- [settings.autonomous.json](settings.autonomous.json): permission profile (copy already at `.claude/settings.autonomous.json`)

**Observability:** survey verdicts, `dotEqual`, `layoutEqual`, ratchet pins, census and diff-baseline
are the SLIs; each close journals them against the b0 sha. **Rollback:** Reversible (revert the merge).

## Mission summary (2026-10-14)

- **Tasks:** 11 planned (T0–T11). All done, plus 4 added by ruling or push-forward: T1d (state),
  T4b/T4c (core, stop-7 ruling), T4d (group header sprites/creole).
- **Halts:** 2.
  - Stop 5: the tightened dotEqual flipped 2 state + 103 description pins. Ruled option 1, state
    fix in scope.
  - Stop 7: core builder for linked-port a/i and kermor. Ruled both in scope.
- **Results, b0 → final:**
  - 0 conformant losses in all 28 engines at every close.
  - component 69/66/131 → 69/70/127; usecase 29/18/46 → 30/17/46; unknown 423/47/355 →
    423/48/354.
  - layoutEqual: component 244/251, usecase 71/73, unknown-DESCRIPTION 150/175.
  - svg-description ratchet 51 → 89; layout-parity ratchet 469; dot-parity component 260/263.
- **Brief corrections flagged for review:** journal rows 3 (pavuzo tree), 8 (empty display),
  11 (legacy parity.json), 19 (D6 anchor stays in nodeIds).
- **Gates:** all four green at every close (final 1374/1374).
- **Follow-ups:** `planning/next-missions.md` (dsw DONE section; follow-on 4 entry).
