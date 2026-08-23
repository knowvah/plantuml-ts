# T6 — weight the comparator's short-circuits so the ratchet is monotonic

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is canonical. This task is the exception that proves it:
it changes **test infrastructure**, not ported behaviour, so there is no Java
to read and no upstream `file:line` to cite. The rationale lives in
[`../decisions.md#d5`](../decisions.md) — read it before writing anything.

Batch 2 halted because `compareSvg`'s diff count is **not monotonic in
wrongness**. It short-circuits in three places and charges 1 for each, so a
change that makes the document *more* structurally aligned can *raise* the
score. T3's chrome fix did exactly that on 255 fixtures. Until the measure is
monotonic, no baseline may be re-pinned — a stale pin is recoverable, a pin
taken against a metric that rewards misalignment is not.

## Task

1. Add an optional `weight` field to `Diff` in
   `tests/oracle/svg-conformance/compare.ts`, **defaulting to 1**.
2. Compute `units()` and charge **all three** short-circuits by it, per D5's
   formula — the node-type branch (`compare.ts:144-152`) as well as the tag
   and childCount ones. The node-type branch was added to this task on
   2026-08-23 after it was found mid-execution.
3. Export a `weightedScore(diffs)` helper — `diffs.reduce((s, d) => s + (d.weight ?? 1), 0)`.
4. Switch `sequence.diff-baseline.ratchet.test.ts` to gate on `weightedScore`,
   and **rewrite its failure message** (`:196-214`) — the current text tells
   the reader a mass rise on the 12-cohort is progress, which D5 disproves.
5. Extend `tests/oracle/svg-conformance/compare.test.ts` with the monotonicity
   property and the weight arithmetic.

Write the tests first (TDD, `~/.claude/rules/testing.md`).

Do **not** re-pin `diff-baseline.json` here — that is T4's, and it must be
measured against the finished weighting, not a half-built one. The ratchet
will be red at the end of this task, on `weightedScore` rather than
`diffCount`. That is expected.

## Read-set

- `tests/oracle/svg-conformance/compare.ts:35-41` — the `Diff` type
- `.../compare.ts:144-152` — the node-type short-circuit
- `.../compare.ts:169-195` — the tag-mismatch short-circuit
- `.../compare.ts:340-356` — the childCount short-circuit
- `.../normalize.ts:112-118` — `NormalizedNode`, the shape `units()` walks
- `.../sequence.diff-baseline.ratchet.test.ts:170-235` — `measure`, `checkNoRise`
- `../decisions.md#d5`

## Interface contract

```ts
export interface Diff {
  path: string;
  actual: string;
  expected: string;
  delta?: number;
  tolerance: number;
  weight?: number;   // NEW. Absent means 1. Only the two short-circuits set it.
}

export function weightedScore(diffs: readonly Diff[]): number;
```

`units()` stays module-private — it is an implementation detail of the
weighting, and exporting it invites a second caller computing a subtly
different number.

## The constraint that matters most — do not break the other engines

`compareSvg` is consumed by the class, state, description, dot, object, skin
and json-family ratchets, and by five `scripts/`. **Every one of them reads
`diffs.length`.** The change must be purely additive: `diffs.length`, every
`path`, every `actual`/`expected`/`delta`/`tolerance` value, and the ORDER of
the returned array must all be byte-identical to before. Only the new field
appears.

## Acceptance criteria

0. Given a text node aligned against an element, then exactly one diff is
   pushed (unchanged) and its `weight` is `units(actual) + units(expected)`,
   the text side contributing 1
1. Given two elements with different tags, when compared, then exactly one
   diff is pushed (unchanged) and its `weight` is
   `units(actual) + units(expected)`
2. Given two elements with equal tags and unequal child counts, then one
   `[childCount]` diff whose `weight` is the summed `units()` of both child
   lists
3. Given any other difference (attribute, text, numeric), then `weight` is
   absent or 1, and `weightedScore` counts it once
4. **Monotonicity** — given a pair of documents where a subtree's tags
   differ, and a second pair identical except that those tags now match, then
   `weightedScore(second) <= weightedScore(first)`. Assert it on a
   constructed pair AND on the real regression: `zuluja-50-zore143`'s
   weighted score must not exceed its pre-T3 weighted score
5. **No other engine moves** — `npm test` green for the class, state,
   description, dot, object, skin and json-family ratchets with **no**
   baseline edited. This is the one that matters; prove it by running them,
   not by reasoning that the field is additive

## Quality bar

All four gates except the sequence ratchet, which stays red until T4:
`npm run typecheck` · `npm run lint` · `npm run build` green, and `npm test`
failing **only** in `sequence.diff-baseline.ratchet.test.ts` and
`sequence-diff-census.test.ts`. Any other red is a stop.

`units()` recurses over an 8.26 MB golden on `zudize-61-vomi445` — check its
per-call cost against `LARGE_GOLDEN_BUDGET_MS` and report the measurement.
If it moved materially, re-derive the budget from a new measurement at the
same 22-worker condition; never raise it until the test goes green.

## Observability

N/A — this task *is* the measurement surface.

## Rollback

Reversible and independent: additive field plus one gate switch. Reverting it
alone leaves `diffCount` gating again, which is where the mission started.

## Boundaries

- **Always:** keep `diffs.length` and the diff array's order untouched
- **Never:** re-pin `diff-baseline.json`, `diff-census.json` or
  `render-manifest-baseline.json`; edit any other engine's baseline; add a
  sequence-specific comparator or normalizer (that is the original brief's
  stop 4); export `units()`
- **Ask first:** if monotonicity cannot be achieved without changing
  `diffs.length`

## Commit

One commit: `test(T6): weight compareSvg short-circuits by skipped subtree`
