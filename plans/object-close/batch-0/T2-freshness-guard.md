# T2 — oracle freshness guard

## Prior observations

The bug this guard exists to prevent already happened and went unnoticed:
`svg-conformance-census.ts object` reported 0/80 against a stale cache, and no
gate failed. See [T1](T1-recapture-oracle.md)'s prior-observations section for
the full mechanism.

Related known blind spot, worth reading before designing the assertion: the
SVG normalizer's DOM parse hides entity-form and colour-form differences from
the gate. A guard that compares through the same normalizer inherits that
blindness — compare **bytes**, or a hash of them, not a parsed DOM.

## Context

`decisions.md` D4. A gate that cannot detect stale input is not a gate.

## Task

Add an assertion that re-renders one sentinel object fixture through
`oracle/dist/plantuml-oracle.jar` and fails loudly, naming the slug, when the
committed cached oracle diverges from that fresh render.

Design notes, not prescriptions:

- One sentinel is enough — staleness is a whole-cache property, not
  per-fixture. Pick a small, fast, structurally simple fixture;
  `beruju-17-jigi548` is the one already verified by hand.
- Compare raw bytes, per the blind-spot note above.
- The jar invocation costs ~1s. If that is unacceptable inside `npm test`,
  wire it into `scripts/svg-conformance-census.ts` as a preflight instead and
  say so in the doc comment — but it must run somewhere that CI executes.
- Skip gracefully with a clear message when the jar is absent, matching the
  existing convention in the oracle suites.

## Write-set

- `tests/oracle/svg-conformance/oracle-freshness.test.ts` (new)
- `scripts/svg-conformance-census.ts` (preflight wiring, if that route is
  chosen)

## Read-set

- `scripts/oracle-render.sh:1-30`
- `tests/oracle/svg-conformance/object.golden.ratchet.test.ts:1-30` — the
  graceful-degradation and doc-comment convention every oracle suite follows.

## Architecture decisions in force

`decisions.md` D4.

## Interface contracts

None consumed downstream.

## Acceptance criteria

- Given a cached oracle matching the pinned jar, when the guard runs, then it
  passes.
- Given one cached `in.svg` **temporarily** reverted to the pre-0.2.0 verbose
  form, when the guard runs, then it fails and the message names that slug.
  This must be *demonstrated during the task* and the demonstration recorded
  in the decision journal — asserting the guard works without exercising its
  failure path repeats the original bug.
- Given no jar on disk, when the guard runs, then it skips with a message
  saying why, and does not fail.
- Given the guard is added, when `npm test` runs, then total wall-clock grows
  by under ~5s.

## Observability requirements

This task *is* an observability control. No dashboard panel exists to update;
record in the decision journal where the guard runs (test suite vs census
preflight) and why.

## Rollback

**Reversible** — single commit, no data migration.

## Quality bar

All four gates green, unpiped. TDD applies literally here: write the guard,
watch it fail against a deliberately staled file, then restore the file and
watch it pass.

## Boundaries

- **Always:** exercise the failure path before declaring the task done;
  restore any file staled for the demonstration.
- **Ask first:** extending the guard to other types' caches.
- **Never:** leave a staled file behind; compare through the DOM normalizer.

## Commit format

```
test(oracle): fail loudly when the cached object oracle goes stale
```
