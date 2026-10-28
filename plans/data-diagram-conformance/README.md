# data-diagram-conformance (ddc)

**Read first, every start and after every compaction:**
`~/.claude/docs/reference/autonomous-execution.md`, then this file, then
[decisions.md](decisions.md), then the current batch's `overview.md`. Tail
[decision-journal.md](decision-journal.md) for where you stopped.

## Status — IN PROGRESS: batch 0 closed 2026-10-28, batch 1 running

## Objective

Make the four data-diagram engines conformant to the jar: `@startjson`,
`@startyaml`, `@starthcl` to their structural bar, `@startfiles` byte-exact.
Planning re-read the Java and probed every diverged row (see
[decisions.md](decisions.md)):

| engine | rows | today (conformant / structural / diverged) | what blocks the rest |
|---|---:|---|---|
| json | 50 | 13 / 24 / 13 | 12 rows differ ONLY in edge `path/@d`: we emit edges in `walkTree` pre-order, the jar in `SmetanaForJson.manageOneNode` post-order (`:128-145`); timafu = `scale max` rounding (ADR-2b ceiling) |
| yaml | 39 | 7 / 28 / 4 | all 4: edge order |
| hcl | 3 | 1 / 2 / 0 | geometry only (accepted) |
| files | 1 authored + 8 pdiff rows hidden in `unknown` | 0 / 0 / 9 | `src/diagrams/files/` is not a port of `FEntry`/`FilesListing` (emoji glyphs, 22 px rows, own note box); the jar draws through klimt only, so byte-exact is reachable |

Starting state (origin/main `10aa35c6b`, 2026-10-28): byte pins json 10,
yaml 6, hcl 1, files 0; structural manifest 89 clean + 3 named ceilings.
Target (D1): 0 diverged rows outside the 3 ceilings, every conformant
json/yaml/hcl row pinned, every files row (9 corpus + authored) byte-exact
and pinned, 0 conformant losses in the other 28 engines, 0 unexplained rises.

## Branch

`feat/data-diagram-conformance` off origin/main `10aa35c6b` (T0a creates it
and commits this brief). One unsigned commit per task, `--no-ff` merges of
task branches (`ddc/<Tn>`), a close commit per batch. **Do not merge main into
the branch mid-drive.** The squash batch rebuilds one commit per batch and
tags the working history `ddc/pre-squash`. The user signs
(`git rebase --force-rebase -S 10aa35c6b`), pushes, opens the PR. **Never push.**

## Quality gates (all four before any close commit)

```sh
bash plans/data-diagram-conformance/measurements/gates.sh <tag>
# = npm test -- --maxWorkers=4 (JSON reporter) · typecheck · lint · build
```
Collected (JSON reporter) must equal on-disk. `uptime` first; above ~10 wait.
New src module ⇒ `npm run catalog` (drift-gated).

- `$T` = `plans/data-diagram-conformance/tools/`, `$M` = `plans/data-diagram-conformance/measurements/`.
- Survey: `npm run svg:survey -- <json|yaml|hcl|files> --out <path>` (never
  positional). All engines: `LOAD_MAX=8 SVG_PARITY_TIMEOUT_MS=900000
  SVG_PARITY_CONCURRENCY=3 bash $M/chain.sh <bN-eng>`; diff with
  `node $T/verdict-diff.mjs <prev> <next>`.
- One row: `npx tsx $T/diff-one.mts <json|yaml|hcl|files> <slug> [--structural]`
  (T0a writes it; json/yaml/hcl through `renderFixtureJson`, files through
  `renderFixtureFiles`; `--structural` drops positional diffs as the gate does).
- Oracle renders: `scripts/oracle-render.sh <ABSOLUTE out-dir> <puml>` only.
- Batch close: [close-procedure.md](close-procedure.md).

## Stop conditions (halt, journal, report)

1. A task needs a file outside its write-set or one another same-batch task
   owns (T2b/T2d overlap included).
2. The same gate fails on 2 consecutive fix attempts, or one code location
   changes 3 times without resolving the same check — halt with the diagnosis
   artifact (mechanism, origin `file:line`, causal chain, ruled out).
3. A finding contradicts D1–D9: amend `decisions.md` (dated), then halt.
4. A conformant fixture in any of the 28 other engines leaves conformant
   without a stated mechanism (all-engine chain at every close and after
   every `src/core/` commit — T2a when its origin is core).
5. A pinned golden, structural-manifest row, or diff/authored baseline row in
   any engine stops being byte-equal or rises; a structural-manifest ceiling
   would need to GROW (the manifest is shrink-only; a new ceiling is stop 9).
6. Any diff against `$M/b0-plantuml-ts.d.ts`. The plugin seam
   (`RenderFragment` / `AssembledSvg` declarations) is exempt per the
   2026-10-27 ruling; a commit touching it quotes the diff in the journal.
7. A fitted constant or behaviour without an upstream `file:line` in the
   same commit; any oracle rendered by a hand-typed `java -jar`; any
   files-engine number not traceable to `FEntry.java`, `FilesDiagram.java`,
   `FilesListing.java`, `Opale.java` or `skin/plantuml.skin`.
