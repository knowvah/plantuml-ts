# T4 — Ratchet adjudicator (the D5 instrument)

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML. The sequence fidelity
gate (`tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.test.ts`)
fails any fixture whose `weightedScore` rises above its pin in
`oracle/goldens/svg-sequence/diff-baseline.json`. Its header states "a rise has
no benign reading left."

**That is true within one comparison and false across a change that grows our
output** — which is exactly what this mission does to 195 fixtures. Decision D5
requires every rise to be adjudicated rather than accepted or rejected
wholesale. This task builds the instrument, in Batch 1, **before** the change
that needs it.

## Task

Create `scripts/sequence-ratchet-adjudicate.ts`. For each fixture under
`test-results/dot-cache/sequence/`, at two git refs (a `--base` and the working
tree), measure:

- `weightedScore` against the committed golden, and
- **top-level child-count distance to the golden**: `|actual − expected|` for
  the `svg/g[1][childCount]` comparison.

Classify every fixture whose score rose:

| child-count distance | classification |
|---|---|
| decreased | `artefact` — re-pinning is correct |
| increased | `regression` — real defect, diagnose |
| unchanged | `regression` — real defect, diagnose |
| no top-level childCount short-circuit | `inconclusive` — diagnose |

Emit a JSON report plus a human-readable table. Report via `console.log` and
document in the script header that reading it requires `--reporter=verbose`
when run under vitest.

## Write-set

- `scripts/sequence-ratchet-adjudicate.ts` (new)
- `tests/unit/scripts/sequence-ratchet-adjudicate.test.ts` (new)

## Read-set

- `tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.test.ts:150-280`
  — how it renders, compares, and short-circuits
- `tests/oracle/svg-conformance/normalize.ts` and the `compare` module's
  `compareNodes` — `compare.ts:198,229,404`, the three short-circuits
- `tests/helpers/fixture-include-store.ts`, `tests/helpers/render.ts`
- `scripts/svg-conformance-census.ts:168` — the store the census uses
- `../prior-observations.md#1` and `#2` — **read both before writing any
  measurement code**

## Prior observations — bear directly on this write-set

1. **Score comparability.** `compareNodes`' short-circuits charge
   `units(actual) + units(expected)`, so the same "still mismatched" verdict
   costs strictly more once our side grows. Worked example
   `sequence/bexoce-95-vibe195`: 622 → 950, entire delta one diff, child count
   went `actual=14 expected=59` → `actual=60 expected=59`. Off by one instead
   of by 45, score up 328. **This fixture is the classifier's canonical
   `artefact` test case.**
2. **Harness hazards.** `renderSync` returns `errorSvg` with no
   `data-diagram-type` when `options.includeStore` is absent, and
   `resolveMeasurer` defaults to `CanvasMeasurer`, unimplemented under jsdom.
   Either turns a resolution or layout failure into a false measurement. **Pass
   `fixture-include-store.ts` and `DeterministicMeasurer` explicitly.**
3. **`diffCount` is not monotonic** and is informational only. Adjudicate on
   `weightedScore` and child-count distance, never on `diffCount`.

## Architecture decisions in force

D5 (locked). The classifier's verdict is what authorises a re-pin in T18/T19;
nothing else does.

## Interface contracts

Consumed by T18 and by every batch close. Emit:

```
{ slug: string,
  baseScore: number|null, liveScore: number|null,
  baseChildDistance: number|null, liveChildDistance: number|null,
  verdict: 'artefact'|'regression'|'inconclusive'|'unchanged'|'improved' }
```

`null` scores mean the fixture errored at that ref; report, never coerce to a
number.

## Acceptance criteria

- Given `bexoce-95-vibe195`'s recorded numbers (622→950, distance 45→1), when
  classified, then verdict is `artefact`.
- Given a fixture whose score rises and whose child-count distance increases,
  then verdict is `regression`.
- Given a fixture that errors at one ref, then its score is `null` and it is
  not silently scored 0.
- Given a run without an include store, when the script starts, then it fails
  loudly rather than measuring — the store is not optional.

## Observability

This task **is** the observability work for the mission. It produces the report
that every batch close and T18 read. No other instrumentation.

## Rollback

**Reversible.** A script with no production callers; nothing in `src/`.

## Quality bar

All four gates green. The script lives in `scripts/`, not `src/` — the
browser-safety rules (no Node built-ins, no `process.env`) do **not** apply
there, but determinism does: no `Date.now()` or `Math.random()` in any
comparison path.

## Boundaries

- **Always**: pass the include store and `DeterministicMeasurer` explicitly.
- **Never**: adjudicate on `diffCount`; never coerce an error to a score.
- **Ask first**: if a fixture's rise has no top-level childCount short-circuit
  at all, it is `inconclusive` — do not guess a verdict for it.

## Commit

`feat(T4): add the sequence ratchet adjudicator`

Body required: state what the classifier decides and why a rise is not
self-evidently a regression, citing the T13 measurement.
