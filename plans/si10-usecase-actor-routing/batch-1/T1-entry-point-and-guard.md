# T1 — Export the faithful entry point; remove the inert `<$sprite>` guard

## Context

See [ADR-2](../decisions.md#adr-2-the-description-engine-owns-usymbol-sizing-the-class-engine-calls-in)
and [ADR-3](../decisions.md#adr-3-the-tautological-routing-test-is-rewritten-never-deleted).

`leaf-sizing.ts` routes most USymbols through the faithful path
(`measureEntityLeaf` → `EntityImageDescription.calculateDimensionSlow`), but
`usecase`/`usecase-business` divert to the analytic `measureUsecase` whenever
`hasUnroutedUsecaseMarkup(display)` is true. That predicate fires on
`<latex>` OR a multi-line `<$sprite>` display.

**The sprite half is now inert, and this was measured, not assumed** — see
the probe table in [`../README.md`](../README.md). Disabling it leaves
`widened 0`, an identical cause histogram, and both `bootstrap-0` and
`ruziru-69-xixo434` at `delta 0, conformant true`. The 0.029321in widening
its doc comment cites was closed by `svg-sprite-nanoparser`'s two-channel
architecture. **The `<latex>` half is NOT inert** — disabling both gives
`widened 2`.

## Task

1. **Export a purpose-built usecase/actor entry point** from `leaf-sizing.ts`
   for the class engine to call (ADR-2). It takes a display string, which of
   the two symbols, a `FontSpec`, a `StringMeasurer`, and an optional
   `SpriteDimsLookup`; it returns the plain `Dim`. It must route through the
   SAME faithful path `measureLeafNode` uses — reuse `measureEntityLeaf`
   internally, do not duplicate its body. Do NOT export `measureEntityLeaf`
   itself, and do not surface `applyMinWidthFloor` or `DescriptiveNode`.
2. **Remove ONLY the multi-line `<$sprite>` branch** from
   `hasUnroutedUsecaseMarkup`, so it becomes the `<latex>` test alone.
   Rewrite its doc comment: it currently explains a mechanism that no longer
   reproduces, and leaving that text in place would mislead the next reader
   as badly as the wrong code would. Cite the new measurement.
3. **Rewrite the tautological test** (ADR-3) in
   `leaf-sizing-widen-routing.test.ts` — the case named "a multi-line display
   mixing a sprite line with a text line stays on measureUsecase". Its
   `expect(routed).toEqual(viaOldPath)` is true BY CONSTRUCTION while the
   guard exists. Replace it with literal expected dimensions captured from a
   real run, so it can fail. Update the file's header comment too — it
   describes the old routing. The `<latex>` case in the same file stays
   exactly as it is.

## Write-set — write NOTHING outside these

- `src/diagrams/description/leaf-sizing.ts` (modify)
- `tests/unit/description/leaf-sizing-widen-routing.test.ts` (modify)

`class-layout-leaf-shapes.ts` and `class-layout-helpers.ts` are T2's.
`usecase-footprint.ts`, `leaf-sizing-text.ts` and `measureUsecase` itself are
READ-ONLY here and survive the mission (ADR-1).

## Read-set

- `src/diagrams/description/leaf-sizing.ts` — the header comment, the
  `usecase` case in `measureLeafNode` (~line 130-140),
  `hasUnroutedUsecaseMarkup` (~line 180), `measureEntityLeaf` (~line 477) and
  `EntityLeafCtx` (~line 376)
- `tests/unit/description/leaf-sizing-widen-routing.test.ts` — all of it
- [`../decisions.md`](../decisions.md) ADR-2, ADR-3
- [`../README.md`](../README.md) — the probe table

Line numbers may have drifted; follow the code and report corrections.

## Acceptance criteria

1. Given a `usecase` node with a multi-line `<$sprite>` display, when
   `measureLeafNode` runs, then it routes through the faithful path and NOT
   through `measureUsecase`.
2. Given a `usecase` node with a `<latex>` display, when `measureLeafNode`
   runs, then it STILL routes to `measureUsecase` — unchanged.
3. Given the exported entry point with a `sprites` lookup, when called for
   `usecase` and for `actor`, then it returns the same `Dim` the description
   engine's own faithful path produces for an equivalent node.
4. Given `npx jiti scripts/measure-description-size-deltas.ts`, then
   **`widened` is 0** and conformant is 320/351 — unchanged from baseline.
5. Given the rewritten routing test, then it asserts literal dimensions and
   FAILS if the returned geometry changes. Verify that by temporarily
   perturbing the value and watching it go red.

Assert specific values, never truthiness.

## Interface contract (consumed by T2)

Record the FINAL exported signature in the decision journal — T2 codes
against what shipped, not against the sketch in
[`overview.md`](overview.md).

## Quality bar

`npm run typecheck`, `npm run lint`, `npx vitest run
tests/unit/description/`, and `npx jiti
scripts/measure-description-size-deltas.ts` clean. Run `npm test` once at the
end — this task changes description-engine routing and the goldens are the
check that matters.

Use `jiti`, never `npx tsx`. Capture a failing command's stderr before
theorising about its cause.

## Observability

N/A — pure synchronous geometry, no observable operations. The
size-delta script IS the regression signal for this task.

## Rollback

**Reversible** — revert the commit. `measureUsecase` remains present, so
reverting restores the old routing exactly.

## Boundaries

**Always:** keep `<latex>` routing to `measureUsecase`; keep `widened` at 0.

**Ask first (STOP and report):** any change outside the two-path write-set;
anything contradicting an ADR.

**Never:** touch the `<latex>` branch or `DIVERGENCES.md`; delete
`measureUsecase`/`measureActor`/`usecase-footprint.ts`/`footprintBoxes` (they
survive — ADR-1); weaken, skip or delete a test; re-pin `size-backlog.json`
or `diff-baseline.json`; edit a `golden.svg`; run ANY git mutation — the
orchestrator commits.

## Method rules

1. **Trace TWO levels.** `hasUnroutedUsecaseMarkup` feeds one branch of
   `measureLeafNode`, which feeds every description-engine leaf — and the
   `<latex>` case shares the predicate. Removing half a predicate changes
   both callers of it.
2. **Verify against a real run**, not the code's intent.

## Commit

`refactor(T1): route multi-line sprite usecases through the faithful path`
