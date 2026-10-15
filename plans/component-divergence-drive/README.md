# Mission: component-divergence-drive (codd)

Make the component diagram family conformant with the jar. Seeded from `planning/next-missions.md`
("description-svek-wrappers" open residuals) and `.agent-notes/dsw-T7.md`.

**Read at start and after every compaction:** `~/.claude/docs/reference/autonomous-execution.md`
(brief structure, compaction sequence, gates, commit discipline), then this file,
[decisions.md](decisions.md), [task-preamble.md](task-preamble.md), [close-procedure.md](close-procedure.md),
the tail of [decision-journal.md](decision-journal.md), `.agent-notes/dsw-findings.md` and
`.agent-notes/dsw-T7.md`.

## Objective

After dsw, layout already matches the jar on nearly every comparable component row (layoutEqual
244/251), yet only 69 of 266 component rows are conformant (69/70/127). The remaining work is
almost all **post-layout drawing**: what we draw from a correct layout.

The census (DeterministicMeasurer) at main `306a81151` has 61 zero-diff rows, 30 at 1–3 diffs,
38 at 4–10, 46 at 11–30, 90 at 31+ and 1 error. Families by rows reached: text x/y 148/133;
svg viewBox/width/height 125/99/96; path d 84; polygon 71; rect x/y/w/h 81/73/53/47; childCount
49+30; fill/stroke ~28.

The lead mechanism, from bamami: the drawn package box is not the base cluster's layout bb. The
jar draws 81 tall, which is cluster6's bb 16.07..97.07; ours draws 62.

The mission runs two tracks with disjoint write-sets (D3):
- **Geometry:** cluster box → canvas/margins/dpi → text x/y. Each family gets a read-only
  diagnosis task, then a fixer (D6).
- **Colour singletons:** fill/stroke precedence. These go straight to a fixer.

Usecase is collateral, not a target. Its movers are measured and must carry a mechanism.

## Exit bar (D1)

1. Component conformant **≥ 100** (from 69).
2. Every 1–3-diff row at b0 (30) is either pinned or ledgered with a mechanism.
3. The component census Σ diffs is **≤ 60%** of b0.
4. 0 conformant losses in any engine at every close.
5. 0 unexplained rises.

## Branch

`feat/component-divergence-drive` from main `306a81151`. Each code task gets one worktree branch
(`codd/Tn`, created by `measurements/mkwt.sh Tn`), merged `--no-ff` at each batch close. The mission
merges to main as a merge commit at exit. **Never push.**

## Quality gates (all four before any merge to the mission branch or to main)

`npm test` · `npm run typecheck` · `npm run lint` · `npm run build`

Also run `npx prettier --check` on every changed file, because worktrees skip the husky hook.
`bash measurements/gates.sh <tag>` runs all four with `--maxWorkers=4` and records collected vs
on-disk.

## Stop conditions (halt, journal, report)

1. A task needs a file outside its write-set. A pure type move or a complexity-hook split does not count.
2. The same gate check fails on 2 consecutive fix attempts, or one code location changes 3 times
   without resolving it. A halt for this reason needs the diagnosis artifact.
3. A Java reading contradicts a D-decision, or a fix would need a divergence that no library forces.
4. A conformant fixture in **any** engine stops being conformant, or a layout-parity pin (469) goes
   unequal, with no stated mechanism.
5. Tightened `dotEqual` flips true→false on any class/object/state row. A flip on a
   component/usecase/unknown/c4 row needs a `clusterTree`/`titleTable` reason.
6. A census or diff-baseline score rises with no mechanism, or a census attribute moves away from
   the jar with no reason. Check the pre-existing @id/childCount pairing first.
7. A core edit (D5) turns any class, object or state ratchet red, or any wrapper-parity test red. A
   core edit whose mechanism was not diagnosed in core is also a stop.
8. layoutParity disagrees with native `dot -Tdot` on a fixture where both were run.
9. Any of the following:
   - an edit to dot-engine, the plantuml fork, the oracle jar or cached oracle bytes
   - any push or any `git stash`
   - a `cd` below the repo root
   - a Serena edit tool used inside a worktree agent
