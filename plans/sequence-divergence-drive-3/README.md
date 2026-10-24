# sequence-divergence-drive-3 (sdd3)

**Read first, every start and after every compaction:**
`~/.claude/docs/reference/autonomous-execution.md`, then this file, then
[decisions.md](decisions.md), then the current batch's `overview.md`. Tail
[decision-journal.md](decision-journal.md) for where you stopped.

## Status — IN PROGRESS (started 2026-10-22; batch 0 closed 2026-10-22)

## Objective

Finish sequence parity: take the last **101 open sequence rows (Σ 3800)**
to zero against the jar and pin them, losing nothing in any engine. sdd2
left them filed by mechanism (`../sequence-divergence-drive-2/fixtures.md`);
the sdd3 prerequisites (PR #87: `to255`, emoji case, harness asset store)
are on main. What remains is twenty-odd small families plus five large
structural pieces: the scale/chrome export order (15 rows), the SAX sprite
parser (30), handwritten mode through `UGraphic` (4), remote images through
an injectable `ImageProvider` (1), and JLaTeXMath `array` sizing (1). The
jar is always teoz: cite `sequencediagram/teoz/` and `skin/rose/`.

Starting state (main `5f954eeff`, 2026-10-22,
`measurements/planning-classify.json`): 1143 rows — zero 1042 · geometry
52 · structural 32 · paint-only 17; pins 1042; Σ 3800. Batch 0's b0
(`measurements/b0*`) is the reference for every loss and rise. Target (D9):
**all 101 to zero and pinned (1143)**, 0 conformant losses, 0 unexplained
rises; a miss needs a named mechanism and an owner in `fixtures.md`.

## Branch

`feat/sequence-divergence-drive-3` off main (T0a creates it and commits
this brief). While the drive runs: one unsigned commit per task, `--no-ff`
merges of task branches, a close commit per batch. **Do not merge main into
the branch mid-drive.** At the end the squash batch rebuilds one commit per
batch from the close trees and tags the working history `sdd3/pre-squash`
(D11). The user then signs (`git rebase --force-rebase -S <base>`), pushes
and opens the PR. **Never push.**

## Quality gates (all four before any commit lands on the branch)

```sh
bash plans/sequence-divergence-drive-3/measurements/gates.sh <tag>
# = npm test -- --maxWorkers=4 (JSON reporter) · typecheck · lint · build
```
Collected (JSON reporter) must equal on-disk. Check `uptime` first; above
~10 wait (another session may be loading the box). New src module ⇒
`npm run catalog`.

- `$T` = `plans/sequence-divergence-drive-3/tools/` (T0a copies sdd2's),
  `$M` = `plans/sequence-divergence-drive-3/measurements/`.
- Classify: `npx tsx $T/classify.mts <out.json>`; one fixture:
  `npx tsx $T/diff-one.mts <slug> [filter]`; hashes: `$T/svg-hashes.mts`.
  All three render with `sequenceFixtureOptions()` (asset store wired).
- Survey: `npm run svg:survey -- sequence --out <path>` (never positional).
- All engines: `bash $M/chain.sh <bN-eng>`; diff with `$T/verdict-diff.mjs`.
- Oracle renders: `scripts/oracle-render.sh <out-dir> <puml>` only.
- Batch close: [close-procedure.md](close-procedure.md).

## Stop conditions (halt, journal, report)

1. A task needs a file another task in the same batch owns.
2. The same gate fails on 2 consecutive fix attempts, or one code location
   changes 3 times without resolving the same check. The halt carries the
   diagnosis artifact (mechanism, origin `file:line`, causal chain, ruled out).
3. A finding contradicts a decision: amend `decisions.md`, then halt.
4. A conformant fixture in **any** engine leaves conformant without a
   stated mechanism (all-engine survey at every close and after every core
   commit — D6).
5. A `weightedScore` rise on any sequence row with no mechanism.
6. A pinned golden stops being byte-equal.
7. Batch 0's splits, or any B8 move task (T8b–T8e), change the render hash
   of any of the 1143 sequence rows or any other engine's row.
8. Any edit to dot-engine or the plantuml fork; any change to the oracle
   jar or cached oracle bytes; any push.
9. Proposing an entry in `oracle/accepted-divergences.json` (the user signs).
10. A public API change beyond the approved additions (`RenderOptions.
    imageProvider`, `RenderOptions.filename`, the `ImageProvider` type, the
    `image-providers` entry point, an optional internal `Theme.lengthAdjust`
    for T2c): `render`/`renderSync` signatures, other
    exported types, deleting a `Theme` field.
11. A fitted constant: any numeric change without an upstream `file:line`
    in the same commit (T7a cites the decompiled JLaTeXMath class/method).
12. Survey and ratchet disagree on a fixture and the mechanism is not
    isolated inside the 2-fix budget.
13. More than 30 non-sequence movers at a close, unless each is explained
    row by row by its core change (expected at T2a, T3b, T4f).
14. Collected ≠ on-disk after a `--maxWorkers=4` rerun, or a survey timeout
    at load below 8.
15. Sequence survey wall-clock > 1.5× b0 on a quiet box with no named cause.
16. A diagnosis task (T3a, T5a, T5b, T8a) cannot produce the full artifact:
    halt with the partial one, never with a guessed fix.
17. The image providers or the pre-fetch put DOM, network or async code into
    the sync render path, or `src/` imports a Node built-in.
18. A new runtime dependency other than `@xmldom/xmldom` (D2).
19. Any LaTeX/math fixture in any engine gets worse at T7a.

## Push-forward (decide, journal, continue)

- Helper splits forced by the 500-line hook — journal the new file.
- Baseline re-pins explained by a measured mechanism with a Java quote (diff
  the JSON before/after; any row that ROSE gets its own line).
- Pinning any slug that is zero-diff at a close (orchestrator only).
- Spawning fix tasks from a complete diagnosis artifact, write-set journaled
  before work starts.
- Adding a fixture to a task's targets when its diffs match the mechanism;
  dropping one whose remainder belongs to another family (journal the owner).
- Re-slotting rows between batches; `final = open -> next drive` when the
  mechanism falls outside every write-set.
- Collapsing two tasks that share a file.
- Internal module names and splits for the SAX port and the UGraphic move,
  each file keeping its JSDoc `@see` to the Java origin.
- Wording of the CSP console message and the provider docs.
- A mismatch with sdd2's research numbers is data, not a stop.
- Regenerating the catalog or the parity dashboard.

## Execution rules (D1)

- Parallel tasks run in worktrees made by `$M/mkwt.sh <Tn>` (it links
  `test-results/` children, `assets/stdlib`, `oracle/dist`, `node_modules`).
- Agents: targeted tests + typecheck + eslint; **no Serena edit tools**
  (they write the MAIN checkout), no `git stash`. Orchestrator: `git diff
  HEAD` empty before every merge; four gates + full conformance set at
  `--maxWorkers=4`; golden ratchet + classify after **every** merge.
- Every task spec is a self-contained agent prompt together with
  [task-contract.md](task-contract.md).

## Batches

| Batch | Scope | Tasks | Done |
|---|---|---|---|
| [0](batch-0/overview.md) | branch, tools, b0; pure-move splits of the core SVG drivers | T0a–T0b, close | [x] |
| [1](batch-1/overview.md) | small sequence fixes | T1a–T1h, close | [x] |
| [2](batch-2/overview.md) | core text and SVG fixes | T2a–T2h, close | [ ] |
| [3](batch-3/overview.md) | scale/chrome export re-mirror; xlink title | T3a–T3c, close | [ ] |
| [4](batch-4/overview.md) | SAX sprite parser | T4a–T4f, close | [ ] |
| [5](batch-5/overview.md) | drawn-extent canvas; leftover diagnosis | T5a–T5b…, close | [ ] |
| [6](batch-6/overview.md) | ImageProvider + `%filename()` | T6a–T6g, close | [ ] |
| [7](batch-7/overview.md) | JLaTeXMath `array` sizing | T7a, close | [ ] |
| [8](batch-8/overview.md) | handwritten: sequence drawing through UGraphic | T8a–T8f, close | [ ] |
| [exit](batch-exit/overview.md) | final re-pin, survey, ledger, PR prep | T-exit | [ ] |
| [squash](batch-squash/overview.md) | one commit per batch; tag the working history | T-squash | [ ] |

## Documents

- [decisions.md](decisions.md): D1–D11, locked
- [task-contract.md](task-contract.md): shared by every task prompt
- [close-procedure.md](close-procedure.md): standard batch close
- [fixtures.md](fixtures.md): the 101-row ledger (seeded from planning)
- [decision-journal.md](decision-journal.md): one row per decision, mover, halt
- [diagrams/data-flow.md](diagrams/data-flow.md) ·
  [diagrams/component-map.md](diagrams/component-map.md)
- `measurements/planning-classify.json`, `measurements/planning-open-rows.tsv`:
  the planning measurement (main `5f954eeff`) with sdd2's family per row
- `diagnosis/`: artifacts from T3a, T5a, T5b, T8a

## Prior context (read only what a task points at)

- `plans/sequence-divergence-drive-2/` — sdd2: tools, journal, `fixtures.md`
  (each open row's mechanism as filed), research reports
- `oracle/goldens/svg-sequence/README.md` — the ratchet and the Add rule
- `planning/next-missions.md` "Open -> sdd3" — the family table
