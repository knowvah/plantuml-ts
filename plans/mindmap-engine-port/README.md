# mindmap-engine-port (mmp)

**Read first, every start and after every compaction:**
`~/.claude/docs/reference/autonomous-execution.md`, then this file, then
[decisions.md](decisions.md), then the current batch's `overview.md`. Tail
[decision-journal.md](decision-journal.md) for where you stopped.

## Objective

Port PlantUML's mindmap engine (`@startmindmap`) faithfully. Upstream spec:
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/` (2168 lines) plus
the node box `activitydiagram3/ftile/vertical/FtileBoxOld.java` and the subset of the
style engine (`style/`) that `Idea.getStyle()` reaches. Mindmap layout is pure
geometry: no Graphviz, dot-engine or Smetana, so every coordinate is a jar-fidelity
target and there is no DOT-parity gate.

Starting state: `@startmindmap` routes (`block-extractor.ts:112`,
`diagram-type-set.ts:57`) but `renderSync` returns "Error: unknown diagram type".
Corpus `test-results/dot-cache/mindmap/`: 142 fixtures, survey 0/0/142; routing gate
139 `MINDMAP -> NONE` known-misroute + 3 jar-error; refusal 139 ok + 3 jar-error.
Class row `unknown/semutu-45-zeno907` (mindmap in a class title) waits on this.
Corpus features: 47 `<style>`, 3 `:depth`, 6 `*{`, 23 boxless, 6 `[#color]`,
6 `left side`, 4 `top to bottom`, 24 `+/-`, 6 orgmode, 14 stereotype, 7 skinparam,
13 chrome (title/caption/legend/header/footer), 7 scale, 1 `!theme`.

## Branch

`feat/mindmap-engine-port` off main. Merge commit at close (never squash). **Never
push** anything: not main, not the plantuml fork, not dot-engine.

## Quality gates (all four before any commit lands on the branch)

```sh
npm test -- --maxWorkers=6 --reporter=default --reporter=json --outputFile.json=<path>
npm run typecheck
npm run lint
npm run build
```
Collected (JSON reporter) must equal `find tests -name '*.test.ts' | wc -l`. Check load
first (`uptime`); above ~10 wait. New src module ⇒ `npm run catalog`. Before any
merge: `npx prettier --check` over every file changed on the branch.

Measurement:
- Survey: `npm run svg:survey -- <engine> --out <path>` (never the positional form).
- Mindmap render-diff: `npx jiti plans/class-divergence-drive/tools/render-diff.mts
  mindmap/<slug>` (tree/slug form works for any cached tree).
- Jar probes: `plans/mindmap-engine-port/tools/probe/` (T0c). Oracle renders only via
  `scripts/oracle-render.sh <out-dir> <puml>`.
- Batch close: [close-procedure.md](close-procedure.md).

## Stop conditions (halt, journal, report)

1. A task needs a file another task in the same batch owns.
2. The same gate fails on 2 consecutive fix attempts, or one code location changes 3
   times without resolving the same check.
3. A finding contradicts D1–D12: amend `decisions.md`, then halt.
4. A conformant fixture in any engine leaves conformant, or `dotEqual` flips
   true→false, without a stated mechanism.
5. Any non-mindmap engine moves at a close without a stated mechanism (D11).
6. A diff-count rise with no mechanism (a structural fall with a numeric rise is a
   reveal, not a stop).
7. Collected ≠ on-disk after a `--maxWorkers=6` rerun, or a survey timeout at load < 8.
8. Any edit under `~/git/knowvah/dot-engine` or the plantuml fork, or any push.
9. Any change to the oracle jar or cached oracle bytes.
10. A public API change (`renderSync`/`render`/`renderAll` signatures or exported
    option types).
11. The style-engine port needs behaviour not found in the Java read, a change to the
    flat `StyleMap`, or a change to how any existing engine resolves styles (D1, D12).
12. A test value or constant with no Java `file:line` or jar-probe backing (D8).
13. `src/core/style/skins/plantuml-skin.ts` drifts from the jar (T0d gate red).

## Push-forward (decide, journal, continue)

- A pure type or file-cap move that extends a write-set.
- Unit-pin updates explained by a measured mechanism and a Java quote.
- Pinning goldens that are survey-conformant, census 0-diff and routed `MINDMAP`.
- The planned D7 routing/refusal re-pin (139 rows misroute → agree) and any
  `[FIXED]`/`[CHANGED]` re-pin, from a fresh measurement.
- Porting a small unported upstream helper (klimt, `TextBlockUtils`, `Display`) the
  mindmap path reaches, not in another task's write-set — in the task's own commit.
- Purely stylistic choices; re-slotting a residual row to a better owner at a close.

## Execution rules (D10)

- Worktrees: `plans/mindmap-engine-port/measurements/mkwt.sh <Tn>` (links the
  gitignored dependencies, the `test-results` children and `.husky/_`).
- Agents run targeted tests + typecheck + eslint only; the orchestrator merges and
  runs the four gates. Agents: no Serena edit tools, no `git stash`, absolute
  worktree paths. Orchestrator: `git diff HEAD` empty before every merge.

## Batches

| Batch | Scope | Tasks | Parallel | Done |
|---|---|---|---|---|
| [0](batch-0/overview.md) | branch + ledger + b0, oracle harness, jar probes, jar skin | T0a–T0d | T0b–T0d ∥ | [x] |
| [1](batch-1/overview.md) | style values, signatures, packing geometry, parsing | T1a–T1d | all ∥ | [x] |
| [2](batch-2/overview.md) | Style + StyleStorage + StyleBuilder | T2a | — | [x] |
| [3](batch-3/overview.md) | style parser + loader, skinparam bridge, FtileBoxOld | T3a–T3c | all ∥ | [x] |
| [4](batch-4/overview.md) | Idea styles + FingerImpl + MindMap/Branch drawing | T4a | — | [x] |
| [5](batch-5/overview.md) | plugin, registration, chrome; first measurement | T5a | — | [x] |
| [6](batch-6/overview.md) | residual round: 7 families (written at the b5 close) | T6a–T6g | T6a–T6e ∥, then T6f/T6g | [ ] |
| [7](batch-7/overview.md) | exit + close-out + merge | T-exit, T-close-out | — | [ ] |

## Docs

[decisions.md](decisions.md) · [close-procedure.md](close-procedure.md) ·
[fixtures.md](fixtures.md) (ledger, seeded by T0a) ·
[diagrams/data-flow.md](diagrams/data-flow.md) ·
[diagrams/component-map.md](diagrams/component-map.md) ·
[decision-journal.md](decision-journal.md)
