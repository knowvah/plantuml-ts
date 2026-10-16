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
| [3](batch-3/overview.md) cluster URL | T5 | — | [x] |
| [4](batch-4/overview.md) re-measure, re-pin, D1 | T6 | — | [x] |
| [5](batch-5/overview.md) exit | T7 | — | [x] |

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

## Mission summary (2026-10-16)

**Tasks:** 11 of 11 planned (T0, T0b, T1a, T1b, T1c, T2, T3, T4, T5, T6, T7) done. Exit bar D1 **met** on all
four clauses (journal row 39).

**Outcome b0 → final** (conformant/structural/diverged): component 180/12/74 → 188/13/65, usecase
58/2/33 → 62/4/27, unknown 483/16/326 → 486/16/323; all other engines unchanged; 0 conformant losses in
28 engines at every close. 18 fixtures went conformant. Census component Σ 2201 → 1927 (zero-diff
179 → 187), usecase Σ 688 → 715 (2 explained rises, zero-diff 58 → 62). Pins: description 352 → 367,
layout-parity 489 → 490, diff-baseline xufexu 2 → 0, census pins on 14 fallen rows, count pins with
derivations.

**Gates:** green at b0, b1, b2, b4, b4r2 (post-re-pin) and final (1420/1420 collected; 30677 passed).

**Decisions flagged for review:** rows 2, 14 (orchestrator `cd` below root, read-only, reverted);
3 (`node_modules` predates `c93806188`; run `npm ci`); 7 / 10 (OpenIconic glyph drawn at the AtomOps seam,
not the resolver); 16, 22 (write-set extensions); 19-20 (signing setup, user decisions); 28-30
(T5 re-done in core `Cluster.ts`, D7); 29 (D6 premise partly false: tukipe); 32 (b3 close folded into b4);
35 (tracked census pin stale before the mission); 36-37 (tracked parity JSON refresh, user-approved);
40 (land through a PR, user change).

**Follow-ups:** `planning/next-missions.md` dur section (url-label flattening, stereotype/edge-label
glyphs, ridola glyph-first line, link-label sprite, hidden-link draw, note naming, note urls, ELK topurl,
`layout-dot-tree.ts` split, census pin refresh). Remaining exit steps after this commit: the user's
signing rebase, verification + gates, push and PR (T7 steps 6-7).
