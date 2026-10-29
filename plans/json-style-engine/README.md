# json-style-engine (jse)

**Read first, every start and after every compaction:**
`~/.claude/docs/reference/autonomous-execution.md`, then this file, then
[decisions.md](decisions.md), then the current batch's `overview.md`. Tail
[decision-journal.md](decision-journal.md) for where you stopped.

## Status — EXECUTING 2026-10-29 (batches 0-3 closed; b2+b3 jointly, journal row 18; next: batch 4)

## Objective

Move `@startjson` / `@startyaml` / `@starthcl` styling off the hand-keyed
`StyleMap` projection (`src/core/style-map-json-diagram.ts` → `Theme.colors.graph.json`)
onto the ported `Style` / `StyleSignatureBasic` engine that files, mindmap,
wbs, salt and gantt already use, resolving every style at the jar's own
signatures (`TextBlockJson.java:138-152,269-299`, `SmetanaForJson.java:112-125`).

| target row (structural diffs today) | mechanism |
|---|---|
| json/highlight-stereotype (2) | stereotype class on `#highlight` unread (`withTOBECHANGED`) |
| json/style-highlight-block (7) | `jsonDiagram { highlight {…} }` unread |
| json/style-header-separator-arrow (13) | `header` FontColor, `separator` Line* unread; no header font field |
| json/theme-cerulean (23) | theme `root`/`node` (RoundCorner 20, gradient BackgroundColor) never reach json |

Starting state (main `d0d37ec18`, 2026-10-29): pins json 14 / yaml 7 / hcl 1;
structural manifest 150 clean + 3 ceilings; extension examples json 7 / yaml 7
/ hcl 10; json 14/35/1, yaml 7/31/1, hcl 1/2/0. **Target (D7):** the 4 rows and
every new authored row structurally clean; pins byte-equal (jar-compatible
mode); manifest shrink-only; 0 conformant losses in the 28 other engines; d.ts
byte-identical; every extended-mode mover journaled with a mechanism.

## Branch

`feat/json-style-engine` off main `d0d37ec18` (T0a creates it and commits this
brief). One unsigned commit per task in worktrees `jse/<Tn>`, `--no-ff` task
merges, a close commit per batch. **Do not merge main into the branch.** The
squash batch rebuilds one commit per batch and tags `jse/pre-squash`. The user
signs (`git rebase --force-rebase -S d0d37ec18`), pushes, opens the PR. **Never push.**

## Quality gates (all four before any close commit)

```sh
bash plans/json-style-engine/measurements/gates.sh <tag>
# = npm test -- --maxWorkers=4 (JSON reporter) · typecheck · lint · build
```
Collected (JSON reporter) must equal on-disk. `uptime` first; above ~10 wait.
New src module ⇒ `npm run catalog` (drift-gated).

- `$T` = `plans/json-style-engine/tools/`, `$M` = `plans/json-style-engine/measurements/`.
- Survey: `npm run svg:survey -- <json|yaml|hcl> --out <path>` (never positional).
  All engines: `LOAD_MAX=8 SVG_PARITY_TIMEOUT_MS=900000 SVG_PARITY_CONCURRENCY=3 bash $M/chain.sh <bN-eng>`;
  diff with `node $T/verdict-diff.mjs <prev> <next>`.
- One row: `npx tsx $T/diff-one.mts <json|yaml|hcl> <slug> [--structural|--survey]`.
- Extended-mode baseline (D6, T0b): `npx tsx $T/extended-baseline.mts [--write|--check] <map>`.
- Oracle renders: `scripts/oracle-render.sh <ABSOLUTE out-dir> <puml>` only.
- Batch close: [close-procedure.md](close-procedure.md).

## Stop conditions (halt, journal, report)

