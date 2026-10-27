# T4d — port `net.sourceforge.plantuml.real` to `src/core/real/`

Agent: `typescript-pro` (sonnet), worktree `gep-T4d` (branch `gep/T4d`, off
the batch-3 close). Commit: `feat(core): port the real constraint package (T4d)`.
Read [../task-contract.md](../task-contract.md) (with `src/core/real/` in
place of `src/diagrams/gantt/` and tests under `tests/unit/core/real/`),
decisions D1, D5, D12 + Amendment 2.

## Port (whole files, upstream names)
From `~/git/plantuml/src/main/java/net/sourceforge/plantuml/real/` →
`src/core/real/<Name>.ts`: `AbstractReal` (67), `PositiveForce` (106),
`Real` (56), `RealDebug` (112), `RealDelta` (77), `RealDeltaLive` (78),
`RealImpl` (72), `RealLine` (184), `RealMax` (134), `RealMiddle` (81),
`RealMiddle2` (75), `RealMin` (95), `RealMoveable` (74), `RealOrigin` (41),
`RealUtils` (80). (`package-info.java` has no code.)

## Write-set
`src/core/real/<the 15 names>.ts`; `tests/unit/core/real/<same>.test.ts`
(one per file; an interface-only file may share its implementer's test);
`tests/unit/core/real/upstream/RealMaxRecursionGuardTest.test.ts` (port of
`~/git/plantuml/src/test/java/net/sourceforge/plantuml/real/RealMaxRecursionGuardTest.java`,
every assertion kept); `docs/catalog.md` (`npm run catalog`).

## Read-set
The 15 Java files and the upstream test above. Callers, for context only:
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TaskDrawRegistryData.java:60-62,70,113,151`.
Do NOT read or import `src/diagrams/sequence/sequence-real-line.ts` (engines
may not be imported from core; it is a condensed, non-file-for-file port —
do not copy its shape). Do not edit anything under `src/diagrams/`.

## Notes (orchestrator rulings — follow them, cite them in the JSDoc)
- The package is one import cycle. ESM evaluates modules in order: a
  `class X extends AbstractReal` whose module is evaluated before
  `AbstractReal.ts` throws a TDZ ReferenceError. Arrange imports so every
  base class module has no runtime import of its subclasses (type-only
  imports are free); if a factory in a base module must construct a
  subclass, the precedent is gantt T4b's `NGMTaskBase.ts` split (journal
  row 34) — only if unavoidable, and report it.
- `RealDebug`: `CAPTURE_CREATION_POINT` reads `System.getProperty`/`getenv`
  (`RealDebug.java:80-81`). `src/` may not read `process.env`; the port is a
  browser-safe library, the same situation as upstream's TeaVM build
  (`RealDebug.java:64-75`: `create()` returns `null`). Port it as a constant
  `false` with that citation; keep `create()`, `printCreationStackTrace()`
  and the `RealDebug | null` fields so the structure matches.
- `System.err.println` diagnostics (`PositiveForce.java:66,73-77,95,100`,
  `RealLine.java:121,124`, `RealMax.java:99-101`) are not mirrored (no console
  in `src/`, eslint `no-console`; precedent `src/core/elk/MyElkEdge.ts:21-23`),
  but every throw, rethrow and side effect around them is kept
  (`PositiveForce.java:72-78` catch-and-rethrow; `RealMax.java:102`,
  `RealLine.java:113` `IllegalStateException` messages verbatim).
- `RealMiddle.java:39` `::remove folder when __HAXE__` is a HAXE marker:
  ignored (not `__MIT__`). `TeaVM.a()` assertion guards
  (`RealMiddle2.java:47`) are dropped as assertion-only (T1f/T3c precedent),
  noted in the JSDoc.
- Collections: `RealLine.all` is a `HashSet<AbstractReal>` of identity-hashed
  objects — iteration order in Java is already non-deterministic, so check
  every loop over it is order-independent (min/max) and say so in a comment
  with `file:line`; if any loop's result depends on order, stop and report.
  `RealLine.java:79` `counter` feeds only the debug print. `ArrayList` →
  array.
- Java `double` arithmetic → `number` (identical IEEE-754). Keep every
  `UnsupportedOperationException` as a thrown `Error` with a recognisable
  name; `IllegalArgumentException` / `IllegalStateException` likewise.

## Acceptance
- Given every assertion in `RealMaxRecursionGuardTest.java`, its vitest port
  passes with the same values and exception messages.
- Given an origin with `addFixed`/`addAtLeast` chains, `RealUtils.max/min`
  and `RealLine.compile`, the tests assert the exact `getCurrentValue()`
  numbers traced by hand from the Java (cite `file:line`), including a
  `PositiveForce` that must move a point and one that is already satisfied,
  and the `"Infinite Loop?"` throw at `RealLine.java:113`.
- Given each ported file, every public member exists with the same name and
  behaviour.
- `npm run typecheck` clean, eslint clean, prettier on the explicit file
  list, coverage ≥ 90/90/90 on `src/core/real/`; `npx vitest run
  tests/architecture --maxWorkers=2` green (layering).

Observability: N/A. Rollback: Reversible (revert the task commit).
