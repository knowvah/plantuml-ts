# T9 — D dotted-name namespaces

**Agent:** typescript-pro (sonnet, effort high) · **Depends on:** T6 ·
parallel with T7/T8 if write-sets are disjoint.

## Fixtures

bejusa-95-gafo325, runane-30-vena766, vusute-48-xono099, pisobo-93-sipa138

## Mechanisms

T6 fills from `diagnosis/D.md`.

## Write-set

T6 fills. Plus tests.

## Read-set

`diagnosis/D.md`, `decisions.md` D2, D4; `svek-N.dot` for each fixture
(`test-results/dot-cache/class/<slug>/`).

## Acceptance criteria

- Given each fixture, when it renders, then its edge geometry matches the
  jar (the Δ20 offset is gone)
- Given DOT emission changed, when `tests/oracle/class-dot-parity.test.ts`
  runs, then it is still 711/712 and these fixtures' DOT equals `svek-N.dot`
- Given a parser change, when the class unit suite runs, then no existing
  namespace test changes expectation without a journaled Java citation

## Observability · Rollback

N/A. Reversible — layout moves for dotted-name fixtures only; the close
task's pin-diff proves the reach.
