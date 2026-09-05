# T0 — verify the window and the predicate

## Context

`plantuml-ts` is a TypeScript port of PlantUML, validated against the real
jar. `dotEqual` compares the svek DOT this port emits against the jar's own
cached `svek-1.dot`. Three fixtures report `false` today while their pins
claim `true`; the pins are three weeks stale. This task establishes that the
bisect window is the right one before anyone spends a bisect on it.

## Task

1. Resolve the window: `good` = the last commit on `main` on or before
   2026-08-12 (the pins' `generatedAt`), `bad` = current `main`.
2. Create three worktrees under `.claude/worktrees/` (D4), one per fixture,
   and `npm install` in each.
3. In one worktree, check out `good`, restore the predicate stack from HEAD
   per [D1](../decisions.md#d1), and run the predicate on all three fixtures.
4. Record the verdicts. **All three must be `dotEqual=true`.**

## Write-set

- `.agent-notes/bisect-doteq-T0.md`

## Read-set

- `../README.md#the-predicate`
- `../decisions.md#d1`, `#d3`, `#d4`
- `.agent-notes/lor-parity-pins-are-stale.md` — the drift measurement
- `scripts/svg-parity-survey.ts:29-50` — the predicate's imports (what D1 pins)

## Interface contracts

Emit into the artifact, for T1–T3 to consume verbatim:

```json
{ "goodCommit": "<sha>", "badCommit": "<sha>",
  "predicateCmd": "<exact shell line, including the D1 restore>",
  "worktrees": { "lurage-50-kobo763": "<path>", "xetase-70-zaza808": "<path>",
                 "tunelu-64-xica833": "<path>" },
  "skipRanges": [] }
```

## Acceptance criteria

- Given HEAD's pinned predicate stack, when run against `src/` at `good`,
  then it builds and emits a `dotEqual` field.
- Given `good`, when the predicate runs on all three fixtures, then each
  reports `dotEqual=true` — measured, not read from the pin (D3).
- Given any fixture reporting `false` at `good`, then **STOP** and report:
  the regression predates the window and the mission's premise is wrong.
- Given the three worktrees, when `npm test -- --run` is invoked in each,
  then each has a working `node_modules`.

## Observability

N/A — no new observable operations.

## Rollback

Reversible. Worktrees are disposable; the only artifact is a note.

## Quality bar

Gates do not apply — this task writes no source. The artifact must state the
two SHAs, the exact predicate command, and the three verdicts with the raw
JSON each came from.

## Commit

One commit: `docs(dqb-T0): pin the bisect window and verify the predicate`
