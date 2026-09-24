# T8 — S paint / text singletons

**Agent:** typescript-pro (sonnet, effort high) · **Depends on:** T6 ·
parallel with T7/T9 if write-sets are disjoint.

## Fixtures

nesivu-99-cexu403, nisune-86-faji869, tuguku-78-zega630,
xoxuni-96-fere626, gabejo-44-juki791, guxode-39-dobi371,
vuresa-33-kumu160, rezoba-58-xaze387, jojime-80-savu279 (as re-grouped by T6)

## Mechanisms

T6 fills from `diagnosis/S.md`.

## Write-set

T6 fills. Plus tests.

## Read-set

`diagnosis/S.md` (this task's sections), `decisions.md` D2–D4; prior
mission `decisions.md` D8 (colours are `Paint` at the class seam — route
new colour handling through it).

## Acceptance criteria

- Given each fixture, when it renders, then the fill/stroke/font/path
  attribute the diagnosis names equals the jar's value
- Given a colour or font default, when its test runs, then it asserts the
  literal jar value and cites the Java line (skin/theme default) it comes from
- Given the 560 conformant fixtures, when render-all runs, then none leaves
  conformant

## Observability · Rollback

N/A. Reversible.
