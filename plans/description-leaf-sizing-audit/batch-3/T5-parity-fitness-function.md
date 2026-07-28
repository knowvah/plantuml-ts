# T5 — Parity fitness function

## Context

`architecture.md`: "Express every architectural constraint as a
lint/import check/test — not code review." The renderer/sizer parity gap
recurred FOUR times under code review. This test is the constraint made
executable.

## Task

A test that fails when a `resolveElement*` is referenced from a renderer
module and from no sizer module, unless it is allow-listed with a reason.

## Write-set

- `tests/architecture/sizer-renderer-parity.test.ts` (new; create the
  directory if absent)

## Read-set

- `planning/sizer-renderer-parity.md` — the `size-neutral` rows seed the
  allow-list verbatim
- `decisions.md#adr-3` — including its KNOWN LIMIT
- `src/core/theme-element-resolve.ts` — the resolver list

## Acceptance criteria

- Given a `resolveElement*` referenced from `renderer-*.ts` or
  `EntityImageDescription*.ts` but from no sizer module, when the test
  runs, then it FAILS naming the resolver
- Given an allow-listed resolver, then the entry carries a written reason
  string, and an entry with an empty reason fails the test
- Given a resolver added to `theme-element-resolve.ts` in future and
  wired only to the renderer, then this test fails (verify by temporarily
  adding one, then removing it)
- Given the test file's doc comment, when read, then it states plainly
  that this covers **only resolver-shaped** instances — `wrapWidth`, the
  creole lexer and the use-case point fit would ALL have passed it — so
  it is a partial guard, not proof of parity
- Given the whole suite, then `npm test` passes

## Observability

This task IS the guard. It adds no runtime signal; it adds a CI signal.

## Rollback

Reversible — a test-only addition. If it proves flaky against the
module-name heuristic, prefer TIGHTENING the file globs over deleting the
test; a deleted guard is how instance #5 happens.

## Quality bar

All four gates. The test must fail for the right reason before it passes
— write it red first (`testing.md` TDD), with a deliberately unwired
resolver, and record that you saw it fail.
