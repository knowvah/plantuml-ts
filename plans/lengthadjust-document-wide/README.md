# lengthadjust-document-wide (lad)

**Read first, every start and after every compaction:**
`~/.claude/docs/reference/autonomous-execution.md`, then this file, then
[decisions.md](decisions.md), then the current batch's `overview.md`. Tail
[decision-journal.md](decision-journal.md) for where you stopped.

## Status — DONE 2026-10-24 (started 2026-10-23); Amendment 1 (user ruling) in decisions.md

## Objective

> **Amendment 1 (2026-10-23):** json/yaml/hcl/files ignore the skinparam in
> the jar (`StyleExtractor.java:88-96`). By user ruling the port honours it
> (and all their skinparams/styling) as a documented extension; conformance
> runs in an internal jar-compatible mode (D9). Targets below are amended in
> decisions.md D5/D8 (51 exact + 13 baseline textLength rows).

Make `skinparam lengthAdjust` behave as the jar does on every ported engine,
not only sequence. Upstream applies it once per document: `TextBlockExporter
.java:306-307` hands `skinParam.getlengthAdjust()` to the SVG option for every
titled diagram; `SkinParam.java:1258-1269` maps `spacingAndGlyphs` / `spacing`
/ `none` (case-insensitive) else `LengthAdjust.defaultValue()` = SPACING
(`style/LengthAdjust.java:38-45`); `SvgGraphics.java:155-158` writes
`lengthAdjust="spacing"` on the root `<g>` for SPACING, `spacingAndGlyphs` for
that value and NOTHING for NONE; `SvgGraphics.java:699-705` writes `textLength`
per `<text>` only when `text.length() > 1` and the option is SPACING or
SPACING_AND_GLYPHS. The port's skinparam chain, `RenderFragment.lengthAdjust`,
the document shell and klimt's `SvgOption.lengthAdjust` already exist (sdd3-T2c
wired sequence); this drive wires the other 15 engine routes and gates them
with authored fixtures and jar oracles. Four engines (board, files,
packetdiag, chart) also move off the generic `svgRoot` onto the shared shell,
which the jar's `data-diagram-type` on their oracles shows is the mirror (D2).

Starting state (main `bf18ede54`, 2026-10-24): sequence honours all three
values (4 corpus rows pinned); class, state, activity, json/yaml/hcl,
description, mindmap, salt, wbs, board, files, packetdiag and chart emit
`lengthAdjust="spacing"` and keep `textLength` under `none`, and ignore
`spacingAndGlyphs` (probes in `.agent-notes/codeql-2026-10-24.md`). Target
(D5/D8): 64 authored rows (16 engines × 4 variants) with the root `<g>`
attribute set equal to the oracle and `textLength` presence equal wherever the
engine's emitter writes `textLength` (12 rows of the four re-routed engines
are baselined with their mechanism); 0 conformant losses in 28 engines; 0
unexplained verdict movers; every existing pin byte-stable.

## Branch

`feat/lengthadjust-document-wide` off main `bf18ede54` (T0a creates it and
commits this brief). One unsigned commit per task, `--no-ff` merges of task
branches, a close commit per batch. **Do not merge main into the branch
mid-drive.** At the end the squash batch rebuilds one commit per batch from
the close trees and tags the working history `lad/pre-squash` (D7). The user
signs (`git rebase --force-rebase -S bf18ede54`), pushes, opens the PR.
**Never push.**

## Quality gates (all four before any commit lands on the branch)

```sh
bash plans/lengthadjust-document-wide/measurements/gates.sh <tag>
# = npm test -- --maxWorkers=4 (JSON reporter) · typecheck · lint · build
```
Collected (JSON reporter) must equal on-disk. Check `uptime` first; above
~10 wait (another session may be loading the box). New src module ⇒
`npm run catalog`.

- `$T` = `plans/lengthadjust-document-wide/tools/`,
  `$M` = `plans/lengthadjust-document-wide/measurements/`.
- Authored gate: `npx vitest run tests/oracle/svg-conformance/lengthadjust.
  authored.ratchet.test.ts`; rebuild the baseline with
  `npx jiti $T/build-authored-baseline.mts <commit> [--write]` (T0c writes it).
