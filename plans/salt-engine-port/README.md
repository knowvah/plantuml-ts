# salt-engine-port (sep)

**Read first, every start and after every compaction:**
`~/.claude/docs/reference/autonomous-execution.md`, then this file, then
[decisions.md](decisions.md), then the current batch's `overview.md`. Tail
[decision-journal.md](decision-journal.md) for where you stopped.

## Objective

Port PlantUML's `@startsalt` engine 1:1: `net/sourceforge/plantuml/salt/`,
`salt/element/` and `salt/factory/` (62 files, 5,669 lines, re-measured 2026-10-12) into
`src/diagrams/salt/` with upstream names and layout (D1). A mindmap-engine-port-style
harness (golden + diff-baseline ratchets) lands first, before any drawing (D6). The
engine draws on klimt only (no graphviz, so no DOT gate; no style engine, D3). Seed rows
are the three nested `{{salt}}` embeds that drew our 300×60 "unknown diagram type" box
after cdd8: `unknown/lubicu-73-fule059`, `class/bixogo-47-xulu385`,
`class/roxosu-00-pini153`. The description note seam named in the original hand-off was
already wired by lgm-T1e (b333452d0); embedded `{{salt}}` reaches `renderSync` today and
fails only because no salt plugin exists (D7).

Starting state (main `bbdbc7374`, measured 2026-10-12): salt survey **0 / 0 / 51**;
routing baseline salt tree 50 `SALT -> NONE` + 1 `NONE -> NONE`. T0a re-measures into
`measurements/b0.json` and corrects these numbers with a journal row.

**Exit target (D8):** salt **51/51 conformant** (any exception needs a named library that
forces it, and that is a stop — none is expected); the 3 seed rows conformant and pinned;
the activity and gantt `{{salt}}` rows measured and ledgered; 0 conformant losses in any
engine.

## Branch

`feat/salt-engine-port` off main, one merge commit at close (never squash: the journal
cites per-task commits). **Never push** (stop 8). `plans/` is tracked: commit the brief.
Each task gets its own worktree: `plans/salt-engine-port/measurements/mkwt.sh <Tid>`.

## Quality gates (all four before any commit lands on the branch)

```sh
npm test -- --maxWorkers=6 --reporter=default --reporter=json --outputFile.json=<path>
npm run typecheck
npm run lint
npm run build
```
The JSON reporter's collected file count must equal `find tests -name '*.test.ts' | wc -l`.
Check load with `uptime` first; above ~10, wait. A new src module ⇒ `npm run catalog`.
In a worktree the three npm-pack packaging tests fail (asset dirs are symlinks); judge them
on the mission checkout only.

Measurement: survey `npm run svg:survey -- <engine> --out <path>` (never the positional
form); render-diff `npx jiti plans/class-divergence-drive/tools/render-diff.mts
<tree>/<slug>`; oracle probes only via `scripts/oracle-render.sh <out-dir> <puml>`.
Batch close: [close-procedure.md](close-procedure.md).

## Stop conditions (halt, journal, report)

1. A task needs a file another task in the same batch owns.
2. The same gate fails on 2 consecutive fix attempts, or one code location changes 3 times
   without resolving the same check.
3. A finding contradicts D1–D9: amend `decisions.md`, then halt.
4. A conformant fixture in any engine stops being conformant, or `dotEqual` flips
   true→false, with no stated mechanism.
5. A diff count rises with no mechanism (a structural fall with a numeric rise is a reveal).
6. Collected ≠ on-disk after a `--maxWorkers=6` rerun, or a survey times out while load < 8.
7. More than **30** fixtures outside salt and the 5 embed rows change verdict at a close.
8. Any edit to dot-engine, the plantuml fork, the oracle jar or cached oracle bytes; any push.
9. Signing any acceptance (D8 allows none without a named library and the maintainer).
10. A needed klimt/sprite piece is missing or behaves unlike its Java (D4): report it; do
    not re-implement it inside salt.
11. A public API change beyond `@startsalt` (and `@startuml` + `salt`) rendering.
12. b0 is not 0/0/51, or the 3 error-text salt oracles prove to be stock-jar errors that
    change the row count (journal, then halt for the maintainer).

## Push-forward (decide, journal, continue)

- A pure type move or a file split forced by the complexity hook (journal the consumers).
- A unit-test pin update explained by a measured mechanism and a Java quote.
- Re-slotting a residual to a later batch, when its mechanism is stated.
- A residual-round fix in a file no other task owns: stated mechanism, one commit with a
  test (cdd8 rows 11, 24 precedent).
- `npm run catalog` whenever exports change.
- Authoring a `.puml` probe + jar render to pin a widget the corpus lacks (store it under
  `tests/fixtures/salt/`).

## Batches

| Batch | Tasks | Status |
|---|---|---|
| [0](batch-0/overview.md): branch, b0, harness | T0a, T0b | [x] |
| [1](batch-1/overview.md): foundations | T1a data source, T1b strategies, T1c element base | [x] |
| [2](batch-2/overview.md): elements + factory base | T2f klimt gaps (first), T2a widgets, T2b menus/tabs, T2c containers, T2d tree, T2e factory base, T2g UPixel + dimToUse (runs with batch 3) | [x] |
| [3](batch-3/overview.md): factories | T3a simple, T3b check/radio, T3c complex | [x] |
| [4](batch-4/overview.md): wiring + main pin close | T4a | [x] |
| [5](batch-5/overview.md): residual drive (written at the b4 close) | T5* | [x] |
| [exit](exit/overview.md): final + merge | T-exit | [ ] |

## Index

- [decisions.md](decisions.md): D1–D9 (locked 2026-10-12)
- [fixtures.md](fixtures.md): row ledger (T0a fills it)
- [close-procedure.md](close-procedure.md): standard batch close
- [batch-1/task-preamble.md](batch-1/task-preamble.md): prepended to every agent prompt
- [decision-journal.md](decision-journal.md): append-only
- [diagrams/component-map.md](diagrams/component-map.md), [diagrams/data-flow.md](diagrams/data-flow.md)
- [settings.autonomous.json](settings.autonomous.json): copy to `.claude/settings.autonomous.json`

Recommended executor: `fable` (long-horizon, 1M context).
