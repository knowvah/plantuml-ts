# class-divergence-drive-7 (cdd7)

**Read first, every start and after every compaction:**
`~/.claude/docs/reference/autonomous-execution.md`, then this file, then
`decisions.md`, then the current batch's `overview.md`. Tail
`decision-journal.md` for where you stopped.

## Objective

Close the 14 CLASS rows cdd6 left `open -> cdd7`. Every mechanism is already
journaled with a Java cite (cdd6 journal rows 13, 47, 50, 63, 67, 71, 73), so
there is no verification batch: batch 0 is branch + ledger + signed acceptances +
baseline; batch 1 fixes seven families in parallel; batch 2 ports the port leaf.
Two fixes are cross-engine (description note opale, sequence sprite atoms) and are
measured across every engine (D7). Eight acceptances are pre-signed (D8). lubicu
(`{{salt}}`) is handed to a `salt-engine-port` mission (D9).

Starting state (main `bfa8d8e09`, clean, pushed):
- class bucket 708/3/12; unknown 321/65/439; CLASS conformant (both trees,
  CLASS-routed) 974; ratchet 973; routing 5090/909/105 = 6104.
- cdd6 ledger (`plans/class-divergence-drive-6/fixtures.md`): 14 `open -> cdd7`,
  6 `accept-candidate`.

Batch 0's b0 (`measurements/b0.json`, `b0-eng/`) is the reference for every "loss".

## Branch

`feat/class-divergence-drive-7` off main. Merge commit at close (never squash;
the journal cites per-task commits). **Never push** anything: not main, not the
plantuml fork, not dot-engine. `plans/` is tracked in this repo — commit the brief.

## Quality gates (all four before any commit lands on the branch)

```sh
npm test -- --maxWorkers=6 --reporter=default --reporter=json --outputFile.json=<path>
npm run typecheck
npm run lint
npm run build
```
Collected (JSON reporter) must equal `find tests -name '*.test.ts' | wc -l`.
Check load first (`uptime`); above ~10 wait. New src module ⇒ `npm run catalog`.

Measurement:
- Survey: `npm run svg:survey -- <engine> --out <path>` (never the positional form).
- Census: `npx jiti scripts/svg-conformance-census.ts class --json <path>`.
- `$T` = `plans/class-divergence-drive/tools/`: `render-all.mts <out> --tree all`,
  `render-diff.mts <tree/slug...>`, `pin-diff.mts`, `pin-goldens.mts --tree`.
- Oracle renders: `scripts/oracle-render.sh <out-dir> <puml>` only.
- Batch close: [close-procedure.md](close-procedure.md).

## Stop conditions (halt, journal, report)

1. A task needs a file another task in the same batch owns.
2. The same gate fails on 2 consecutive fix attempts, or one code location changes
   3 times without resolving the same check.
3. A finding contradicts D1–D11: amend `decisions.md`, then halt.
4. A conformant fixture in any engine leaves conformant, or `dotEqual` flips
   true→false, without a stated mechanism.
5. A diff-count rise with no mechanism (a structural fall with a numeric rise is a
   reveal, not a stop).
6. Class DOT parity goes red.
7. Collected ≠ on-disk after a `--maxWorkers=6` rerun, or a survey timeout at load
   below 8.
8. More than 30 non-class movers at a close (D7).
9. Any edit under `~/git/knowvah/dot-engine` or the plantuml fork, or any push.
10. Any change to the oracle jar or cached oracle bytes, except a journaled
    plain-minute re-render of an error page.
11. Signing any acceptance not enumerated in D8 (the eight are pre-signed).
12. A public API change (`renderSync`/`render`/`renderAll` signatures or exported
    option types).
13. A cdd6-journaled mechanism proves wrong on contact and the corrected one is not
    isolated within the task's 2-fix budget (D1).
14. T1g would pin rojida with a `dotEqualExempt` whose DOT delta is anything other
    than the embedded-label size (D6).

## Push-forward (decide, journal, continue)

