# Mission: description-url-wrappers (dur)

Make the description engine emit the jar's `[[url]]` hyperlinks and edge ids. Seeded from
`planning/next-missions.md` ("component-divergence-drive (codd)" residuals).

**Read at start and after every compaction:** `~/.claude/docs/reference/autonomous-execution.md`,
then this file, [decisions.md](decisions.md), [task-preamble.md](task-preamble.md),
[close-procedure.md](close-procedure.md), the tail of [decision-journal.md](decision-journal.md),
`.agent-notes/codd-findings.md` and [measurements/seed/seam-map.md](measurements/seed/seam-map.md).

## Objective

16 description-family fixtures use `[[...]]` and none is conformant; on most of them the geometry
already matches and the only diff is the missing `<a>` wrapper. Three families:
- **A — entity URL:** `X [[url]]`, `url of|for X is [[url]]`, packages. The jar wraps the entity's
  shapes in one `<a>` (`EntityImageDescription.java:304-305,327-328`); groups too (`Cluster.java:339-341`).
- **B — inline creole URL:** `[[url label]]` in entity text, note bodies and link labels. The jar wraps
  each text run or sprite in its own `<a>` (`AtomText.java:197-198,235-236`). Core text drawing is
  shared with the class and state engines.
- **C — edge ids:** under `set separator`, the jar's `path/@id` and link comment use leaf names
  (`Link.java:106-120`, `Quark.java:84-86`); ours use qualified names (fidati, kofovu, tojitu: 88
  diffs each).

## Exit bar (D1)
1. Every target row's `<a>`/`@id` diffs are 0, or ledgered in `fixtures.md` with a mechanism
   (Java + port `file:line`).
2. 0 conformant losses in all 28 engines at every close.
3. 0 unexplained census rises (component, usecase).
4. Class, object and state golden ratchets green throughout.

## Branch
`feat/description-url-wrappers` from main `bb5b660d9`. Each code task gets a worktree branch
`dur/Tn` (`measurements/mkwt.sh Tn [base]`), merged `--no-ff` at its batch close. The mission merges
to main as a merge commit at exit. **Never push.**

## Quality gates (all four before any merge to the mission branch or main)
`npm test` · `npm run typecheck` · `npm run lint` · `npm run build` — run together by
`bash measurements/gates.sh <tag>` (`--maxWorkers=4`, records collected vs on-disk). Also
`npx prettier --check` on every changed file: worktrees skip the husky hook.

## Stop conditions (halt, journal, report)
1. A task needs a file outside its write-set (a pure type move or complexity-hook split does not count).
2. The same gate check fails on 2 consecutive fix attempts, or one code location changes 3 times
   without resolving it. The halt carries the diagnosis artifact.
3. A Java reading contradicts a D-decision, or a fix would need a divergence that no library forces.
4. A conformant fixture in any engine stops being conformant without a stated mechanism, or a
   layout-parity pin (489) goes unequal.
5. Any class/object/state golden ratchet, dot-parity or wrapper-parity test goes red; or a per-run wrap
   would emit nested `<a>` where the jar does not (T0b is the reference).
6. A census or diff-baseline score rises with no mechanism (check @id/childCount pairing first).
7. Any of: an edit to dot-engine, the plantuml fork, the oracle jar or cached oracle bytes; any push or
   `git stash`; a `cd` below the repo root; a Serena edit tool inside a worktree agent.
8. Signing an acceptance or accepted-divergence entry.
9. Collected ≠ on-disk after a `--maxWorkers=4` rerun, or a dirty main checkout at a merge gate.

## Push-forward (decide, journal, continue)
- A pure type move or complexity-hook split; journal its consumers.
- A test pin that recorded a residual this mission removed: tighten it, citing the mechanism (never a
  `*.ratchet.test.ts` file).
- A residual fix in a description file no live task owns: stated mechanism, one commit with a test.
- An under-estimated write-set for approved work: extend, journal, resume (core → D7 guards).
- Foreign load starving the survey: raise the gate in a scratch copy, re-run any `timeout` rows.
- Fold a batch close into the next when every task carried its own surveys; journal and flag it.
- Re-slot a residual to next-missions once its mechanism is stated.

## Execution

| Batch | Tasks | Parallel | Done |
|---|---|---|---|
| [0](batch-0/overview.md) baseline; class/state anchor check | T0 ∥ T0b | ∥ | [x] |
| [1](batch-1/overview.md) A parse core; B core wrap; C edge ids | T1a ∥ T2 ∥ T3 | all ∥ | [x] |
| [2](batch-2/overview.md) bracket shorthand; `url of`; A geo + render | T1b ∥ T1c ∥ T4 | all ∥ | [x] |
| [3](batch-3/overview.md) cluster URL | T5 | — | [ ] |
| [4](batch-4/overview.md) re-measure, re-pin, D1 | T6 | — | [ ] |
| [5](batch-5/overview.md) exit | T7 | — | [ ] |

## Index
- [decisions.md](decisions.md) — D1–D9, pre-made; do not re-argue.
- [task-preamble.md](task-preamble.md) — prepend to every agent prompt.
- [close-procedure.md](close-procedure.md) — standard batch close.
- [fixtures.md](fixtures.md) — target rows, b0 column, ledger.
- [diagrams/component-map.md](diagrams/component-map.md) · [diagrams/data-flow.md](diagrams/data-flow.md)
- [decision-journal.md](decision-journal.md) — append-only.
- [settings.autonomous.json](settings.autonomous.json) — permission profile (copy at `.claude/settings.autonomous.json`).
- `measurements/`: `gates.sh`, `chain.sh` (load gate 12), `mkwt.sh`, `diff-eng.mjs`, `pin-description.mts`,
  `measure-diff-baseline.mts`; `seed/seam-map.md` (planning map with `file:line`).

**Observability:** SLIs per close — conformant per engine (loss = stop), census Σ and zero-diff
(component, usecase), target-row render-diff, ratchet pins (description 352, layout-parity 489,
class 1003). **Rollback:** Reversible (revert the merge).
