# T0c: `Direction.getWBSDirection` in its upstream home (D6)

Prepend [../task-preamble.md](../task-preamble.md).

## Task (TDD)
`src/core/abel/Direction.ts` says `getWBSDirection` was left out because it needs the unported
`RegexResult`/`Constant` machinery. The port's commands pass capture groups directly, so port
the function over its inputs rather than over `RegexResult`:
1. Read `~/git/plantuml/src/main/java/net/sourceforge/plantuml/utils/Direction.java:44-56`
   (`getWBSDirection(RegexResult)`: reads `WBS_DIRECTION_1`/`_2` through `getLazzy`; `<` ⇒
   `LEFT`, otherwise `RIGHT`) and `utils/Constant.java` for `WBS_DIRECTION`.
2. Add `getWBSDirection(dir1: string | undefined, dir2: string | undefined): Direction` to
   `Direction.ts` with the Java quoted in its `@see`; update the file's doc comment.
3. Tests: `<` in group 1, `<` in group 2, `>` in either, both absent, both present (`getLazzy`
   returns the first non-null group — pin that order).
4. `npm run catalog`; commit `feat(core): port Direction.getWBSDirection`.

## Write-set
`src/core/abel/Direction.ts`, its unit test file under `tests/unit/core/abel/` (create or extend
the existing one — find it first), `docs/catalog.md`. Any OTHER file is a stop.

## Interface contract (consumed by T3a, T3b)
`getWBSDirection(dir1: string | undefined, dir2: string | undefined): Direction` — `'LEFT'` when
the first non-undefined group is `<`, else `'RIGHT'`.

## Acceptance
- Given `('<', undefined)` or `(undefined, '<')`, then `LEFT`; given `('>', undefined)` or
  `(undefined, undefined)`, then `RIGHT`; given `('>', '<')`, then whatever the Java's
  `getLazzy` order gives (quote it).
- Given `tests/architecture`, then layering holds.

**Observability:** N/A. **Rollback:** Reversible.