- A pure type or file-cap move that extends a write-set (T2a's `class-geo-builders.ts`
  helper split; T1a's `acc.arrow` consumer touches — journal the consumer list).
- Unit-pin updates explained by a measured mechanism and a Java quote.
- Pinning goldens that are survey-conformant, census 0-diff and `dotEqual` true (or
  `dotEqualExempt` per D6).
- Re-pinning description/sequence baseline rows T1e/T1f moved, each with a mechanism.
- Re-pinning a routing/refusal row the gate flags `[FIXED]`/`[CHANGED]`, from a
  fresh measurement.
- Re-slotting a row between batches when a close names a better owner.
- `final = open -> cdd8` when the mechanism is found but not fixable in the write-set.
- Collapsing two tasks that turn out to share a file.
- kexaba → `open -> dot-engine` + TRACKER line + `docs/graphviz-issues/` file when
  real `dot` disagrees with dot-engine's `lp` (D5).
- Regenerating the catalog or dashboard.

## Execution rules (D11)

- Parallel tasks run in `git worktree`s made by
  `plans/class-divergence-drive-5/measurements/mkwt.sh <Tn>` (links the gitignored
  dependencies and the `test-results` children).
- Agents run targeted tests + typecheck + eslint only; the orchestrator merges and
  runs the four gates.
- Agents: no Serena edit tools (they write the MAIN checkout), no `git stash`.
  Orchestrator: `git diff HEAD` on main is empty before every merge.

## Batches

| Batch | Scope | Tasks | Parallel | Done |
|---|---|---|---|---|
| [0](batch-0/overview.md) | branch + ledger + signed acceptances + salt hand-off; b0 on all engines | T0a, T0b | — | [x] |
| [1](batch-1/overview.md) | edge paint, edge labels, usymbol leaf, stereo-key order, description note opale, sequence sprite atoms, rojida pin exemption | T1a–T1g | all ∥ | [x] (T1e′, T1g′ landed in batch 2) |
| [2](batch-2/overview.md) | port leaf draw (bonaco); stereotype sprite + leaf style + edge-label wrap (dezobu, xuloxo) | T2a, T2b | both ∥ | [x] |
| [3](batch-3/overview.md) | exit + close-out + merge | T-exit, T-close-out | — | [ ] |

## Documents

- [decisions.md](decisions.md): D1–D11, locked
- [close-procedure.md](close-procedure.md): standard batch close
- `fixtures.md`: row ledger (created by T0a, settled by closes)
- [diagrams/data-flow.md](diagrams/data-flow.md) ·
  [diagrams/component-map.md](diagrams/component-map.md)
- [decision-journal.md](decision-journal.md): one row per decision, mover, halt
- `measurements/`: survey/census/render-all JSON per checkpoint

## Prior context (read only what a task points at)

- `planning/next-missions.md`, section `class-divergence-drive-6`
- `plans/class-divergence-drive-6/fixtures.md` (mechanisms per row),
  `decision-journal.md` rows 13, 47, 50, 63, 67, 71, 73
- `.agent-notes/t2b-vitest-rendersync-divergence.md` (embed rows: check the ratchet
  against the survey before pinning)
- Memories: class-divergence-drive-6-status, oracle-seam-embedded-42x42,
  batch-parallelism-needs-worktrees, verify-agent-claims-si31,
  dot-engine-blame-needs-real-dot, comparesvg-count-not-monotonic,
  conformant-is-not-divergence-gone, coverage-tmp-silent-undercollect,
  subagent-handback-single-shot, repin-script-raises-preexisting-red-pin

## Status

T-exit 2026-09-30 (final tree = b2 close 43440f37b; `measurements/final.json`,
`final-eng/`, diffed against `b0.json` / `b0-eng/`).

| clause | result | met |
|---|---|---|
| Every in-scope row has a `final` ∈ {fixed, accepted (D8), open -> cdd8, open -> salt-engine-port, open -> dot-engine} | 19 rows, 0 empty: **10 fixed** (bisefo, sejube, kexaba, fepiko, josebu, bonaco, tefeco, xuloxo, rojida + dezobu's class half), **8 accepted (D8)**, **1 `open -> salt-engine-port`** (lubicu), **1 `open -> cdd8`** (dezobu: nested description embed, `CommandArchimate.java:146-152` icon → sprite rewrite) | yes |
| 0 conformant losses in any engine; 0 unexplained rises | b0 → final: 0 verdict/`dotEqual` movers in 27 engines; unknown: 9 rises to conformant + dezobu diverged → structural-match + rojida `dotEqual` false → true, each with a journal row; 0 losses. Non-class diff-baseline re-pins: sequence vofupo (fall, T1f), component xufexu (rise 12 → 27, mechanism row 28) | yes |
| Four gates green, collected = on-disk, class DOT parity green | b2 close: test 1001/1001 collected, 24624 tests, 0 failed; typecheck, lint, build exit 0; `class-dot-parity` green (xuloxo `dotEqual` now true too) | yes |
| Target **984 CLASS conformant**, ratchet 984 | **982 / 982** (974 + 8 of 9 fix rows; rojida was already conformant at b0, so the brief's 984 double-counted it — journal row 7 derived 983 / 984). Short: dezobu (`open -> cdd8`, description engine, mechanised) | miss by 2 (journaled) |
