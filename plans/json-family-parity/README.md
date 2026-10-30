# json-family-parity (jfp)

**Read first, every start and after every compaction:**
`~/.claude/docs/reference/autonomous-execution.md`, then this file, then
[decisions.md](decisions.md), then the current batch's `overview.md`. Tail
[decision-journal.md](decision-journal.md) for where you stopped.

## Objective

Take `@startjson` / `@startyaml` / `@starthcl` to **port-controlled parity**
with the jar: diagnose every positional residue (path/@d, text/rect/line x,
ellipse cx, canvas dims) to its mechanism, fix everything this port controls,
pin every row that becomes byte-identical, and name + measure under ADR-2b the
rows whose remaining delta is genuinely Smetana's arithmetic (D3 proof). Two
structural divergences are already known from the Java (decisions.md, "The two
known structural divergences"): **M1** our declared node size is echoed instead
of the engine's post-layout size, and **M2** our origin is a min-shift over
nodes + edges instead of `Mirror(max node extent)`.

Starting state (main `7d08a6592`, 2026-10-29, jar-compatible mode):
json 14/50 conformant, yaml 7/39, hcl 1/3; pins 14/7/1; structural manifest
167 clean + 3 ceilings (json/timafu-94-bixe774 37, yaml/najoba-05-nino350 1,
yaml/tadari-70-nare798 1). Every residue row is in [fixtures.md](fixtures.md).

**Target:** every non-conformant row carries a ledger mechanism; every
port-controlled mechanism is fixed; every byte-identical row pinned; every
remaining row is either "Smetana" (D3 evidence, DIVERGENCES ADR-2b) or
"dot-engine" (filed in `docs/graphviz-issues/`); positional ceilings never rise;
manifest shrink-only; 0 conformant losses in all 28 engines; d.ts byte-identical
to b0; every extended-mode mover journaled.

## Branch

`feat/json-family-parity` off main `7d08a6592` (T0a creates it and commits this
brief). One unsigned commit per task in worktrees `jfp/<Tn>`
(`.claude/worktrees/jfp-<Tn>`), `--no-ff` task merges, one close commit per
batch. **Do not merge main into the branch.** The squash batch rebuilds one
commit per batch and tags `jfp/pre-squash`. The user signs
(`git rebase --force-rebase -S 7d08a6592`), pushes, opens the PR. **Never push.**

## Quality gates (all four before any close commit)

```sh
bash plans/json-family-parity/measurements/gates.sh <tag>
# = npm test -- --maxWorkers=4 (JSON reporter) · typecheck · lint · build
```
Collected (JSON reporter) must equal on-disk. `uptime` first; above ~10 wait
(or journal why not, as jse row 4 did). New src module ⇒ `npm run catalog`.

- `$T` = `plans/json-family-parity/tools/`, `$M` = `plans/json-family-parity/measurements/`.
- Survey: `npm run svg:survey -- <json|yaml|hcl> --out <path>` (never positional).
- All engines: `LOAD_MAX=8 SVG_PARITY_TIMEOUT_MS=900000 SVG_PARITY_CONCURRENCY=3 bash $M/chain.sh <bN-eng>`;
  diff with `node $T/verdict-diff.mjs <prev> <next>`.
- One row: `npx tsx $T/diff-one.mts <json|yaml|hcl> <slug> [--structural|--survey]`.
- Positional residue (T0b): `npx tsx $T/residue.mts [<type> <slug> | --all] [--json <out>]`.
- Extended-mode baseline (D5): `npx tsx $T/extended-baseline.mts [--write|--check] <map>`.
- Oracle renders: `scripts/oracle-render.sh <ABSOLUTE out-dir> <puml>` only.
- Real graphviz for D3: `dot -Tdot <file.dot>` (installed; `command -v dot`).
- Batch close: [close-procedure.md](close-procedure.md).

## Stop conditions (halt, journal, report)

1. A task needs a file outside its write-set, or one a same-batch task owns.
2. The same gate fails on 2 consecutive fix attempts, or one code location changes 3 times without resolving the same check — halt with the diagnosis artifact (mechanism, origin `file:line`, causal chain, ruled out).
3. A finding contradicts D1–D5: amend `decisions.md` (dated), then halt.
4. Any byte moves on an already-pinned json/yaml/hcl golden (14/7/1); a manifest `clean` row stops being clean; a ceiling would grow; **a positional ceiling rises** (D4).
5. A conformant row in any of the 28 engines leaves conformant (all-engine chain at every close and after T2a).
6. Any diff against `$M/b0-plantuml-ts.d.ts.txt`.
7. T2a changes anything in `src/core/` beyond the additive `engineNodes` under `read: 'exact'`, or any `src/core/` edit outside T2a. A residual whose origin is `src/core/` is reported, never patched around in json.
8. A fitted constant or behaviour without an upstream `file:line` in the same commit.
9. An oracle by a hand-typed `java -jar`; any edit to dot-engine, the plantuml fork, the oracle jar or cached oracle bytes; any push.
10. A ledger row labelled "Smetana" without both D3 equalities shown, or any row "unknown" at the B1 close.
11. More than 25% of the rows the B1 ledger predicted M1+M2 would close are still non-conformant after T3a (the ledger's method is wrong, not the rows).
12. Proposing an `oracle/accepted-divergences.json` entry, a new manifest ceiling, or a positional ceiling seeded above its measured value (the user signs).
13. An extended-mode mover with no stated mechanism.
14. A new runtime dependency; DOM/async/Node built-ins, `Date`, `Date.now()` or `Math.random()` in `src/`.
15. Collected ≠ on-disk after a `--maxWorkers=4` rerun, or a survey timeout at load below 8.

## Push-forward (decide, journal, continue)

- A ledger-predicted row that stays open after T3a (below the stop-11 threshold): re-diagnose it into Batch 4.
- dot-engine ≠ real `dot`: file `docs/graphviz-issues/<n>-<slug>.md` + a `TRACKER.md` line, classify the row "dot-engine", continue.
- Re-pinning at closes (orchestrator only) when every changed row moved toward the jar: new byte-conformant rows, positional + manifest ceilings shrinking, parity files, routing/refusal clones, extension movers with their mechanism.
- Helper splits forced by the 500-line / complexity hooks inside `src/diagrams/json/` (journal the new file).
- Re-pointing a unit test that asserted the old corner/shift arithmetic, reason in the commit body.
- Skipping Batch 4 when the ledger leaves no port-controlled mechanism.
- Rerunning a timed-out vitest or survey at lower load before calling it a finding.
- Regenerating `docs/catalog.md` at merges when exports change.

## Execution rules

- Tasks run in worktrees (`bash $M/mkwt.sh <Tn>`); agents commit unsigned, never push, never use Serena edit tools or `git stash`, never leave a background process running. Hand-backs can be empty or wrong: read each worktree's `git log`/diff and rerun its tests at merge.
- Before every merge: `git diff HEAD` empty. After: `bash $M/merge-one.sh`.
- Every task prompt = its `TN-*.md` + [task-contract.md](task-contract.md).
- Never `cd` below the repo root in the orchestrator session.
- Journal every decision, mover and halt with its commit.

## Batches

| batch | tasks | status |
|---|---|---|
| [0 — branch, tooling, positional guard](batch-0/overview.md) | T0a, T0b, close | [x] |
| [1 — diagnosis ledger](batch-1/overview.md) | T1a, T1b, T1c, close (+ B4 amendment) | [x] |
| [2 — engine node data in core](batch-2/overview.md) | T2a, close | [x] |
| [3 — port getPosition + Mirror (M1+M2)](batch-3/overview.md) | T3a, close | [ ] |
| [4 — remaining port-controlled mechanisms](batch-4/overview.md) | T4a (M5), T4b (M3), close | [ ] |
| [exit](batch-exit/overview.md) | final measurement, DIVERGENCES, docs, memory | [ ] |
| [squash](batch-squash/overview.md) | one commit per batch, tag `jfp/pre-squash` | [ ] |

## Documents

- [decisions.md](decisions.md) — scope, the two known divergences, D1–D5 (user-approved 2026-10-29).
- [task-contract.md](task-contract.md) — the contract every agent prompt includes.
- [close-procedure.md](close-procedure.md) — standard batch close.
- [fixtures.md](fixtures.md) — every residue row at main, counts per checkpoint.
- [batch-1/diagnosis-method.md](batch-1/diagnosis-method.md) — the ledger row format and the D3 experiment.
- [decision-journal.md](decision-journal.md) — appended during execution.
- [diagrams/component-map.md](diagrams/component-map.md), [diagrams/data-flow.md](diagrams/data-flow.md).

## Prior context (read only what a task points at)

- `plans/json-style-engine/` — tooling this brief copies; journal row 4 (load policy).
- `plans/a5-json-family-conformance/` — where the transposed dot input and the no-`Mirror` frame came from (`adr1-gonogo.md`).
- `DIVERGENCES.md` ADR-2b json geometry entry; `oracle/goldens/svg-json/README.md`.
- Memories: `dot-engine-blame-needs-real-dot`, `measurement-artifacts-outnumber-defects`, `comparesvg-count-not-monotonic`, `agents-write-main-via-serena`, `gate-merges-on-full-set-and-typecheck`, `squash-per-batch-at-end`, `jse-status`.
