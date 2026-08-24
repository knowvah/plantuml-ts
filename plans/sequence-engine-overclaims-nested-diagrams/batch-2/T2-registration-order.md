# T2 — restore upstream's plugin registration order

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. **Read the Java method body
before writing** — not a filename, not this file's summary.

Upstream registers `SequenceDiagramFactory` **third overall and first among
real diagram types**. This port registers `sequencePlugin` **last**, after
thirteen others. Sequence therefore gets last refusal here and first refusal
upstream, so class, description, json and yaml claim sequence diagrams before
sequence ever sees them.

That inversion accounts for the **entire 70-fixture underclaim bucket**. It is
the structural divergence `CLAUDE.md` names as *the* bug: re-mirror it rather
than patch around it.

## Task

Reorder `registry.register(...)` calls in `src/index.ts` to match
`PSystemBuilder.java`'s factory order, and add a test that pins the order
against that citation so it cannot drift back.

Write the test first (TDD).

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/PSystemBuilder.java:130-165`
  — the `factories.add(...)` sequence. **Read the whole run**, not just the
  first few: order among the types we implement is what matters
- `src/index.ts:70-87` — the current registration block
- `src/core/dispatcher.ts:245-270` — `resolve()`, so you can see exactly how
  order is consumed (first `accepts()` true wins)
- `../decisions.md#d1`

## Interface contract

None produced. Consumes T1's `routing-baseline.json` as the measurement
instrument.

## Write-set

- `src/index.ts`
- `tests/unit/core/registration-order.test.ts` (new)

Nothing else. If a file outside this set needs changing, **STOP and report it** rather than changing it.

## Acceptance criteria

1. Given `src/index.ts`, when the registration block is read, then the order
   of the plugins we implement matches `PSystemBuilder.java`'s relative order,
   and the test carries that `file:line` citation in a comment
2. Given the routing gate re-run, then the set of fixtures that **closed** and
   the set that **opened** are each recorded in the journal by slug and bucket
3. Given any fixture that **newly** misroutes, then **STOP** — do not re-pin,
   do not proceed to batch 3. A rise is the regression the gate exists to catch
4. Given the 482 promoted zero-diff fixtures across the 10 `ratchet.json`
   files, then **zero** are de-promoted

## Quality bar

All four gates green. Expect `npm test` to move: golden ratchets for engines
that gain or lose fixtures may change. **Do not re-pin anything here** — that
is batch 5's. If a ratchet fails because a fixture moved engine, record it and
judge it against AC3 and AC4.

## Observability

N/A — no new observable operations. The measurement surface is T1's gate.

## Rollback

Reversible, but **not independently**: reverting this without batch 5's
re-pins leaves baselines pinned to output that no longer exists. Revert the
batch range, not the task.

## Boundaries

- **Always:** cite `PSystemBuilder.java`'s `file:line` in the order test
- **Never:** change any `accepts()` implementation here — that is batch 4;
  re-pin any baseline; touch `src/core/dispatcher.ts` (that is T3)
- **Ask first:** if upstream's order cannot be expressed because this port has
  a plugin upstream has no counterpart for. Place it, record where and why,
  and do not silently interleave it among the ported ones

## Commit

One commit: `fix(T2): register diagram plugins in upstream's factory order`
