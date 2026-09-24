# T7 — S structural singletons

**Agent:** typescript-pro (sonnet, effort high) · **Depends on:** T6 ·
parallel with T8/T9 if write-sets are disjoint.

## Fixtures

sugifi-33-xefe083, sumule-00-pefa744, xumofu-43-fode658,
fumalu-64-vude116, rakuci-96-tuti371, pibifa-14-leno075,
begico-70-guva302, rojoxi-79-vimu822 (as re-grouped by T6)

## Mechanisms

T6 fills this from `diagnosis/S.md`: one line per mechanism id with its
Java `file:line` and TS `file:line`.

## Write-set

T6 fills. Plus the tests beside each changed file.

## Read-set

`diagnosis/S.md` (this task's mechanism sections only), `decisions.md` D2,
D3; prior mission `decisions.md` D7 (dense uid re-numbering with phantom
slots — keep that design; add slots, do not replace the counter).

## Acceptance criteria

- Given each fixture, when it renders, then its structural diff count is 0
- Given a uid-tick mechanism, when its test runs, then it asserts the exact
  `@id` sequence the jar emits, citing the Java line that burns the tick
- Given the 560 conformant fixtures, when render-all runs, then none leaves
  conformant

## Observability · Rollback

N/A — no new observable operations. Reversible (revert the commit).
