# Mission: graphviz-tracker-consume (gtc)

Check off the `docs/graphviz-issues/TRACKER.md` items dot-engine has handed back to us. dot-engine's
`plantuml-tracker-2` mission and its graphviz 16.1 sync fixed 28/29/30/32/33/34 upstream, and marked
14 and 16 "consumer-side; no dot-engine work". All of those are in the pinned 2.4.0, and our builder graph
lays out equal to native on every named fixture. What keeps each box open is **our post-layout
drawing**.

**Read at start and after every compaction:** `~/.claude/docs/reference/autonomous-execution.md`,
then this file, [decisions.md](decisions.md), [task-preamble.md](task-preamble.md),
[close-procedure.md](close-procedure.md), [fixtures.md](fixtures.md), the tail of
[decision-journal.md](decision-journal.md), `.agent-notes/dot-engine-2.4.0-bump.md`,
`.agent-notes/codd-findings.md`.

## Scope (user rule 2026-10-16)
An item with no dot-engine comment is out of scope. **In:** 14, 16, 28, 29, 30, 32, 33, 34. **Out:** 36
(engine-side, unfixed upstream), every `[x]`/`[~]` row.

| Item | Target rows (b-plan) | Residual (ours) | Task |
|---|---|---|---|
| 34 | rubebe (survey conformant, errorPage) | none | T0 ticks |
| 32 | rufopi 2/0, zosuje 17/0 | `<style>` cluster fill / line / font, link colours | T1, T2 |
| 33 | xenusu 7/2 | `skinparam arrow<<stereo>>` colour + `line.Bold()`; width 1 px | T3 |
| 30 | repoge 37/16 | note/component draw order, labels | T4 |
| 29 | xagonu 45/887 | `\r` label prefix, link childCount, edge order | T5a, T5b |
| 28 | deroxu 719/1237 | several families (census first) | T6a, T6b+ |
| 16 | state/pavuzo 4/85 | 4 missing `textLength`; uniform 1 px x shift | T7a, T7b |
| 14 | — | state composite title Y from `clusters[].label` | T8 |

## Exit bar
1. Every in-scope box is ticked per D2 with a dated note, or left open with a measured residual and a
   stated mechanism (Java + port `file:line`) re-slotted into `planning/next-missions.md`.
2. 0 conformant losses in all engines at every close.
3. 0 ratchet-pin rises; every census attribute moving away from the jar has a mechanism (D6).
4. All four gates green at exit, with collected = on-disk.

## Branch
`fix/graphviz-tracker-consume`, created from main `9094705aa`. The description lane works in the mission checkout. The state lane works in
the worktree `gtc/S` (`measurements/mkwt.sh S`) and merges `--no-ff` at its close. Commits are unsigned
(`commit.gpgsign false`). At exit you run one `git rebase -S`, and the mission lands through a
merge-commit PR (D7).

## Quality gates (all four before any merge)
`npm test` · `npm run typecheck` · `npm run lint` · `npm run build`, run together by
`bash measurements/gates.sh <tag>` (`--maxWorkers=4`, records collected vs on-disk). Also run
`npx prettier --check` on every changed file, because worktrees skip the husky hook.

## Stop conditions (halt, journal the diagnosis artifact, report)
1. A task needs a file outside its write-set. This includes a state-lane fix needing `src/core/**`, and any
   edit under `src/diagrams/{class,activity,sequence}/**`. A pure type move or complexity-hook split does not count.
2. Two consecutive failures of the same gate check, or 3 consecutive edits to one code site without
   resolving its check.
3. A conformant row in any engine stops being conformant and reverting the task does not clear it.
4. A ratchet pin rises after a re-pin, or a census attribute moves away from the jar with no mechanism.
5. A fix would contradict D1–D7 (e.g. bumping dot-engine, or item 14's mirror moving state rows away from the jar).
6. A residual traces into dot-engine. Prove it with `dot -Tdot` on the cached `svek-1.dot` first. Then file
   `docs/graphviz-issues/37-*.md` plus a TRACKER line, and stop work on that item. Never patch around it.
7. A fix would need a `DIVERGENCES.md` entry, a constant without an upstream citation, or "improving"
   on the jar.
8. A deroxu family looks large enough to defer (D4): halt with the measurement for a user ruling.
9. Any of: a push before the user's `rebase -S`; a push to main; a version bump, tag, publish or signing;
   an edit to dot-engine, the plantuml fork, the oracle jar or cached oracle bytes; `git stash`; a `cd`
   below the repo root; a Serena edit tool inside a worktree agent; a dirty main checkout at a merge gate.

## Push-forward (decide, journal, continue)
- A diagnosis-only `.agent-notes` commit before a fix. Env-gated temporary tracing, reverted before commit.
- 1–3-line pre-existing fixes in files being edited. Log the others to `.agent-notes/gtc-*.md`.
- Add T6f+ deroxu family tasks from T6a's census, in descending count, using the T6b template.
- Tick a TRACKER box per D2, or leave it open with a measured residual and its mechanism.
- Pin newly conformant rows and tighten pins that fell.
- Re-run a gate that failed only on "timed out" under load, at `--maxWorkers=4`.
- An under-estimated write-set inside the task's own lane directory: extend it, journal it, resume.
- After the user's `rebase -S`: push the branch and open the merge-commit PR.

## Execution

| Batch | Tasks | Lane | Done |
|---|---|---|---|
| [0](batch-0/overview.md) baseline; tick 34 | T0 | orchestrator | [x] |
| [1a](batch-1a/overview.md) styles, arrows, draw order (32, 33, 30) | T1 → T2 → T3 → T4 | description | [x] |
| [1b](batch-1b/overview.md) xagonu (29) | T5a → T5b | description | [x] |
| [1c](batch-1c/overview.md) deroxu (28) | T6a → T6b… | description | [x] |
| [1s](batch-1s/overview.md) pavuzo (16); item 14 | T7a → T7b → T8 | state (worktree, ∥ 1a–1c) | [x] |
| [2](batch-2/overview.md) merge, re-measure, exit | T9 | orchestrator | [ ] |

## Index
- [decisions.md](decisions.md): D1–D7, pre-made; do not re-argue.
- [task-preamble.md](task-preamble.md): prepend to every agent prompt.
- [close-procedure.md](close-procedure.md): per-task close (description lane) and lane close.
- [fixtures.md](fixtures.md): target rows, the b0 column, and the tick ledger.
- [diagrams/component-map.md](diagrams/component-map.md) · [diagrams/data-flow.md](diagrams/data-flow.md)
- [decision-journal.md](decision-journal.md): append-only, orchestrator only.
- [settings.autonomous.json](settings.autonomous.json): permission profile (copied to `.claude/settings.autonomous.json`).
- `measurements/`: `gates.sh`, `chain.sh` (all-engine survey with the load gate), `rd.sh` (target render-diffs),
  `mkwt.sh`, `diff-eng.mjs`, `pin-description.mts`.

**Observability:** the SLIs at every close are conformant count per engine (a loss is a stop), target-row
render-diff, census Σ and away-from-jar attributes, and ratchet pins. **Rollback:** reversible (revert the
task commit or the lane merge).