8. Any edit to dot-engine, the plantuml fork, the oracle jar or cached oracle
   bytes under `test-results/`; any push.
9. Proposing an `oracle/accepted-divergences.json` entry or a new ADR-2b
   ceiling (the user signs). A json/yaml/hcl geometry-only delta is NOT a
   stop: it is the expected residue, journaled.
10. Collected ≠ on-disk after a `--maxWorkers=4` rerun, or a survey timeout
    at load below 8.
11. A new runtime dependency; DOM/async/Node built-ins, `Date`, `Date.now()`
    or `Math.random()` in `src/`.
12. T1a's diagnosis finds the edge-order delta is NOT port-controlled (the
    probe hypothesis fails): halt before any `layout.ts` edit.
13. A jar oracle for an authored fixture is an error page: fix the fixture
    once; a second error on the same construct halts.
14. T1c/T1d name a core origin and T2a/T2b would add a json-only branch in
    `src/core/`.
15. T0c's capture commit would land before the routing/refusal pin commit,
    or the pin changes any row outside the new `files` tree.
16. The files port needs `tests/architecture/layering.test.ts` relaxed
    (`files → json` import) or a `filesDiagram` block added to the vendored skin.
17. Batch 3 (either task) changes any byte in jar-compatible mode, or needs
    the jar-compatible style cut (`files-style-input.ts`,
    `json-family-style-input.ts`) widened.

## Push-forward (decide, journal, continue)

- Helper splits forced by the 500-line hook (journal the new file); a test
  file added beside an existing one when the hook or coverage needs it.
- Re-pinning `parity-{json,yaml,hcl,files}.json`, the four ratchets, the
  structural manifest (shrink only), authored baselines and the
  routing/refusal clones at closes (orchestrator only, counts journaled)
  when every changed row moved toward the jar.
- Spawning T2a/T2b only from a complete T1c/T1d artifact (write-set
  journaled first); skipping them with the Java quote when the artifact
  says Smetana geometry.
- Dropping one authored fixture variant the jar cannot express (Java
  reason) and replacing it with the nearest construct it can.
- Closing a row as conformant by the 2026-10-10 error-page rule when both
  sides error, Java quote in `fixtures.md`.
- Moving a file between same-batch tasks before either starts when the
  dependency analysis missed an edge.
- Rerunning a timed-out vitest or survey at lower load before calling it a
  finding.
- Leaving the 8 files rows duplicated in `unknown` (D4), as hcl's 3 are.
- Skipping batch 3 entirely if batches 1–2 consume the session; journal the
  skip, the exit bar is unchanged.

## Execution rules

- Tasks run in worktrees (`bash $M/mkwt.sh <Tn>`); agents commit unsigned,
  never push, never use Serena edit tools or `git stash`, never leave a
  background process running. Hand-backs can be empty: read each worktree's
  `git log`/diff and rerun its tests at merge.
- Before every merge: `git diff HEAD` empty. After: `bash $M/merge-one.sh`.
- Every task prompt = its `TN-*.md` + [task-contract.md](task-contract.md).
- Journal every decision, mover and halt with its commit.

## Batches

| batch | tasks | status |
|---|---|---|
| [0 — branch, tooling, files harness, files bucket](batch-0/overview.md) | T0a, T0b, T0c, close | [x] 2026-10-28 |
| [1 — edge order, files port, two diagnoses, authored coverage](batch-1/overview.md) | T1a–T1f, close | [ ] |
| [2 — residuals](batch-2/overview.md) | T2a–T2e, close | [ ] |
| [3 — extensions (optional)](batch-3/overview.md) | T3a, T3b, close | [ ] |
| [exit](batch-exit/overview.md) | final measurement, docs, memory | [ ] |
| [squash](batch-squash/overview.md) | one commit per batch, tag `ddc/pre-squash` | [ ] |

## Documents

- [decisions.md](decisions.md) — D1–D10, user-approved 2026-10-28.
- [task-contract.md](task-contract.md) — the contract every agent prompt includes.
- [close-procedure.md](close-procedure.md) — standard batch close.
- [fixtures.md](fixtures.md) — counts per checkpoint, family and authored-fixture ledgers.
- [decision-journal.md](decision-journal.md) — appended during execution.
- [diagnosis/](diagnosis/) — T1a, T1c, T1d artifacts.
- [diagrams/component-map.md](diagrams/component-map.md), [diagrams/data-flow.md](diagrams/data-flow.md).

## Prior context (read only what a task points at)

- `plans/a5-json-family-conformance/ledger.md` — ADR-2b "the bar, redefined", M1a/M7.
- `plans/lengthadjust-document-wide/diagnosis/extension-audit.md` — per-directive extension verdicts (files rows re-measured in T2e).
- `plans/gantt-divergence-drive/` — the tooling and close pattern this brief copies.
- Memories: `honour-ignored-styling-extension`, `always-mirror-the-jar`, `new-corpus-tree-trips-two-gates`, `squash-per-batch-at-end`, `agents-write-main-via-serena`, `gate-merges-on-full-set-and-typecheck`.
