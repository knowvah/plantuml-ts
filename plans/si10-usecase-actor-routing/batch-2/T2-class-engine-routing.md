# T2 — Route the class engine onto the faithful path, with sprites

## Context

See [ADR-2](../decisions.md#adr-2-the-description-engine-owns-usymbol-sizing-the-class-engine-calls-in).

`class-layout-leaf-shapes.ts#measureUsecaseOrActor` calls `measureUsecase` /
`measureActor` — the analytic substitute — UNCONDITIONALLY, with no guard,
while the description engine routes the same two USymbols through the
faithful `EntityImageDescription` path. Upstream sizes them one way
regardless of host diagram type, so this is a structural divergence, and
`CLAUDE.md` holds that the divergence itself is the bug.

**The path is live.** Instrumented reachability (see
[`../README.md`](../README.md)): `actor` in any class diagram reaches it, and
`allowmixing` reaches it for both `usecase` and `actor`. A `usecase` in a
class diagram WITHOUT `allowmixing` does not — that input routes to the
description engine instead. Your tests must use `allowmixing` or a bare
`actor`.

## Task

1. `measureUsecaseOrActor` calls **T1's exported entry point** instead of
   `measureUsecase`/`measureActor`. **Read the decision journal for the final
   signature T1 shipped** — do not code against the sketch in
   [`../batch-1/overview.md`](../batch-1/overview.md). Drop the now-unused
   imports.
2. It keeps building its own `MeasuredClassifier` — the `rows: [{ text, y:
   dim.height / 2, indent: 0, italic: false }]` and `dividerYs: []`
   composition is class-specific and stays exactly as it is. Only the `dim`
   source moves.
3. **Thread `sprites`** from `class-layout-helpers.ts:286` into
   `measureUsecaseOrActor` and on into the entry point. `sprites` is already
   in scope there (the `measureObjectClassifier` call one line above uses
   it).
4. CREATE `tests/unit/class/class-usecase-actor-routing.test.ts` pinning the
   new routing.

## Write-set — write NOTHING outside these

- `src/diagrams/class/class-layout-leaf-shapes.ts` (modify)
- `src/diagrams/class/class-layout-helpers.ts` (modify — the call at ~:286
  and `measureUsecaseOrActor`'s signature only; nothing else in this 300+
  line file)
- `tests/unit/class/class-usecase-actor-routing.test.ts` (create)

`leaf-sizing.ts` is T1's and is DONE — read it, do not edit it. The authored
fixtures are T3's.

## Read-set

- `src/diagrams/class/class-layout-leaf-shapes.ts` — all of it (~35 lines)
- `src/diagrams/class/class-layout-helpers.ts:275-292` — the dispatch, and
  the `sprites` already in scope
- `src/diagrams/description/leaf-sizing.ts` — T1's exported entry point ONLY
- `plans/si10-usecase-actor-routing/decision-journal.md` — T1's final signature
- `MeasuredClassifier` in `class-layout-helpers.ts`

Line numbers may have drifted; follow the code and report corrections.

## Acceptance criteria

1. Given a class diagram with `allowmixing` and a `usecase`, when the layout
   runs, then the leaf's dimensions come from the faithful path — assert the
   literal width/height, and assert they equal what the description engine
   produces for the same display.
2. Given a class diagram with a bare `actor`, when the layout runs, then the
   same holds for the actor stickman+label composition.
3. Given a classifier whose display carries a `<$sprite>` and a registered
   sprite lookup, when measured, then the resulting dimension DIFFERS from
   the same measurement with no sprite lookup — proving `sprites` is actually
   threaded and not silently dropped. (A test that would pass with the
   threading removed is worthless here.)
4. Given the returned `MeasuredClassifier`, then `rows` still carries one row
   at `y = height / 2` and `dividerYs` is still `[]` — the composition is
   unchanged.
5. Given all 312 class goldens, then they are byte-identical. None contains a
   usecase, actor or sprite, so any movement here means the change reached
   further than intended — report it rather than re-pinning.

Assert specific values, never truthiness.

## Quality bar

`npm run typecheck`, `npm run lint`, `npx vitest run tests/unit/class/`, the
class golden ratchet, and `npx jiti
scripts/measure-description-size-deltas.ts` clean. Run `npm test` once at the
end.

Use `jiti`, never `npx tsx`. Capture a failing command's stderr before
theorising about its cause.

## Observability

N/A — pure synchronous geometry. The class golden ratchet plus T3's authored
fixtures are the regression signal.

## Rollback

**Reversible** — revert the commit. `measureUsecase`/`measureActor` remain
present (ADR-1), so reverting restores the old call exactly.

## Boundaries

**Always:** keep the `rows`/`dividerYs` composition; keep all 312 class
goldens byte-identical.

**Ask first (STOP and report):** any change outside the three-path write-set;
a class golden that moves; anything contradicting an ADR.

**Never:** edit `leaf-sizing.ts` (T1's, and done); delete
`measureUsecase`/`measureActor` (ADR-1); edit a `golden.svg`; re-pin
`size-backlog.json` or `diff-baseline.json`; weaken, skip or delete a test;
run ANY git mutation — the orchestrator commits.

## Method rules

1. **Trace TWO levels.** `measureUsecaseOrActor`'s sole caller is
   `class-layout-helpers.ts:286`, but that function's own callers determine
   whether `sprites` is populated in practice — check before assuming the
   threading is observable.
2. **Verify "it will just work" against the CURRENT call graph.** T1's
   signature is fact in the journal, not a prediction.

## Commit

`refactor(T2): size class-engine usecase/actor via the description engine`
