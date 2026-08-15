# T1 — Widen the gate and capture baselines

## Context

plantuml-ts is a faithful TypeScript port of PlantUML (Java at
`~/git/plantuml` is the spec). `scripts/note-order-report.ts` (mission
note-leaf-model T1/T5) renders every class/object fixture under
`test-results/dot-cache/` and reports document order + uids + a whole-SVG
sha; its `--vs-jar` mode compares our entity/link uid SEQUENCE with jar's
`in.svg` and classifies SAME / ORDER-ONLY / OTHER — but today it skips
fixtures with no notes. This mission changes classifier order too
(packaged-first), so the gate must cover all 802.

## Task

1. `--vs-jar`: remove the `NO-NOTES` skip so every fixture is classified.
   Keep the per-fixture lines and the `TOTAL vs-jar:` tally format.
2. Add `--check-order <baseline-report>`: read the saved default-mode report,
   re-render, and for every fixture compare BOTH the sha and the uid
   sequence (the `cls:`/`note:`/`link=` tokens, names stripped to uids).
   Print `MOVED <label>` for each fixture whose sha AND sequence changed;
   print `OFFENDER <label> (sha changed, order did not)` or `OFFENDER <label>
   (order changed, sha did not)` for a mismatch; final line `check-order:
   moved=<n> offenders=<m>`; exit 1 iff offenders > 0.
3. Capture on the mission's base commit into `plans/leaf-draw-order/baseline/`:
   `note-order.txt` (default mode), `order-vs-jar.txt` (`--vs-jar`),
   `shape-match.txt` (`npx tsx scripts/shape-match-report.ts`),
   `dot-sync-class.txt` (`npx tsx scripts/dot-sync-report.ts class`).
   Expected: `--vs-jar` TOTAL `same=678 order-only=47 other=77`.

## Write-set

- `scripts/note-order-report.ts`
- `plans/leaf-draw-order/baseline/{note-order,order-vs-jar,shape-match,dot-sync-class}.txt`

## Read-set

- `scripts/note-order-report.ts` (whole file, ~280 lines)
- `plans/note-leaf-model/baseline/order-vs-jar.txt` (the 97-fixture
  predecessor tally, for comparison)

## Architecture decisions

D6 (`../decisions.md#d6`) — this task builds the gate D6 names.

## Interface contracts

CLI only. Consumed by every later gate run:
`--vs-jar` TOTAL line `TOTAL vs-jar: same=N order-only=N other=N err=N`;
`--check-order` final line `check-order: moved=N offenders=M`, exit 1 iff M>0.

## Acceptance criteria

- Given the base commit, when `--vs-jar` runs, then TOTAL is
  `same=678 order-only=47 other=77 err=0`.
- Given the freshly captured `baseline/note-order.txt`, when `--check-order`
  runs against it unchanged, then `moved=0 offenders=0`, exit 0.
- Given a copy of that baseline with one fixture's `sha=` edited, when
  `--check-order` runs, then it prints `OFFENDER <that label> (sha changed,
  order did not)` and exits 1.

## Quality bar

`npm run typecheck` (scripts are outside the tsconfigs, so also run the
script itself twice and `cmp` the outputs — deterministic), `npm run lint`,
`npm test` unaffected. Do not pipe `npm test`.

## Observability requirements

N/A — no new observable operations (build-time report).

## Rollback notes

Reversible (revert the commit).

## Boundaries

- Always: keep the default-mode output format byte-identical (T3/T4 diff
  against it).
- Never: change what `--vs-jar` classifies as OTHER vs ORDER-ONLY (set
  equality of uids).
- No git commands (the orchestrator commits: `test(T1): ...`).