- Survey one engine: `npm run svg:survey -- <engine> --out <path>` (never
  positional). All engines: `bash $M/chain.sh <bN-eng>`; diff with
  `node $T/verdict-diff.mjs <prev-eng> <next-eng>`.
- Oracle renders: `scripts/oracle-render.sh <out-dir> <puml>` only.
- Batch close: [close-procedure.md](close-procedure.md).

## Stop conditions (halt, journal, report)

1. A task needs a file another task in the same batch owns, or any file
   outside its write-set.
2. The same gate fails on 2 consecutive fix attempts, or one code location
   changes 3 times without resolving the same check. The halt carries the
   diagnosis artifact (mechanism, origin `file:line`, causal chain, ruled out).
3. A finding contradicts a decision (D1–D8): amend `decisions.md`, then halt.
4. A conformant fixture in any engine leaves conformant without a stated
   mechanism (all-engine chain at every close).
5. A pinned golden in any family stops being byte-equal, or any diff-baseline
   or census row rises, with no `skinparam lengthAdjust` in its source (D4
   violated).
6. An authored row's `rootExact` or `textLengthMatch` flips true → false, or
   its weighted score rises.
7. A T2f engine's root differs from its oracle in any attribute other than
   the lengthAdjust family after the route change.
8. More than 4 engines show verdict movers at a close, or any mover outside
   board/files/packetdiag/chart has no mechanism (expected movers: those four
   at the batch-2 close only).
9. Survey and the authored gate disagree on a fixture and the mechanism is
   not isolated inside the 2-fix budget.
10. Any public API change: `render`/`renderSync` signatures, exported types, a
    `Theme` or `RenderOptions` field added or removed.
11. A fitted constant or new behaviour without an upstream `file:line` in the
    same commit; any oracle rendered by a hand-typed `java -jar`.
12. Any edit to dot-engine or the plantuml fork; any change to the oracle jar
    or cached oracle bytes under `test-results/`; any push.
13. Proposing an entry in `oracle/accepted-divergences.json` (the user signs).
14. Collected ≠ on-disk after a `--maxWorkers=4` rerun, or a survey timeout at
    load below 8.
15. T0d cannot name, with `file:line`, whether each harness mirror preserves
    the field: halt with the partial artifact, never with a guessed fix.
16. A new runtime dependency, or DOM/async/Node built-ins in `src/`.
17. An authored oracle is the jar's error page for a syntax this port
    renders: fix the fixture once; a second error on the same engine halts.

## Push-forward (decide, journal, continue)

- Helper splits forced by the 500-line hook — journal the new file.
- Rebuilding `authored-baseline.json` at a close when every changed row moved
  toward exact (diff the JSON; a row that got worse is stop 6).
- Re-pinning `parity-<engine>.json` for board/files/packetdiag/chart after
  T2f, each mover explained by the route change.
- Pinning any newly zero-diff corpus row at a close (orchestrator only).
- Fixing a harness mirror inside the engine's own task when T0d named the
  exact line (D6).
- Spawning a fix task from a complete diagnosis artifact, write-set
  journaled before work starts.
- Dropping one variant for one engine when the jar cannot express it there
  (journal the Java reason); never dropping an engine.

## Execution rules (D7)

- Tasks run in worktrees (`bash $M/mkwt.sh <Tn>`); agents commit unsigned,
  never push, never use Serena edit tools or `git stash`.
- Before every merge: `git diff HEAD` empty on the mission branch. After every
  merge: `bash $M/merge-one.sh` runs the authored gate and the engine's golden
  ratchet. Two green branches can break a pin only when merged.
- Every task prompt = its `TN-*.md` + [task-contract.md](task-contract.md).
- Journal every decision, mover and halt with its commit.

## Batches

