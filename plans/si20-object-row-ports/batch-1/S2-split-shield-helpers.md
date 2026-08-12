# S2 — relocate the shield helpers out of `class-layout-helpers.ts`

## Context

Headroom task, same shape as [S1](../batch-0/S1-split-object-sizing.md).
`class-layout-helpers.ts` is at **490** lines against a hook-enforced 500-line
cap that **blocks the write**, and T2 must change `memberPortIsP` in it.

**This is a pure relocation.** No logic change, no signature change, no
cleanup. See S1's task file for the full rationale; it applies verbatim.

## Task

Move the port/shield concern into a new
`src/diagrams/class/class-shield-helpers.ts`:

- `memberPortIsP` (~:131, private)
- `shieldedClassifierIds` (~:140, exported)
- `packageEndpointAnchors` (~:94, exported)

Verify the grouping before moving — `packageEndpointAnchors` is included
because it is the third member of this file's "graph-shape helpers" cluster
and moving it buys more headroom, but if it turns out to be entangled with
the measure path, leave it and say so.

**Do not move `MeasuredClassifier`.** It is imported very widely; relocating
it would churn dozens of files for no headroom this mission needs. Same for
`formatMemberText` and `LIKE_CLASS_KINDS` — `LIKE_CLASS_KINDS` in particular
is consumed by `memberPortIsP`, so the new module will import it back from
`class-layout-helpers.ts`. Check that this does not create an import cycle;
if it does, report the cycle rather than inventing a third module.

## Write-set

- `src/diagrams/class/class-layout-helpers.ts`
- `src/diagrams/class/class-shield-helpers.ts` (new)
- `src/diagrams/class/class-port-rows.ts` — **import line only**
- `src/diagrams/class/class-dot-graph.ts` — **import line only** (this file
  has 1 line of headroom; an import repoint is line-neutral, but if your
  change would grow it at all, STOP)
- any other file whose *import* must be repointed

## Read-set

- `src/diagrams/class/class-layout-helpers.ts` — the whole file.
- `src/diagrams/class/class-port-rows.ts` and `class-dot-graph.ts` — their
  import blocks and the call sites of the three moved symbols.

## Architecture decisions in force

[ADR-7](../decisions.md#adr-7--split-only-what-must-grow-along-seams-that-already-exist).

## Interface contract

None new. Every symbol keeps its exact current name, signature and export
status.

## Acceptance criteria

- Given the move, when all four gates run, then all four are green.
- Given the move, when every DOT gate and every census is run, then **every
  count is byte-identical** to before. Any movement means the seam is wrong:
  **STOP and report.**
- Given the result, then `class-layout-helpers.ts` is under 500 lines with at
  least ~30 lines of headroom, and `class-dot-graph.ts` has **not grown**.
- Given `git diff`, then no moved function's body differs by one character.

## Measurement obligation

`shieldedClassifierIds` feeds every classifier kind, so this is cross-type
even though it is only a move. Run all five DOT gates and all three censuses:

```sh
npx tsx scripts/dot-sync-report.ts class      # 710/711, portOk 0
npx tsx scripts/dot-sync-report.ts object     # 77/80
npx tsx scripts/dot-sync-report.ts component  # 262/262
npx tsx scripts/dot-sync-report.ts usecase    # 93/93
npx tsx scripts/dot-sync-report.ts state      # 267/267
npx tsx scripts/svg-conformance-census.ts class            # 343/722
npx tsx scripts/svg-conformance-census.ts object           # 35/80
npx tsx scripts/svg-conformance-census.ts component usecase # 26/358
```

Read each census from its `DeterministicMeasurer` section, never with `tail`.

## Observability requirements

N/A — no new observable operations.

## Rollback

**Reversible.** A single relocation commit, revertible on its own.

## Quality bar

Four gates, run yourself, **never piped**.

## Boundaries

- **Always:** keep it a pure move; verify counts are unchanged.
- **Ask first (STOP and report):** any file outside the write-set; an import
  cycle; any change that is not a relocation or an import repoint.
- **Never:** move `MeasuredClassifier`; rename a symbol; change a signature;
  grow `class-dot-graph.ts`; run any state-mutating git command.

## Commit format

```
refactor(S2): relocate shield helpers to class-shield-helpers
```
