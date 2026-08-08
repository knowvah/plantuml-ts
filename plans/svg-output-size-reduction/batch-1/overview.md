# Batch 1 — Foundation

Both tasks are **additive**: they create new modules without wiring them
into either emitter, so existing output is unchanged and the gates stay
green. This is the last normally-gated batch until the end of batch-2d.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | Shared SVG format rules module | typescript-pro | `src/core/svg-format.ts` + test | — | [x] |
| T2 | Golden regeneration script | tooling-engineer | `scripts/rebaseline-svg-goldens.ts` + test | — | [x] |

T1 and T2 are fully parallel — no shared files, no shared concepts.

## Gate

Normal: `npm run typecheck`, `npm run lint`, `npm run build`, cold-tree
`npm test`. All four must pass before batch-2a starts. Because both tasks
are additive, a failure here is a genuine defect in the new code, not
mission churn.

## Why this batch exists separately

T1 is the interface every emitter task consumes (ADR-3), so it must land
and be verified before the port begins — a bug in `shortenColor` or the
rounding would otherwise surface as hundreds of golden mismatches in
batch-2d and be attributed to the wrong task.

T2 is independent of `src/` entirely (it captures **jar** output), but it
gates T9, and having it verified early means the golden regeneration is a
known-good operation by the time the port needs it.
