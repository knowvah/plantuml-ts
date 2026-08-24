# T4 — anchor the sequence arrow patterns

## Context

`plantuml-ts` is a faithful port; the Java at `~/git/plantuml` is canonical.

`src/diagrams/sequence/index.ts:19-22`:

```ts
const SEQUENCE_PATTERNS: readonly RegExp[] = [
  /->>?|-->>?/,
  /^(participant|actor|boundary|control|entity|database|collections|queue)\s/,
];
```

The first is **unanchored**: it matches `->` or `-->` anywhere in a line,
including inside a string literal. `zuvila-56-nuda425` — a CLASS diagram per
the jar — is claimed by sequence because of `$arrow("-->")`, an argument to a
`!procedure`, not an arrow.

**Check the residual first.** T2 and T3 may already have closed this; if the
`CLASS -> SEQUENCE` bucket is empty, close this task as a measured no-op.

## Task

Narrow the arrow pattern so a `-->` that is not in arrow position cannot
claim the source. Derive the shape from upstream's own arrow grammar, not
from what makes the one fixture pass.

Write the test first (TDD).

## Read-set

- `~/git/plantuml/.../sequencediagram/command/CommandArrow.java` — the real
  arrow grammar (`RegexLeaf` composition), which is what "arrow position"
  means upstream
- `src/diagrams/sequence/sequence-parse-helpers.ts:129-135` — `ARROW_STYLE_MAP`,
  this port's own arrow-token table
- `src/diagrams/sequence/index.ts:19-41` — the patterns and `accepts`
- `test-results/dot-cache/object/zuvila-56-nuda425/in.puml` — the fixture
- `../decisions.md#d2`

## Write-set

- `src/diagrams/sequence/index.ts`
- `tests/unit/sequence/accepts.test.ts` (new)

Nothing else. If a file outside this set needs changing, **STOP and report it** rather than changing it.

## Acceptance criteria

1. Given `$arrow("-->")` on a line with no arrow in arrow position, when
   sequence's `accepts` runs, then `false`
2. Given `A -> B : msg`, then `true` — and given every arrow token in
   `ARROW_STYLE_MAP`, then `true` for each (table-driven; a narrowing that
   breaks a real arrow is worse than the bug)
3. Given the routing gate, then the `CLASS -> SEQUENCE` bucket is empty and no
   other bucket grew
4. Given the pattern you write, then it is **narrower** than the current one —
   state in the commit body which inputs it newly rejects

## Quality bar

All four gates green. Do not re-pin baselines.

## Observability

N/A — no new observable operations.

## Rollback

Reversible, but not independently: revert the batch, not the task.

## Boundaries

- **Always:** justify the pattern against upstream's grammar with `file:line`
- **Never:** widen the pattern; fit it to the single fixture; touch the parser
- **Ask first:** if no narrowing satisfies AC2 without also failing AC1 —
  that means the answer is parse-attempt (D2's deferred mission), which is a
  stop condition here

## Commit

One commit: `fix(T4): reject arrows outside arrow position in sequence accepts`