| Batch | Scope | Tasks | Done |
|---|---|---|---|
| [0](batch-0/overview.md) | branch, tools, b0 measurement, authored fixtures + oracles, harness, mirror audit | T0a–T0d, close | [x] |
| [1](batch-1/overview.md) | shell arms for the four re-routed types; class, state, json/yaml/hcl; D9 jar-compatible seam | T1a–T1e, close | [x] |
| [2](batch-2/overview.md) | klimt-shaped engines (activity, description, mindmap, wbs, salt); board/files/packetdiag/chart re-route | T2a–T2f, close | [x] |
| [3](batch-3/overview.md) | extension (Amendment 1): audit, pinned examples, DIVERGENCES.md + docs-site | T3a, close | [x] |
| [exit](batch-exit/overview.md) | final measurement vs b0, baseline rebuild, docs, memory, PR prep | T-exit | [x] |
| [squash](batch-squash/overview.md) | one commit per batch; tag the working history | T-squash | [x] |

## Documents

- [decisions.md](decisions.md): D1–D8, locked; Amendment 1 (D9, D10, user ruling 2026-10-23)
- [task-contract.md](task-contract.md): shared by every task prompt
- [close-procedure.md](close-procedure.md): standard batch close
- [fixtures.md](fixtures.md): the 64-row authored ledger (seeded at T0c)
- [decision-journal.md](decision-journal.md): one row per decision, mover, halt
- [diagrams/data-flow.md](diagrams/data-flow.md) ·
  [diagrams/component-map.md](diagrams/component-map.md)
- `diagnosis/mirrors.md` (T0d artifact)
- `settings.autonomous.json` → copied to `.claude/settings.autonomous.json`

## Prior context (read only what a task points at)

- `plans/sequence-divergence-drive-3/batch-2/T2c-lengthadjust-skinparam.md`
  — the sequence wiring this drive generalises; its journal rows 40–47.
- `.agent-notes/codeql-2026-10-24.md` — the 2026-10-24 probes (which engines
  ignore the skinparam; D2 engines write no `textLength`).
- `tests/oracle/svg-conformance/render-fixture-utility.ts` and
  `utility.diff-baseline.ratchet.test.ts` — the authored-fixture harness
  pattern T0c copies.
- `plans/sequence-divergence-drive-3/batch-squash/overview.md` — the D11
  squash procedure this brief's squash batch repeats.

## Final status (2026-10-24)

| checkpoint | rootExact | textLength exact | baseline rows | Σ score | 28-engine vs b0 | gates |
|---|---:|---:|---:|---:|---|---|
| b0 (`accb08bb5`) | 40/64 | 42 | 13 | 4121 | — | 1577/1577, 0 failed |
| b1 (`724235b2c`) | 46 | 45 | 13 | 4109 | 0 movers, 0 losses | 1582/1582 |
| b2 (`d486af48d`) | 64 | 51 | 13 | 1711 | 0 movers, 0 losses | 1591/1591 (after a catalog fix) |
| b3 (`05b08187f`) | 64 | 51 | 13 | 1711 | 0 movers, 0 losses | 1592/1592 |
| final (`786438c18`) | **64/64** | **51/51 exact rows** | 13 (all improved) | 1711 | 0 movers, 0 losses | 1592/1592, 0 failed |

- Tasks: 18 planned + amended (T0a–T0d, T1a–T1e, T2a–T2f, T3a, exit dedupe) —
  all done. One halt (stop 3, journal row 4) resolved by the user's extension
  ruling (Amendment 1: D9 seam, D10 docs; T1e and batch 3 added).
- Decisions journaled: 32 rows. **Flagged for review:** row 21 (T2a wrote a new
  helper file outside its write-set — since removed by the dedupe), row 24 (T2f
  updated 12 pre-existing renderer-test assertions outside its write-set as a
  direct consequence of D2), row 18 (T2b write-set extended by
  `description/index.ts`).
- Output changes: `skinparam lengthAdjust none|spacingAndGlyphs` now honoured
  by class, object, state, activity, component, usecase, c4, mindmap, wbs,
  salt, board, files, packet, chart (and json/yaml/hcl/files as an extension);
  board/files/packet/chart root `<svg>` now carries the jar's attribute set
  incl. `data-diagram-type`; json/yaml/hcl/files honour their skinparams and
  hcl its `<style>`/`skin`/`!theme` by default (jar-compatible mode for
  conformance).
- Follow-ons: `planning/next-missions.md` lad section (extension gaps, the 13
  baseline rows' emitter gap).