1. A task needs a file outside its write-set or one a same-batch task owns (T2a/T2b, T3a/T3b disjoint; an overlap collapses them into one agent in a follow-up batch).
2. The same gate fails on 2 consecutive fix attempts, or one code location changes 3 times without resolving the same check — halt with the diagnosis artifact (mechanism, origin `file:line`, causal chain, ruled out).
3. A finding contradicts D1–D7: amend `decisions.md` (dated), then halt.
4. Any jar-compatible byte moves on a pinned json/yaml/hcl golden; a manifest `clean` row stops being clean; a ceiling would grow (manifest is shrink-only).
5. A conformant row in any of the 28 engines leaves conformant (all-engine chain at every close and after any `src/core/` commit).
6. Any diff against `$M/b0-plantuml-ts.d.ts.txt` (plugin seam exempt; quote a seam touch in the journal).
7. An extended-mode mover on the D6 baseline with no stated mechanism (a mover WITH its `FromSkinparamToStyle`/skin line is a journal row, not a stop).
8. Widening the jar-compatible cut (`json-family-style-input.ts`, `hclStyleInput`) or any json-only branch in a `src/core/` file.
9. A fitted constant or behaviour without an upstream `file:line` in the same commit; an oracle by a hand-typed `java -jar`; any edit to dot-engine, the plantuml fork, the oracle jar or cached oracle bytes; any push.
10. Proposing an `oracle/accepted-divergences.json` entry or a new manifest ceiling (the user signs). Positional-only residue is not a stop.
11. A new runtime dependency; DOM/async/Node built-ins, `Date`, `Date.now()` or `Math.random()` in `src/`.
12. Collected ≠ on-disk after a `--maxWorkers=4` rerun, or a survey timeout at load below 8.
13. A jar oracle for an authored fixture is an error page twice on the same construct.
14. T4a finds a residual whose origin is `src/core/` (report; never patch around it in the family).

## Push-forward (decide, journal, continue)

- Helper splits forced by the 500-line / complexity hooks inside `src/diagrams/{json,yaml,hcl}/` (journal the new file).
- Re-pinning family parity files, goldens, routing/refusal clones, manifest `clean` appends and extension examples at closes (orchestrator only) when every changed row moved toward the jar — or, for an extension pin, when the move carries its `FromSkinparamToStyle` line.
- Re-pointing or deleting a unit test that asserts a projection value D3 removes, reason in the commit body.
- Dropping an authored fixture variant the jar cannot express (Java reason) for the nearest construct it can.
- Rerunning a timed-out vitest or survey at lower load before calling it a finding.
- Regenerating `docs/catalog.md` at merges when exports change.
- Skipping T4a when b3 leaves no residual (journal it).
- Committing the regenerated `docs/architecture/` on its own `docs/architecture-refresh` branch, separate from the mission, for the user to sign.

## Execution rules

- Tasks run in worktrees (`bash $M/mkwt.sh <Tn>`); agents commit unsigned, never push, never use Serena edit tools or `git stash`, never leave a background process running. Hand-backs can be empty or wrong: read each worktree's `git log`/diff and rerun its tests at merge.
- Before every merge: `git diff HEAD` empty. After: `bash $M/merge-one.sh`.
- Every task prompt = its `TN-*.md` + [task-contract.md](task-contract.md).
- Journal every decision, mover and halt with its commit.

## Batches

| batch | tasks | status |
|---|---|---|
| [0 — branch, tooling, extended baseline, authored fixtures](batch-0/overview.md) | T0a, T0b, T0c, close | [x] |
| [1 — the family SkinParam and the style resolver](batch-1/overview.md) | T1a, T1b, close | [x] |
| [2 — measurement and paint read the engine](batch-2/overview.md) | T2a, T2b, close | [x] |
| [3 — extended mode and retiring the projection](batch-3/overview.md) | T3a, T3b, close | [x] |
| [4 — residuals](batch-4/overview.md) | T4a, close | [ ] |
| [exit](batch-exit/overview.md) | final measurement, docs, memory | [ ] |
| [squash](batch-squash/overview.md) | one commit per batch, tag `jse/pre-squash` | [ ] |

## Documents

- [decisions.md](decisions.md) — D1–D9, user-approved 2026-10-29.
- [task-contract.md](task-contract.md) — the contract every agent prompt includes.
- [close-procedure.md](close-procedure.md) — standard batch close.
- [fixtures.md](fixtures.md) — counts per checkpoint, target rows, authored ledger.
- [decision-journal.md](decision-journal.md) — appended during execution.
- [diagrams/component-map.md](diagrams/component-map.md), [diagrams/data-flow.md](diagrams/data-flow.md).

## Prior context (read only what a task points at)

- `plans/data-diagram-conformance/decision-journal.md` rows 33 (mechanism + the T2d evidence patch) and 37 (T3a `defaultFontColor`).
- `DIVERGENCES.md` "Two style paths" (~line 995) and "Extensions".
- `src/diagrams/files/{parser,files-skin-param,files-style-input,files-extensions,layout,index}.ts` — the live pattern.
- Memories: `honour-ignored-styling-extension`, `always-mirror-the-jar`, `agents-write-main-via-serena`, `gate-merges-on-full-set-and-typecheck`, `squash-per-batch-at-end`, `ddc-status`.
