# utility-factories-port (ufp)

**Read first, every start and after every compaction:**
`~/.claude/docs/reference/autonomous-execution.md`, then this file, then
[decisions.md](decisions.md), then the current batch's `overview.md`. Tail
[decision-journal.md](decision-journal.md) for where you stopped.

## Objective

Port PlantUML's `@startuml` single-line utility diagrams 1:1 (D1): `listopeniconic`,
`openiconic <name>`, `colors [c]`, `emoji <block>`, `listsprite`, `sudoku [seed]`, `charlie`,
the 10 public dedication sentences, `license`, `version`/`about`/`authors`, bare `stdlib`,
`donors`, `skinparameters`, and the eggs (Egg/AppleTwo/RIP). Each factory is a plugin
registered at its upstream `PSystemBuilder.java:133-200` position (D2) through a ported
`PSystemSingleLineFactory` gate (D3). Maintainer request 2026-10-13 (wep T-next).

Starting state (main `a128473c8`, 2026-10-13): the **17 in-scope corpus rows** (all
`test-results/dot-cache/unknown/`, [fixtures.md](fixtures.md)) render our error page or the
sentinel; routing pins them `agree NONE -> NONE`, refusal `known-gap` (`weErrored: true`).
T0a re-measures into `measurements/b0.json` and corrects these numbers with a journal row.

**Out of scope (D-rulings):** `listfonts` (host fonts), `help` (own mission),
`@startcreole/math/latex/def/sprites/crash`, `path` (INSECURE only), encrypted dedications,
the key tools and `testdot`.

**Exit target (D11):** all 17 rows survey-conformant under `DeterministicMeasurer`; every
byte-identical row pinned in `oracle/goldens/svg-utility/`; every authored fixture conformant
or carrying a mechanism; routing/refusal records corrected (HELP reason, `kubuju`); 0
conformant losses in any engine; four gates green.

## Branch

`feat/utility-factories-port` off main, one merge commit at close (never squash). **Never
push** (stop 8). `plans/` is tracked: commit the brief. Each task gets its own worktree:
`plans/utility-factories-port/measurements/mkwt.sh <Tid>`.

## Quality gates (all four before any commit lands on the branch)

```sh
npm test -- --maxWorkers=6 --reporter=default --reporter=json --outputFile.json=<path>
npm run typecheck
npm run lint
npm run build
```
JSON `testResults.length` must equal `find tests -name '*.test.ts' -not -path 'tests/e2e/*' | wc -l`.
Check `uptime` first (foreign load is not a finding). Typecheck must pass BEFORE `git commit`
(wep row 34). New src module ⇒ `npm run catalog`. In a worktree the 4 npm-pack packaging tests
fail; judge them on the mission checkout. Measurement: `npm run svg:survey -- <engine> --out
<path>`; `npx jiti plans/class-divergence-drive/tools/render-diff.mts unknown/<slug>`; oracles
only via `scripts/oracle-render.sh`. Batch close: [close-procedure.md](close-procedure.md).

## Stop conditions (halt, journal, report)

1. A task needs a file outside its write-set (beyond a pure type move or a hook-forced split).
2. The same gate check fails on 2 consecutive fix attempts, or one code location changes 3
   times without resolving the same check.
3. A Java reading contradicts a D-decision, or a decision would need a library-forced divergence.
4. A conformant fixture in any engine stops being conformant, or `dotEqual` flips true→false,
   with no stated mechanism.
5. A diff-baseline score rises with no mechanism.
6. Collected ≠ on-disk after a `--maxWorkers=6` rerun, or a survey row times out under the gate.
7. Any fixture outside the 17 in-scope rows changes routing owner (a utility plugin stealing a
   UML source).
8. Any edit to dot-engine, the plantuml fork, the oracle jar or cached oracle bytes; any push.
9. Signing any acceptance or accepted-divergence entry (retiring a now-conformant one is fine).
10. A needed core piece is missing or behaves unlike its Java beyond those pre-declared in
    T0c/T0d/T0e: report it.
11. A public API change beyond these inputs rendering.
12. `npm run build` output grows by more than 250 KB over b0.
13. A utility render differs across three runs of one input, or an oracle does (except the
    known clock-gated error banner, `PSystemError.java:221-229`).
14. A factory needs host- or Node-only behaviour (`listfonts`-like): report, never stub.

## Push-forward (decide, journal, continue)

- A pure type move or a complexity-hook split (incl. `DLXEngine` by inner class); journal consumers.
- A unit-test pin update explained by a measured mechanism and a Java quote.
- Re-slotting a residual to a later batch once its mechanism is stated.
- A residual fix in a file no other task owns: stated mechanism, one commit with a test.
- A write-set the spec under-estimated for a piece the approved task covers: extend, journal, resume.
- A survey chain starved by foreign load: scratch copy of `chain.sh` with the gate raised; journal.
- `npm run catalog` when exports change; dashboard family additions at the wiring close.
- Brief corrections found in the Java (journal, flag for review).
- Starting a batch before the previous close finishes when its dependencies are code-only.

## Execution

| Batch | Tasks | Parallel | Done |
|---|---|---|---|
| [0](batch-0/overview.md): branch, b0, harness, core bases, colour core, data | T0a → T0b ∥ T0c ∥ T0d ∥ T0e | after T0a | [x] |
| [1a](batch-1a/overview.md): openiconic, colors, emoji list, archimate list | T1a–T1d | all ∥ | [ ] |
| [1b](batch-1b/overview.md): sudoku, version/license, donors+skinparameters, eggs+dedication | T1e–T1h | all ∥ (∥ 1a) | [ ] |
| [2](batch-2/overview.md): registration in upstream order + main pin close | T2a | — | [ ] |
| [3](batch-3/overview.md): residual drive (written at the b2 close) + T3-cov | T3* | per spec | [ ] |
| [exit](exit/overview.md): final + merge | T-exit | — | [ ] |

Executor: `fable`. Subagents: `typescript-pro` — opus for T0c, T0e, T1a, T1b, T1e, T1f, T1h,
T2a, T3-cov; sonnet for T0b, T0d, T1c, T1d, T1g. Every agent prompt = worktree header +
[task-preamble.md](task-preamble.md) + the task file.

## Index

- [decisions.md](decisions.md): D1–D12 (approved 2026-10-13)
- [fixtures.md](fixtures.md): row ledger (T0a fills it)
- [close-procedure.md](close-procedure.md), [task-preamble.md](task-preamble.md)
- [decision-journal.md](decision-journal.md): append-only
- [diagrams/component-map.md](diagrams/component-map.md), [diagrams/data-flow.md](diagrams/data-flow.md)
- [settings.autonomous.json](settings.autonomous.json): copy to `.claude/settings.autonomous.json`
- Precedents: `plans/wbs-engine-port/` (wep, the shape this brief copies), `plans/salt-engine-port/`,
  `.agent-notes/wep-*.md`, `plans/unknown-bucket-routing-repair/diagnosis/T6.md` (the gap record).
