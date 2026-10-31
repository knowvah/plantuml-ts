# json-family-followons (jff)

**Read first, every start and after every compaction:**
`~/.claude/docs/reference/autonomous-execution.md`, then this file, then
[decisions.md](decisions.md), then the current batch's `overview.md`. Tail
[decision-journal.md](decision-journal.md) for where you stopped.

## Objective

Close the jfp follow-ons (`planning/next-missions.md`, "jfp follow-ons
(2026-10-30)"). The substantive one: **`scale` × title is wrong** for
`@startjson`/`@startyaml`/`@starthcl`. Our renderer scales its body before
chrome (`src/diagrams/json/renderer.ts:474-477`), so the title stays at 1x and
the factor is resolved over the title-less size. Upstream, `JsonDiagram extends
TitledDiagram` (`JsonDiagram.java:68`): `UgDiagram#getExporter` adds chrome and
the back colour first (`UgDiagram.java:123-131`), then
`TextBlockExporter#exportTo` scales the whole block
(`TextBlockExporter.java:159-177`, factor `:205-209`). mindmap/salt/wbs/gantt
already take that route (`exportMargin` + `finalizeTitledDiagramFragment`);
json joins them (D1). Also: dead json scale plumbing (item 4), the dot-engine
re-render check (item 3, D3), three stale manifest notes (item 6), the
labelless-record item closed by reasoning (D2), and the authored fixtures that
pin all of it (D4). Item 2 (core `inches()` 6-dp) is **out of scope** (user
ruling 2026-10-30, Q3).

Planning probe (2026-10-30, jar via `scripts/oracle-render.sh`): json `title`
+ `scale 1.5` = 54 diffs, canvas 185 vs 277, title font 14 vs 21; yaml `title`
+ `scale 2` = 11 diffs, every one title/offset (height 115 vs 150). Details:
[fixtures.md](fixtures.md).

Starting state (main `b9b309894`): json 14/50, yaml 7/39, hcl 1/3 conformant;
pins 14/7/1; structural manifest 167 clean + 3 ceilings; positional ceiling 70
corpus rows.

**Target:** title + scale rows carry no title-related diff (only the body's
known Smetana residue); authored rows pinned in the structural manifest and
the positional ceiling; dead scale plumbing gone; item 3 filed or closed with
evidence; pins 14/7/1 hold, no positional ceiling rises, manifest shrink-only;
0 conformant losses in all 28 engines; d.ts byte-identical to b0.

## Branch

`feat/json-family-followons` off main `b9b309894` (T0a creates it and commits
this brief). One unsigned commit per task in worktrees `jff/<Tn>`
(`.claude/worktrees/jff-<Tn>`), `--no-ff` task merges, one close commit per
batch. **Do not merge main into the branch.** The squash batch rebuilds one
commit per batch and tags `jff/pre-squash`. The user signs
(`git rebase --force-rebase -S b9b309894`), pushes, opens the PR. **Never push.**

## Quality gates (all four before any close commit)

```sh
bash plans/json-family-followons/measurements/gates.sh <tag>
# = npm test -- --maxWorkers=4 (JSON reporter) · typecheck · lint · build
```
Collected (JSON reporter) must equal on-disk. `uptime` first; above ~10 wait
or journal why not (jfp row 2). New/removed src module ⇒ `npm run catalog`.

- `$T` = `plans/json-family-followons/tools/`, `$M` = `plans/json-family-followons/measurements/`.
- Survey: `npm run svg:survey -- <json|yaml|hcl> --out <path>` (never positional).
- All engines: `LOAD_MAX=8 SVG_PARITY_TIMEOUT_MS=900000 SVG_PARITY_CONCURRENCY=3 bash $M/chain.sh <bN-eng>`;
  diff with `node $T/verdict-diff.mjs <prev> <next>`.
- One row: `npx tsx $T/diff-one.mts <json|yaml|hcl> <slug> [--structural|--survey]`.
- Positional residue: `npx tsx $T/residue.mts [<type> <slug> | --all] [--json <out>]` (authored rows after T0b).
- Oracle renders: `scripts/oracle-render.sh <ABSOLUTE out-dir> <puml>` only.
- Batch close: [close-procedure.md](close-procedure.md).

## Stop conditions (halt, journal, report)

1. A task needs a file outside its write-set, or one a same-batch task owns.
2. The same gate fails on 2 consecutive fix attempts, or one code location changes 3 times without resolving the same check — halt with the diagnosis artifact (mechanism, origin `file:line`, causal chain, ruled out).
3. A finding contradicts D1–D5: amend `decisions.md` (dated), then halt.
4. Any byte moves on a pinned json/yaml/hcl golden (14/7/1); a manifest `clean` row stops being clean; a ceiling would grow; a positional ceiling rises (corpus or authored).
5. A conformant row in any of the 28 engines leaves conformant (all-engine chain at every close, and after T2a, which must be byte-identical everywhere).
6. Any diff against `$M/b0-plantuml-ts.d.ts.txt`.
7. A `src/core/` edit outside T2a; in T2a, a change that moves a non-json engine's bytes, or a new `RenderFragment` field.
8. A fitted constant or behaviour without an upstream `file:line` in the same commit.
9. An oracle by a hand-typed `java -jar`; a hand-edited fixture `.svg`; any edit to dot-engine, the plantuml fork, the oracle jar or cached oracle bytes; any push.
10. T1a filing a dot-engine issue without the native-graphviz comparison (D3).
11. Proposing an `oracle/accepted-divergences.json` entry, a manifest ceiling with no cited reason, or a positional ceiling seeded above its measured value.
12. A new runtime dependency; DOM/async/Node built-ins, `Date`, `Date.now()` or `Math.random()` in `src/`.
13. Collected ≠ on-disk after a `--maxWorkers=4` rerun, or a survey timeout at load below 8.
14. After T2b, a title + scale authored row keeps a title-related diff (title font-size, title x/y, or canvas off by more than the body's Smetana residue): the export order still differs.

## Push-forward (decide, journal, continue)

- An authored fixture that is a structural ceiling at T0b, with a cited json-family structural mechanism.
- Re-pinning at closes (orchestrator only) when every changed row moved toward the jar: positional + manifest ceilings shrinking, newly byte-identical rows, parity files.
- dot-engine ≠ native graphviz with the D3 evidence: file `docs/graphviz-issues/<n>-<slug>.md` + a `TRACKER.md` line, continue.
- Helper splits forced by the 500-line / complexity hooks inside `src/diagrams/json/` or `src/core/assemble-svg*.ts` (journal the new file).
- Re-pointing a unit test that asserted the old pre-chrome scale arithmetic, reason in the commit body.
- Rerunning a timed-out vitest or survey at lower load before calling it a finding.
- Regenerating `docs/catalog.md` at merges when exports change (`scale-at-emit.ts` goes away).

## Execution rules

- Batches run in order; tasks inside a batch in parallel only where `overview.md` says so, each in its own worktree (memory `batch-parallelism-needs-worktrees`; symlink `assets/stdlib`, `oracle/dist`, `tests/corpus`, `test-results/dot-cache` into each worktree, memory `worktree-survey-needs-stdlib`).
- Every agent prompt = the task file + [task-contract.md](task-contract.md). Worktree agents never use Serena edit tools (memory `agents-write-main-via-serena`).
- Verify every hand-back from the worktree (`git log`, the measured numbers), never from the report alone.
- Journal every decision, mover and halt with its commit.

## Batches

| batch | tasks | status |
|---|---|---|
| [0 — branch, tooling, authored fixtures + pins](batch-0/overview.md) | T0a, T0b, close | [x] |
| [1 — idempotence check, dead scale plumbing](batch-1/overview.md) | T1a, T1b, close | [x] |
| [2 — json joins the TitledDiagram export tail](batch-2/overview.md) | T2a, T2b, T2c (close) | [x] |
| [exit](batch-exit/overview.md) | final measurement, DIVERGENCES, docs, memory | [ ] |
| [squash](batch-squash/overview.md) | one commit per batch, tag `jff/pre-squash` | [ ] |

## Documents

- [decisions.md](decisions.md) — D1–D6 (user-approved 2026-10-30).
- [task-contract.md](task-contract.md) — the contract every agent prompt includes.
- [close-procedure.md](close-procedure.md) — standard batch close.
- [fixtures.md](fixtures.md) — the authored fixtures, the probe, counts per checkpoint.
- [decision-journal.md](decision-journal.md) — appended during execution.
- [diagrams/component-map.md](diagrams/component-map.md), [diagrams/data-flow.md](diagrams/data-flow.md).

## Prior context (read only what a task points at)

- `plans/json-family-parity/` — tooling this brief copies; journal rows 19-23 (T4a scale-at-emit, T4b Variant A).
- `.agent-notes/jfp-b1.md` (re-render observation, scale leftovers), `.agent-notes/jfp-execution.md`.
- `DIVERGENCES.md` "Smetana-backed diagram types"; `oracle/goldens/svg-json/README.md`.
- Memories: `squash-per-batch-at-end`, `gate-merges-on-full-set-and-typecheck`, `dot-engine-blame-needs-real-dot`, `conformance-harness-mirrors-index-ts`, `jfp-status`.
