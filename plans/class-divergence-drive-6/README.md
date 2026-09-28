# class-divergence-drive-6 (cdd6)

**Read first, every start and after every compaction:**
`~/.claude/docs/reference/autonomous-execution.md`, then this file, then
`decisions.md`, then the current batch's `overview.md`. Tail
`decision-journal.md` for where you stopped.

## Objective

Close the CLASS rows cdd5 left open. cdd5 diagnosed every one; this mission
verifies the doubtful mechanisms, fixes the instruments that mis-measure, then
ports the fixes in three batches. Two pieces are shared `src/core` work:
style values reaching the class `Theme` (D2) and a hyperlink colour on the creole
`FontConfiguration` (D3). One task forwards `assetStore` in the non-class engines
(D6).

Starting state (main `0f3998f57`, pushed):
- class bucket 708/3/12 — all 15 non-conformant rows are in-force acceptances;
- unknown-bucket CLASS rows (288, routing `ourType: CLASS`) 225/26/37;
- ratchet 930; routing/refusal manifests 5924;
- cdd5 ledger (`plans/class-divergence-drive-5/fixtures.md`): 62 rows
  `open -> cdd6`, 4 accept-candidates (vakovo, rubebe, sapofa, petiku; unsigned).

The post-instrument baseline (T0e, `measurements/b0.json`) is the reference for
every "loss" afterwards.

## Branch

`feat/class-divergence-drive-6` off main. Merge commit at close (never squash;
the journal cites per-task commits). **Never push** anything: not main, not the
plantuml fork, not dot-engine.

## Quality gates (all four before any commit lands on the branch)

```sh
npm test -- --maxWorkers=6 --reporter=default --reporter=json --outputFile.json=<path>
npm run typecheck
npm run lint
npm run build
```
Collected (JSON reporter) must equal `find tests -name '*.test.ts' | wc -l`.
Check load first (`uptime`); above ~10 wait. Default-worker runs drop files at
load 80+ (cdd5 journal 19). New src module ⇒ `npm run catalog`.

Measurement:
- Survey: `npm run svg:survey -- <engine> --out <path>` (never the positional form).
- Census: `npx jiti scripts/svg-conformance-census.ts class --json <path>`.
- `$T` = `plans/class-divergence-drive/tools/`: `render-all.mts <out> --tree all`,
  `render-diff.mts <tree/slug...>`, `pin-diff.mts`, `pin-goldens.mts --tree`.
- Batch close: [close-procedure.md](close-procedure.md).

## Stop conditions (halt, journal, report)

1. A task needs a file another task in the same batch owns.
2. The same gate fails on 2 consecutive fix attempts, or one code location changes
   3 times without resolving the same check.
3. A finding contradicts D1–D12: amend `decisions.md`, then halt.
4. A conformant fixture in any engine leaves conformant, or `dotEqual` flips
   true→false, without a stated mechanism.
5. A diff-count rise with no mechanism (a structural fall with a numeric rise is a
   reveal, not a stop).
6. Class DOT parity goes red.
7. Collected ≠ on-disk after a `--maxWorkers=6` rerun, or a survey timeout at load
   below 8.
8. More than 30 non-class movers at a close (D7).
9. Any edit under `~/git/knowvah/dot-engine` or the plantuml fork, or any push.
10. Any change to the oracle jar or cached oracle bytes, except a journaled
    plain-minute re-render of an error page (D9).
11. Writing an acceptance as maintainer-signed.
12. A public API change (`renderSync`/`render`/`renderAll` signatures or exported
    option types).
13. A style value upstream resolves only at draw time from a signature the bucket
    model cannot express (D2's escape hatch).

## Push-forward (decide, journal, continue)

- A pure type or file-cap move that extends a write-set.
- Unit-pin updates explained by a measured mechanism and a Java quote.
- Pinning goldens that are survey-conformant, census 0-diff and dotEqual true.
- Re-pinning a routing/refusal row the gate flags `[FIXED]`/`[CHANGED]`, from a
  fresh measurement.
- Re-slotting a row between batches when T0d or a close names a better owner.
- `final = open -> cdd7` when the mechanism is found but not fixable in the write-set.
- Collapsing two tasks that turn out to share a file.
- A TRACKER line + `docs/graphviz-issues/` file for a real-`dot`-verified finding.
- Regenerating the catalog or dashboard.

## Execution rules (D11)

- Parallel tasks run in `git worktree`s made by
  `plans/class-divergence-drive-5/measurements/mkwt.sh <Tn>` (links the gitignored
  dependencies and the `test-results` children).
- Agents run targeted tests + typecheck + eslint only; the orchestrator merges and
  runs the four gates.
- Agents: no Serena edit tools (they write the MAIN checkout), no `git stash`.
  Orchestrator: `git diff HEAD` on main is empty before every merge.

## Batches

| Batch | Scope | Tasks | Parallel | Done |
|---|---|---|---|---|
| [0](batch-0/overview.md) | branch + ledger, survey harness, minute guard, verify doubtful rows, b0 | T0a–T0e | T0b–T0d ∥ | [ ] |
| [1](batch-1/overview.md) | shared foundations: style buckets, hyperlink colour, assetStore, `>>` head, preprocessor | T1a–T1e | all ∥ | [ ] |
| [2](batch-2/overview.md) | class style consumers, ink walk, degenerate canvas, class text, singles | T2a–T2e | all ∥ | [ ] |
| [3](batch-3/overview.md) | empty graph + verified layout rows, mainframe, smetana structure, portin/title table, link-middle + nested renders | T3a–T3e | all ∥ | [ ] |
| [4](batch-4/overview.md) | exit + close-out + merge | T-exit, T-close-out | — | [ ] |

## Documents

- [decisions.md](decisions.md): D1–D12, locked
- [close-procedure.md](close-procedure.md): standard batch close
- `fixtures.md`: row ledger (created by T0a, settled by closes)
- [diagnosis/](diagnosis/): `verify.md` (T0d)
- [diagrams/data-flow.md](diagrams/data-flow.md) ·
  [diagrams/component-map.md](diagrams/component-map.md)
- [decision-journal.md](decision-journal.md): one row per decision, mover, halt
- `measurements/`: survey/census/render-all JSON per checkpoint

## Prior context (read only what a task points at)

- `planning/next-missions.md`, section `class-divergence-drive-5`
- `plans/class-divergence-drive-5/fixtures.md` (mechanisms per row),
  `decision-journal.md` rows 41, 61–87
- `.agent-notes/cdd5-*.md`
- Memories: class-divergence-drive-5-status, batch-parallelism-needs-worktrees,
  verify-agent-claims-si31, dot-engine-blame-needs-real-dot,
  comparesvg-count-not-monotonic, conformant-is-not-divergence-gone,
  coverage-tmp-silent-undercollect, subagent-handback-single-shot
