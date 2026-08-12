# T1 — re-capture the object oracle cache, establish the true baseline

## Prior observations

Measured during planning, 2026-08-11 — treat as established, do not re-derive:

- `test-results/dot-cache/object/*/in.svg` is **stale**: it predates the 0.2.0
  SVG-reduction port (upstream `ba68279df92`, `4f3a0dcc63b`; see
  `DIVERGENCES.md` → "SVG emission tracks upstream's reduced form"). The stale
  form carries `font-family`/`lengthAdjust` on every `<text>`, `#000000`, and
  4-decimal coordinates.
- Verified on `beruju-17-jigi548`: rendering `in.puml` through
  `oracle/dist/plantuml-oracle.jar` **today** produces output byte-identical
  to the pinned golden `oracle/goldens/svg-object/beruju-17-jigi548/golden.svg`.
  The jar has not moved; only the cache is old.
- Consequence: `svg-conformance-census.ts object` reports 0/80, an artifact.
  The true baseline, measured against a fresh render, is **23/80**.
- These files are **tracked in git** (316 files for object). This is a real
  committed change, not a scratch regeneration.
- Staleness is repo-wide (`class`, `state`, `usecase` also stale; `component`
  fresh) — **out of scope**, see the follow-up note at the bottom.

## Context

Every downstream number in this mission is measured against this cache. It is
the mission's data model; batch-1's audit and batch-2's loop are meaningless
until it is correct.

## Task

1. Re-render all 80 object fixtures through `scripts/oracle-render.sh`,
   writing back into `test-results/dot-cache/object/<slug>/in.svg`. Use the
   existing `in.puml` in each directory as the source — do not re-derive
   fixtures from the corpus.
2. Regenerate `tests/oracle/svg-conformance/parity-object.json` via
   `scripts/svg-parity-survey.ts` with `--out` and object as the type arg.
   **Use `--out` and merge** — a single-type survey run without it truncates
   the other types' rows.
3. Re-run the object census and record the true per-fixture table in the
   decision journal.

## Write-set

- `test-results/dot-cache/object/*/in.svg` (80 files)
- `tests/oracle/svg-conformance/parity-object.json`
- `plans/object-close/decision-journal.md`

## Read-set

- `scripts/oracle-render.sh:1-30` — the wrapper's doc comment explains why a
  hand-typed `java -jar` is forbidden here.
- `scripts/svg-parity-survey.ts` — `--out` semantics.
- `DIVERGENCES.md` → "SVG emission tracks upstream's reduced form (0.2.0)".

## Architecture decisions in force

`decisions.md` D1, D4. The re-capture is what D4's guard will assert against.

## Interface contracts

Emitted to the decision journal and consumed by T3/T4/T5:

```jsonc
{
  "baselineZeroDiff": 23,              // integer, the real census number
  "perFixture": [
    {
      "slug": "string",
      "diffs": 0,                      // integer, compareSvg diff count
      "maxNumericDelta": 0.0,          // number; null when every diff is non-numeric
      "nonNumericPaths": ["string"]    // may be empty
    }
  ]                                    // exactly 80 entries
}
```

## Acceptance criteria

- Given the re-captured cache, when `npx tsx scripts/svg-conformance-census.ts
  object` runs, then it reports **≥23** zero-diff, never 0.
- Given the object DOT gate, when re-run after the re-capture, then it reports
  **exactly 78/80 EQUAL** — unchanged.
- Given any re-captured `in.svg`, when compared against its pinned golden in
  `oracle/goldens/svg-object/`, then the only differences are ones `compareSvg`
  normalizes (all 24 ratchet tests still pass).
- Given the four sibling frozen DOT counts, when re-run, then all four are
  unmoved.
- Given the regenerated `parity-object.json`, when read, then it contains 80
  fixture rows and a `generatedAt` later than `2026-07-19`.

## Observability requirements

This task **is** the observability fix. It must leave behind, in the decision
journal: the true baseline integer, the full 80-row per-fixture table matching
the contract above, and an explicit statement of which fixtures changed
verdict versus G3's close.

## Rollback

**Reversible, but coupled.** This commit rewrites 80 tracked oracle files;
reverting it also reverts the baseline every later commit was measured
against. Revert T1 together with everything after it, never alone. Note this
in the commit body.

## Quality bar

All four gates green, unpiped. If the census swings by more than a couple of
fixtures in either direction versus the 23/80 recorded above, **STOP** — that
would mean the jar moved, not just the cache (stop condition 9).

## Boundaries

- **Always:** render via `scripts/oracle-render.sh`; keep each fixture's
  existing `in.puml`.
- **Ask first:** re-capturing any other type's cache.
- **Never:** hand-type `java -jar`; edit an `in.svg` by hand; delete a fixture
  directory.

## Follow-up to file, not to fix

`class`, `state` and `usecase` dot-caches carry the same staleness. Record
this as a tracked follow-up in the decision journal and in `TRACKER.md`.
Re-capturing them here would move G2/G4 frozen counts mid-mission — stop
condition 2.

## Commit format

```
chore(object): re-capture the oracle cache from the pinned jar

The committed cache predated the 0.2.0 SVG-reduction port, so the SVG
census read 0/80 against it. The jar has not moved: a fresh render of
beruju-17-jigi548 is byte-identical to its pinned golden. True baseline
is 23/80.

Reverting this commit also reverts the baseline for everything after it.
```