10. Signing an acceptance or accepted-divergence entry. Retiring an entry that is now conformant is fine.
11. **D8 engine blame:** native `dot -Tdot` shows dot-engine is to blame. File a
    `docs/graphviz-issues/` entry and a TRACKER line, then halt that family. Never work around it.
12. Collected ≠ on-disk after a `--maxWorkers=4` rerun, a survey row times out under the gate, or a
    merge gate finds a dirty main checkout.
13. A fix lowers census Σ but moves some row's attribute away from the jar. That is fitting: revert
    it and diagnose.
14. A TRACKER box would be ticked without its named fixtures re-measuring clean.

## Push-forward (decide, journal, continue)

- A pure type move or a complexity-hook split; journal its consumers.
- A unit-test pin update explained by a measured mechanism and a Java quote.
- A residual fix in a description file no other task owns: stated mechanism, one commit with a test.
- A write-set the spec under-estimated for work the approved task covers: extend it, journal it, resume.
- A core edit inside D5: mechanism diagnosed in core, guards green, journaled.
- At each close, re-rank the families by rows reached. Re-slot a residual to a later batch, or file
  it in next-missions, once its mechanism is stated.
- Pin every newly conformant row (description, unknown and c4 trees) at each close.
- Run `npm run catalog` when exports change; regenerate the dashboard at each re-pin.
- Brief corrections found in the Java: journal them and flag them for review.
- Start a batch before the previous close finishes when its dependencies are code-only.
- If foreign load starves the survey chain, raise the load gate in a scratch copy and journal it.
- If a resumed agent's report is lost, read the worktree's `*-report.md`, journal and commits.

## Execution

| Batch | Tasks | Parallel | Done |
|---|---|---|---|
| [0](batch-0/overview.md) branch, b0, TRACKER ledger | T0 ∥ T0b | ∥ | [x] |
| [1](batch-1/overview.md) ratchet eligibility; cluster-box diagnosis; colour singletons | T1a ∥ T1b ∥ T1c | all ∥ | [x] |
| [2](batch-2/overview.md) cluster-box fix; childCount | T2 ∥ T3 | ∥ | [ ] |
| [3](batch-3/overview.md) canvas/dpi; kermor notes; text diagnosis | T4 ∥ T5 ∥ T6 | all ∥ | [ ] |
| [4](batch-4/overview.md) text fix; containers; xagonu xlabels; stroke-width/rx | T7 ∥ T8 ∥ T9 ∥ T10 | all ∥ | [ ] |
| [5](batch-5/overview.md) re-measure + re-pin | T11 | — | [ ] |
| [6](batch-6/overview.md) exit | T12 | — | [ ] |

## Index

- [decisions.md](decisions.md): D1–D8, pre-made; do not re-argue them.
- [task-preamble.md](task-preamble.md): prepend to every agent prompt.
- [close-procedure.md](close-procedure.md): the standard batch close.
- [fixtures.md](fixtures.md): families, named fixtures, jar facts and the per-batch ledger.
- [diagrams/component-map.md](diagrams/component-map.md) · [diagrams/data-flow.md](diagrams/data-flow.md)
- [decision-journal.md](decision-journal.md): append-only.
- [settings.autonomous.json](settings.autonomous.json): the permission profile. A copy is already
  at `.claude/settings.autonomous.json`.
- `measurements/`:
  - scripts: `chain.sh`, `gates.sh`, `mkwt.sh`, `diff-eng.mjs`, `pin-description.mts`,
    `measure-diff-baseline.mts`, `classify.mjs`
  - planning seed: `seed/rd/` (68 render-diffs), `seed/families-1to10.txt`, `seed/comp-families.txt`

**Observability:** the SLIs are conformant per engine (a loss is a stop), census Σ and zero-diff
count, layoutEqual, the ratchets (description 89, layout-parity 469, class/object/state) and the
named ledger. Each close journals them against the b0 sha and regenerates the dashboard.
**Rollback:** Reversible (revert the merge).
