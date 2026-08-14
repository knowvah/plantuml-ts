# T2 — Cross-path wrapper-count fitness test

## Context

Four separate defects in this area were divergences between
`graph-layout-build.ts` (the layout path) and `svek-dot-emit.ts` (the DOT-text
path) — two independent consumers of one `DotInputGraph`, in BOTH directions.
Nothing currently asserts they agree.

T1 has just made the emitter mirror the builder's wrapper conditions. This test
keeps them mirrored.

## Task

Add a fitness test that, for every state fixture, computes the wrapper levels via
both paths and asserts they agree.

## Write-set

- `tests/oracle/wrapper-parity.test.ts` (new)

## Read-set

- `src/core/svek-dot-emit.ts` — T1's exported `WrapperLevels` helper
- `src/core/graph-layout-build.ts:366-430`
- `tests/oracle/state-dot-parity.test.ts` — for the fixture-iteration idiom to copy
- [decisions.md](../decisions.md) ADR-2

## Interface contracts

Consumes T1's `WrapperLevels` export. If T1 did not export it, that is a T1 gap —
fix it there, not by duplicating the logic here.

## Acceptance criteria

- Given every state fixture with an oracle `svek-1.dot`, when both paths compute
  wrapper levels, then the counts agree for every cluster.
- Given a fixture where they disagree, when the suite runs, then it fails naming
  that fixture and cluster.

## Observability requirements

N/A — this task IS the instrumentation. It closes the emitter/builder blind spot
named in the README.

## Rollback

Reversible — test-only, single commit.

## Quality bar

All four gates green. This test must PASS on the corpus after T1; if it fails,
T1 is incomplete — fix T1 rather than relaxing this assertion.

## Commit

`test(T2): assert emitter and builder agree on cluster wrapper levels`
