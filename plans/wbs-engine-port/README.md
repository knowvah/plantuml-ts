# wbs-engine-port (wep)

**Read first, every start and after every compaction:**
`~/.claude/docs/reference/autonomous-execution.md`, then this file, then
[decisions.md](decisions.md), then the current batch's `overview.md`. Tail
[decision-journal.md](decision-journal.md) for where you stopped.

## Objective

Port PlantUML's `@startwbs` engine 1:1: `net/sourceforge/plantuml/wbs/` (15 files,
1,995 lines, measured 2026-10-12) into `src/diagrams/wbs/` with upstream names and layout
(D1). The harness lands first (D7), before any drawing. The engine draws on klimt only
(no graphviz, no DOT gate). **WBS has its own tree layout** (`Fork` → `ITFComposed` →
`ITFLeaf`, D2) — it does NOT reuse mindmap's `Finger`/`Tetris`; what it shares with
mindmap is the style machinery and the plugin/export shape. The embed seed row is
`activity/bozido-07-geze049`, whose wbs slot (163×145) is blocked on this engine (its gantt
slot stays blocked). Sep follow-on 6 / mission-index D3.

Starting state (main `50df8d98e`, 2026-10-12): wbs survey **0 / 0 / 204** (every row renders
the dispatcher's `ERROR_SENTINEL`); routing baseline wbs tree 176 `WBS -> NONE`
known-misroute + 26 jar-error + 2 agree `NONE -> NONE`; 28 stock-error rows (20 "Syntax
Error?", 3 "Bad tree structure", 3 one-root, 2 blank). T0a re-measures into
`measurements/b0.json` and corrects these numbers with a journal row.

**Exit target (D10):** wbs **204/204 conformant** under `DeterministicMeasurer` (jar errors
+ we error = conformant, rule 2026-10-10; any other exception needs a named library that
forces it — none expected); every byte-identical row pinned; bozido's wbs slot measured;
0 conformant losses in any of the 28 engines; four gates green.

## Branch

`feat/wbs-engine-port` off main, one merge commit at close (never squash: the journal
cites per-task commits). **Never push** (stop 8); at exit merge into local main and the
maintainer pushes main (the repo allows only rebase-and-merge on GitHub). `plans/` is
tracked: commit the brief. Each task gets its own worktree:
`plans/wbs-engine-port/measurements/mkwt.sh <Tid>` (links `.husky/_`, so hooks run).

## Quality gates (all four before any commit lands on the branch)

```sh
npm test -- --maxWorkers=6 --reporter=default --reporter=json --outputFile.json=<path>
npm run typecheck
npm run lint
npm run build
```
The JSON reporter's collected file count (`testResults.length`) must equal
`find tests -name '*.test.ts' -not -path 'tests/e2e/*' | wc -l`. Check `uptime` first:
foreign load (other repos' builds) can sit at 20–40 for hours — it is not a finding
(`.agent-notes/sep-close.md`). A new src module ⇒ `npm run catalog`. In a worktree the
three npm-pack packaging tests fail (asset dirs are symlinks); judge them on the mission
checkout only.

Measurement: survey `npm run svg:survey -- <engine> --out <path>` (never the positional
form); render-diff `npx jiti plans/class-divergence-drive/tools/render-diff.mts
<tree>/<slug>`; oracle probes only via `scripts/oracle-render.sh <out-dir> <puml>`.
Batch close: [close-procedure.md](close-procedure.md).

## Stop conditions (halt, journal, report)

1. A task needs a file outside its write-set (beyond a pure type move or a hook-forced split).
2. The same gate check fails on 2 consecutive fix attempts, or one code location changes 3
   times without resolving the same check.
3. A Java reading contradicts a D-decision, or a decision would need a library-forced divergence.
4. A conformant fixture in any engine stops being conformant, or `dotEqual` flips
   true→false, with no stated mechanism.
5. A diff-baseline score rises with no mechanism (a structural fall with a numeric rise is a reveal).
6. Collected ≠ on-disk after a `--maxWorkers=6` rerun, or a wbs survey row times out while
   load is under the chain's gate.
7. More than **30** fixtures outside wbs and the bozido embed row change verdict at a close.
8. Any edit to dot-engine, the plantuml fork, the oracle jar or cached oracle bytes; any push.
9. Signing any acceptance or accepted-divergence entry.
10. A needed klimt / ftile / style piece is missing or behaves unlike its Java
    (`FtileBoxOld.createWbs`, `getMergedStyleSpecial`, `XRectangle2D.intersect`,
    `AbstractCommonUGraphic.getTranslate`): report it; never re-implement it inside wbs.
11. A public API change beyond `@startwbs` (and `{{wbs}}` embeds) rendering.
12. b0 is not 0/0/204, or the 28 stock-error rows prove to be something the error-page rule
    does not cover (journal, then halt for the maintainer).

## Push-forward (decide, journal, continue)

- A pure type move or a file split forced by the complexity hook (journal the consumers).
- A unit-test pin update explained by a measured mechanism and a Java quote.
- Re-slotting a residual to a later batch, when its mechanism is stated.
- A residual-round fix in a file no other task owns: stated mechanism, one commit with a test.
- A write-set the spec under-estimated for a piece the approved task already covers (sep
  journal rows 37/41): extend it, journal the files, resume the same agent.
- A survey chain starved by foreign load: raise the gate via a scratch copy of `chain.sh`,
  journal the load, diff against the last complete chain.
- `npm run catalog` whenever exports change; the dashboard families at the wiring close.
- Brief corrections found in the Java (the guide's "mindmap layout" claim is one).

## Execution

| Batch | Tasks | Parallel | Done |
|---|---|---|---|
| [0](batch-0/overview.md): branch, b0, harness, `getWBSDirection` | T0a → T0b ∥ T0c | T0b ∥ T0c | [x] |
| [1](batch-1/overview.md): model + leaf text blocks | T1a, T1b, T1c | all ∥ | [x] |
| [2](batch-2/overview.md): tree layout + diagram | T2a, T2b | ∥ (Fork contract) | [x] |
| [3](batch-3/overview.md): commands + factory | T3a ∥ T3b → T3c | two waves | [x] |
| [4](batch-4/overview.md): plugin wiring + main pin close | T4a | — | [x] |
| [5](batch-5/overview.md): residual drive (written at the b4 close) + T5-cov | T5* | per spec | [ ] |
| [exit](exit/overview.md): final + merge | T-exit | — | [ ] |
| [exit](exit/overview.md): next mission brief (after merge) | T-next: `@startuml` utility factories (`listopeniconic`, …) | — | [ ] |

Executor: `fable`. Subagents: `typescript-pro` — opus for T1a, T1b, T2a, T2b, T4a, T5-cov;
sonnet for T0b, T0c, T1c, T3a–T3c. Every agent prompt = worktree header +
[task-preamble.md](task-preamble.md) + the task file.

## Index

- [decisions.md](decisions.md): D1–D12 (approved 2026-10-12)
- [fixtures.md](fixtures.md): row ledger (T0a fills it)
- [close-procedure.md](close-procedure.md): standard batch close
- [task-preamble.md](task-preamble.md): prepended to every agent prompt
- [decision-journal.md](decision-journal.md): append-only
- [diagrams/component-map.md](diagrams/component-map.md), [diagrams/data-flow.md](diagrams/data-flow.md)
- [settings.autonomous.json](settings.autonomous.json): copy to `.claude/settings.autonomous.json`
- Precedents: `plans/salt-engine-port/` (sep, the shape this brief copies),
  `plans/mindmap-engine-port/` (style engine, plugin shape), `.agent-notes/sep-*.md`.
