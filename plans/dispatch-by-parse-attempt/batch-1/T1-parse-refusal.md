# T1 — the refusal type, its score, and the merge rule

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical spec. This mission ([README](../README.md))
gives parsers the ability to **refuse** a source so the dispatcher can pick an
engine by attempting the parse, as upstream does.

This task builds the vocabulary. Nothing consumes it yet.

## Task

Port upstream's refusal outcome and its all-fail tie-break into one small
module.

**Read `PSystemCommandFactory.java` and `PSystemError.java` before writing
anything.** The four refusal points are:

| Refusal | Upstream | Meaning |
|---|---|---|
| no `Command` matched the line | `PSystemCommandFactory.java:169-175` | `SYNTAX_ERROR "Syntax Error?"`, score contribution 0 |
| command matched, execution failed | `:180-186` | `EXECUTION_ERROR`, carries `result.getScore()` |
| `sys.isIncomplete()` | `:159-161` | returns `null` |
| `checkFinalError() != null` | `:148-152` | execution error at the final location |

The tie-break when every candidate refuses is
`PSystemError.score() = trace.size() * 10 + singleError.score()`
(`PSystemError.java:382-384`), and `PSystemErrorUtils.mergeV2` (`:140-147`)
keeps the **maximum**. `trace.size()` is how many lines were consumed before
failure, so the parse that got furthest owns the error page.

## Write-set

- `src/core/parse-refusal.ts` (create)
- `tests/unit/core/parse-refusal.test.ts` (create)

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/PSystemCommandFactory.java:107-200`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/error/PSystemError.java:375-387`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/error/PSystemErrorUtils.java:112-147`
- `src/core/error/error-diagrams.ts` — how this port already models an error
  diagram, so the refusal composes with it rather than duplicating it

## Interface contracts

Consumed by T3 (dispatcher wiring) and T4–T12 (the engines):

```ts
interface ParseRefusal {
  readonly refused: true;      // discriminant — AST types never carry it
  readonly kind: 'syntax' | 'execution' | 'incomplete' | 'final';
  readonly line: number;       // 0-based index of the offending line
  readonly consumed: number;   // lines successfully consumed before failure
  readonly message: string;
  readonly commandScore: number;
}
function refuse(...): ParseRefusal;
function refusalScore(r: ParseRefusal): number;   // consumed * 10 + commandScore
function mergeRefusals(rs: readonly ParseRefusal[]): ParseRefusal;  // max score
```

`refused: true` is the discriminant because it can never collide with an
engine's AST shape. Do not discriminate on absence of a field.

## Architecture decisions in force

- [D1](../decisions.md#d1) — refusal is **returned**, never thrown. Upstream
  reserves `throw` for the crash path (`PSystemBuilder.java:273-279`), which is
  a different outcome
- [D2](../decisions.md#d2) — the score is ported verbatim with its citation; it
  is upstream arithmetic, not a fitted constant

## Acceptance criteria

1. *Given* two refusals with different `consumed`, *when* merged, *then* the
   one with more consumed lines wins
2. *Given* two refusals with equal `consumed` and different `commandScore`,
   *when* merged, *then* the higher `commandScore` wins
3. *Given* a syntax refusal, *when* scored, *then* `commandScore` is 0, per
   `PSystemCommandFactory.java:171`
4. *Given* an empty refusal array, *when* merged, *then* it throws — mirroring
   `PSystemErrorUtils.merge`'s `IllegalStateException` at `:113-114`
5. *Given* a `ParseRefusal`, *when* type-narrowed against any engine AST,
   *then* `refused` discriminates without a cast

## Observability

N/A — no new observable operations. The module feeds SLI 2 indirectly via the
engines.

## Rollback

Reversible — new files only.

## Quality bar

All four gates green. Every constant and every arithmetic rule carries its
upstream `file:line` in a comment. A JSDoc `@see` to the Java origin on each
exported symbol, per repo convention.

## Boundaries

- **Always:** cite `file:line` for every ported rule
- **Never:** invent a score component upstream does not have; run Prettier

## Commit

`feat(T1): port PSystemError refusal outcome and merge rule`
