# T7 — anchor the sequence arrow pattern

## Context

`plantuml-ts` is a faithful port; the Java at `~/git/plantuml` is canonical.
**Read the Java method body before writing.**

`src/diagrams/sequence/index.ts:19-22`:

```ts
const SEQUENCE_PATTERNS: readonly RegExp[] = [
  /->>?|-->>?/,
  /^(participant|actor|boundary|control|entity|database|collections|queue)\s/,
];
```

The first is **unanchored and context-free**: it matches `->` or `-->`
anywhere in a line, including inside a string literal.
`object/zuvila-56-nuda425` — a CLASS diagram per the jar — is claimed by
sequence because of `$arrow("-->")`, an argument to a `!procedure`, not an
arrow.

**Know how far this reaches before you start.** That same pattern is why the
parent mission's registration reorder was reverted: `sequencePlugin.accepts()`
is true for **1351 of 3158** fixtures, **270 of which are not sequence
diagrams**. This task does **not** set out to fix that — the reorder is frozen
(D1) and the 270 are not misrouting today, because sequence is registered
last. What it must not do is make that number *worse*, and what it may
usefully do is make it better.

Measured: of the 262 fixtures the reorder broke, **217 (82.8%)** carry a real
arrow in real arrow position (`Sally --> Bob`, `ClassA --> ClassB : -var1`).
Anchoring reaches the other 17.2% and no further. A class relation and a
sequence message are the same string; separating *those* is
`dispatch-by-parse-attempt`, not this task. Do not attempt it here.

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
  this port's own arrow-token table, and the source of AC2's cases
- `src/diagrams/sequence/index.ts:17-43` — the patterns and `accepts`
- `test-results/dot-cache/object/zuvila-56-nuda425/in.puml` — the fixture
- `.agent-notes/T2-registration-order-halt.md` — the 1351 / 270 / 217
  measurements above, so you can check them rather than take them from here
- `../decisions.md#d1`, `../decisions.md#d3`

## Write-set

- `src/diagrams/sequence/index.ts`
- `tests/unit/sequence/accepts.test.ts` (new)

Nothing else. If a file outside this set needs changing, **STOP and report
it** rather than changing it. In particular, the `hasDescriptiveSignal` guard
in this file's `accepts` is **T4's** subject, not yours — it has already been
changed by the time this task runs.

## Acceptance criteria

1. Given `$arrow("-->")` on a line with no arrow in arrow position, when
   sequence's `accepts` runs, then `false`
2. Given `A -> B : msg`, then `true` — and given every arrow token in
   `ARROW_STYLE_MAP`, then `true` for each. Table-driven; a narrowing that
   breaks a real arrow is worse than the bug
3. Given the routing gate, then `zuvila-56-nuda425` reports
   `jarType === ourType === 'CLASS'` **once T6 has also landed** — this task
   alone drops it to the fallback, which routes it back to sequence (see the
   batch overview)
4. Given the pattern you write, then it is **narrower** than the current one.
   State in the commit body which inputs it newly rejects, and re-measure the
   `sequencePlugin.accepts()` true-count over the corpus: it must not rise
   above 1351, and the count of non-sequence fixtures it accepts must not
   rise above 270
5. Given the whole corpus, then no fixture newly misroutes

## Quality bar

All four gates green. Do not re-pin any baseline; that is batch 6.

## Observability

N/A — no new observable operations. AC4's two counts are worth recording in
the journal either way: they are the standing measure of how far
`dispatch-by-parse-attempt` still has to go.

## Rollback

Reversible, but not independently: revert the batch range, not the task.

## Boundaries

- **Always:** derive "arrow position" from `CommandArrow.java`
- **Never:** widen; special-case the one slug; touch `src/index.ts` (D1) or
  the `hasDescriptiveSignal` call (T4's)
- **Ask first:** if separating a class relation from a sequence message
  appears necessary — it is not, for this task, and it is the deferred
  mission's whole subject

## Commit

One commit: `fix(T7): anchor the sequence arrow pattern to arrow position`
