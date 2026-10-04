# T1p-c — `fork … end merge` (ParallelBuilderMerge)

Agent: typescript-pro, worktree `add2-T1p-c`. Rules: [common.md](common.md).

## Task
Port `vcompact/ParallelBuilderMerge.java` (`ConnectionHorizontalThenVertical`
121-192, `ConnectionIn` 193-231) and its selection
(`FtileFactoryDelegatorCreateParallel.java:60`, `ForkStyle.MERGE`), and make
the parser accept `end merge` — quote the Java `Command*` regex that accepts
it (D6: no lenient catch-all). Corpus error rows: jevofu-58-fazo194,
mepeze-15-nuge493, xoreko-43-noto860, zokuni-21-sapu966 (each refused at the
`end merge` line today). Report each row's render vs its `in.svg` (the
orchestrator promotes rows at the close; do not edit `oracle/goldens/**` or
the routing/refusal tests).
Keep the new builder's dispatch inside `walk-fork-branches.ts` (or a new
file it calls) — `tile-coordinates.ts` belongs to T1p-e this wave; if you
cannot avoid it, stop and report.

## Write-set
`src/diagrams/activity/{parser,parallel-dispatch,ast}.ts`,
`src/diagrams/activity/layout/{tile-layout,walk-fork-branches}.ts`,
`src/diagrams/activity/tiles/{gtile-fork,tile}.ts`, renderer file(s) only if a
new shape is needed, new files, their tests, `tests/fixtures/activity/T1p-c/**`.

## Acceptance
- The 4 error rows render; connector elements match each `in.svg` (report
  per-row weightedScore).
- `end fork` output byte-identical to before (probe Σ unchanged).
