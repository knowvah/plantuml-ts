# T4 — corpus sweep and residual diagnosis

**Agent:** debugger · **Depends on:** T2, T3 (merged).

## Context

Read [`../README.md`](../README.md) (exit bar, stops 4/5/8),
[`../decisions.md`](../decisions.md) D5–D8, `../fixtures.md` as T0/T2/T3
left it, and `~/.claude/rules/diagnosis.md` (mechanism before fix).
Memory that bears here: `weightedscore-antimonotone-under-growth`,
`segment-compare-beats-align-counts` (equal per-tag counts hid an 11 px
polygon — diff element geometry against the golden, not just counts).

## Task

1. `npx tsx ../tools/render-all.mts` -> `../measurements/t4.json`; diff
   against `base.json`. Every mover must be a `fixtures.md` row or a named
   parent re-centring (stop 5). `../tools/diag-scan.mts`: 0 diagonals.
2. For every classified row still short of D6, `--align` + `--dump` +
   `family-diff.mts` against the golden: name the element, the Java line,
   and the mechanism. Fix it if the fix is inside the Batch 1 write-set and
   is the mechanism's origin (`diagnosis.md`); otherwise journal it as a
   named residual with its cite. Max 2 attempts per residual (stop 2).
3. D5's outcome: if T0 found the jar drops (or lane-draws) cross-lane
   non-translatable connections, apply it to `FtileWhile`'s
   `ConnectionBackEmpty`/`ConnectionOut` here — ONE journaled decision,
   with the golden that proves it.
4. Sibling suites: `npx vitest run svg-conformance` — test count identical
   to `8815ec5b`'s (stop 6).
5. `.agent-notes/allt-T4.md`: observations; update `fixtures.md` with the
   after-alignment column.

## Read-set

Batch 1 specs and their write-sets; `../measurements/*`; `scripts/activity-probe.ts`;
`../tools/family-diff.mts`, `tile-dump.mts`; the Java lines each residual names.

## Write-set

Batch 1's write-set (`swimlane-loop-translate-while.ts`, `-repeat.ts`,
`walk-while-branch.ts`, `walk-repeat.ts`, their tests), `../fixtures.md`,
`../measurements/t4.json`, journal rows, `.agent-notes/allt-T4.md`. Any other
file is stop 1.

## Acceptance criteria

- Given `t4.json` vs `base.json`, then every mover is named
- Given the diagonal scan, then 0; given the sibling suites, then unmoved
- Given every classified row, then D6 holds or a named residual with Java
  cite is journaled
- Given a fix, then its journal row states mechanism, origin `file:line`,
  and what was ruled out

## Observability / rollback

N/A — no new observable operations; the gates are the SLIs. Reversible
(revert the commit; no data, no migration).

## Quality bar

`npm test` (JSON-reporter collected count = on-disk count), `npm run
typecheck`, `npm run lint`, `npm run build` all green before the commit. One
commit, `<type>(allt-TN): …` per `~/.claude/rules/commits.md`, body says
why. `git diff --name-only HEAD~1` = this write-set only.

## Boundaries

Always: read the Java method body before stating why anything differs;
every constant carries its `file:line`. Ask first (halt + journal): any
stop condition in `../README.md`. Never: refactor while porting; fit a
value; delete an assertion; touch `layout.old.ts` or `compress-geometry.ts`.
